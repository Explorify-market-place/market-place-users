import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { processRefund } from "@/lib/razorpay";
import { getBookingById } from "@/lib/db-helpers";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDb, BOOKINGS_TABLE } from "@/lib/dynamodb";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Verify user owns this booking or is admin
    if (booking.userId !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized to refund this booking" },
        { status: 403 }
      );
    }

    // if payment was not completed, return error
    if (booking.paymentStatus !== "completed") {
      return NextResponse.json(
        { error: "Only completed payments can be refunded" },
        { status: 400 }
      );
    }

    // if already refunded, return error
    if (booking.refundStatus === "completed") {
      return NextResponse.json(
        { error: "Booking already refunded" },
        { status: 400 }
      );
    }

    // if vendor payout already completed, return error
    if (booking.vendorPayoutStatus === "completed") {
      return NextResponse.json(
        { error: "Cannot refund after vendor payout is completed" },
        { status: 400 }
      );
    }

    // Calculate hours until trip start
    const tripStartDate = new Date(booking.tripDate);
    const now = new Date();
    const hoursUntilTrip =
      (tripStartDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Simple policy: Full refund if cancelled 24+ hours before trip
    if (tripStartDate < now) {
      return NextResponse.json(
        { error: "Trip has already started. Refund not available." },
        { status: 400 }
      );
    }

    if (hoursUntilTrip < 24 && booking.bookingStatus !== "cancelled") {
      return NextResponse.json(
        {
          error: "Refund must be requested at least 24 hours before trip start",
        },
        { status: 400 }
      );
    }

    // Full refund for all eligible cancellations
    const refundAmount = booking.totalAmount;

    if (!booking.razorpayPaymentId) {
      return NextResponse.json(
        { error: "Payment ID not found for refund" },
        { status: 400 }
      );
    }

    // Update booking status to processing
    await updateBookingRefundStatus(bookingId, "processing", refundAmount);

    try {
      // Process refund with Razorpay
      const refund = await processRefund(
        booking.razorpayPaymentId,
        refundAmount,
        {
          bookingId,
          reason: "Customer requested refund",
        }
      );

      // Store refund ID immediately, status will be updated via webhook
      const updateData: any = {
        refundRazorpayId: refund.id,
        refundAmount,
      };

      // If Razorpay immediately marks as processed (test mode), update status
      if (refund.status === "processed") {
        updateData.refundStatus = "completed";
        updateData.refundDate = new Date().toISOString();
      }

      await updateBookingRefundStatus(
        bookingId,
        refund.status === "processed" ? "completed" : "processing",
        refundAmount
      );

      return NextResponse.json(
        {
          success: true,
          refundId: refund.id,
          refundAmount,
          message: "Refund processed successfully",
        },
        { status: 200 }
      );
    } catch (refundError) {
      // Update booking status to failed
      await updateBookingRefundStatus(bookingId, "rejected", refundAmount);
      console.error("Error processing refund:", refundError);
      return NextResponse.json(
        { error: "Failed to process refund" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in refund endpoint:", error);
    return NextResponse.json(
      { error: "Failed to process refund request" },
      { status: 500 }
    );
  }
}

// Helper function to update booking refund status
async function updateBookingRefundStatus(
  bookingId: string,
  refundStatus: "none" | "requested" | "processing" | "completed" | "rejected",
  refundAmount?: number
) {
  const updateExpression: string[] = ["refundStatus = :refundStatus"];
  const expressionAttributeValues: any = {
    ":refundStatus": refundStatus,
  };

  if (refundAmount !== undefined) {
    updateExpression.push("refundAmount = :refundAmount");
    expressionAttributeValues[":refundAmount"] = refundAmount;
  }

  if (refundStatus === "completed") {
    updateExpression.push("refundDate = :refundDate");
    expressionAttributeValues[":refundDate"] = new Date().toISOString();
  }

  const command = new UpdateCommand({
    TableName: BOOKINGS_TABLE,
    Key: { bookingId },
    UpdateExpression: `SET ${updateExpression.join(", ")}`,
    ExpressionAttributeValues: expressionAttributeValues,
  });

  await dynamoDb.send(command);
}
