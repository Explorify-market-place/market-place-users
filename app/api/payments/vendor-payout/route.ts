import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { transferToVendor } from "@/lib/razorpay";
import { getBookingById, getPlanById, getUserById } from "@/lib/db-helpers";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDb, BOOKINGS_TABLE } from "@/lib/dynamodb";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only admin or the vendor can trigger payout
    if (session.user.role !== "admin" && session.user.role !== "vendor") {
      return NextResponse.json(
        { error: "Unauthorized. Only admin or vendor can trigger payout." },
        { status: 403 }
      );
    }

    const { bookingId } = await request.json();

    if (!bookingId) {
      return NextResponse.json(
        { error: "bookingId is required" },
        { status: 400 }
      );
    }

    // Get booking details
    const booking = await getBookingById(bookingId);
    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Get plan details
    const plan = await getPlanById(booking.planId);
    if (!plan) {
      return NextResponse.json(
        { error: "Travel plan not found" },
        { status: 404 }
      );
    }

    // Verify vendor owns this plan (if vendor is making request)
    if (
      session.user.role === "vendor" &&
      plan.vendorId !== session.user.id
    ) {
      return NextResponse.json(
        { error: "Unauthorized. This booking does not belong to your plans." },
        { status: 403 }
      );
    }

    // Check if payment was completed
    if (booking.paymentStatus !== "completed") {
      return NextResponse.json(
        { error: "Payment not completed. Cannot process payout." },
        { status: 400 }
      );
    }

    // Check if already paid out
    if (booking.vendorPayoutStatus === "completed") {
      return NextResponse.json(
        { error: "Vendor payout already completed" },
        { status: 400 }
      );
    }

    // Check if refund was requested or completed
    if (
      booking.refundStatus === "requested" ||
      booking.refundStatus === "processing" ||
      booking.refundStatus === "completed"
    ) {
      return NextResponse.json(
        { error: "Cannot process payout. Refund is in progress or completed." },
        { status: 400 }
      );
    }

    // Check if trip has started (optional validation)
    const tripStartDate = new Date(booking.dateBooked);
    const now = new Date();
    if (tripStartDate > now && session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Trip has not started yet. Payout can only be processed after trip starts." },
        { status: 400 }
      );
    }

    // Get vendor details
    const vendor = await getUserById(plan.vendorId);
    if (!vendor) {
      return NextResponse.json(
        { error: "Vendor not found" },
        { status: 404 }
      );
    }
    /*
    * Check if vendor has Razorpay account ID
    * Note: In production, we should store this in vendorInfo.razorpayAccountId or a separate table
    * For now, we use a placeholder - we need to configure this properly
    */

    const vendorAccountId = (vendor.vendorInfo as any)?.razorpayAccountId || vendor.vendorInfo?.phoneNumber;
    if (!vendorAccountId) {
      return NextResponse.json(
        { 
          error: "Vendor Razorpay account not configured. Please add razorpayAccountId to vendorInfo." 
        },
        { status: 400 }
      );
    }

    // Calculate payout amount (already calculated during booking)
    const payoutAmount = booking.vendorPayoutAmount || booking.totalAmount * 0.85;

    // Update booking status to processing
    await updateVendorPayoutStatus(bookingId, "processing", payoutAmount);

    try {
    /*
      * Transfer money to vendor
      * Note: This requires vendor to have Razorpay account configured
      * In production, you might use Razorpay X for payouts or handle this differently
    */
      const transfer = await transferToVendor(
        vendorAccountId,
        payoutAmount,
        "INR",
        {
          bookingId,
          planId: booking.planId,
          vendorId: plan.vendorId,
        }
      );

      // Update booking with payout details
      await updateVendorPayoutStatus(bookingId, "completed", payoutAmount);

      return NextResponse.json(
        {
          success: true,
          transferId: transfer.id,
          payoutAmount,
          message: "Vendor payout processed successfully",
        },
        { status: 200 }
      );
    } catch (payoutError) {
      // Update booking status to failed
      await updateVendorPayoutStatus(bookingId, "failed", payoutAmount);
      console.error("Error processing vendor payout:", payoutError);
      return NextResponse.json(
        { error: "Failed to process vendor payout" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in vendor payout endpoint:", error);
    return NextResponse.json(
      { error: "Failed to process vendor payout request" },
      { status: 500 }
    );
  }
}

// Helper function to update vendor payout status
async function updateVendorPayoutStatus(
  bookingId: string,
  vendorPayoutStatus: "pending" | "processing" | "completed" | "failed",
  vendorPayoutAmount?: number
) {
  const updateExpression: string[] = ["vendorPayoutStatus = :vendorPayoutStatus"];
  const expressionAttributeValues: any = {
    ":vendorPayoutStatus": vendorPayoutStatus,
  };

  if (vendorPayoutAmount !== undefined) {
    updateExpression.push("vendorPayoutAmount = :vendorPayoutAmount");
    expressionAttributeValues[":vendorPayoutAmount"] = vendorPayoutAmount;
  }

  if (vendorPayoutStatus === "completed") {
    updateExpression.push("vendorPayoutDate = :vendorPayoutDate");
    expressionAttributeValues[":vendorPayoutDate"] = new Date().toISOString();
  }

  const command = new UpdateCommand({
    TableName: BOOKINGS_TABLE,
    Key: { bookingId },
    UpdateExpression: `SET ${updateExpression.join(", ")}`,
    ExpressionAttributeValues: expressionAttributeValues,
  });

  await dynamoDb.send(command);
}

