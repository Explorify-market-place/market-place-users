import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { processRefund } from "@/lib/razorpay";
import { getBookingById } from "@/lib/db-helpers";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDb, BOOKINGS_TABLE } from "@/lib/dynamodb";
import type { ExpressionAttributeValues } from "@/types/dynamodb-utils";

export async function POST(request: NextRequest) {
  // Wrap everything in try-catch to ensure we always return JSON
  try {
    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { bookingId, vendorCancellation, vendorId } = body;

    const session = await auth();

    // Require authentication for user-initiated cancellations
    if (!vendorCancellation && !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    // Vendor cancellation verification: must provide vendorId and must own the plan
    if (vendorCancellation) {
      if (!vendorId) {
        return NextResponse.json(
          { error: "vendorId is required for vendor cancellations" },
          { status: 400 }
        );
      }

      // Fetch the plan to verify vendor ownership
      const { GetCommand } = await import("@aws-sdk/lib-dynamodb");
      const { PLANS_TABLE } = await import("@/lib/dynamodb");

      const planCommand = new GetCommand({
        TableName: PLANS_TABLE,
        Key: { planId: booking.planId },
      });

      const planResult = await dynamoDb.send(planCommand);
      const plan = planResult.Item;

      if (!plan) {
        return NextResponse.json({ error: "Plan not found" }, { status: 404 });
      }

      if (plan.vendorId !== vendorId) {
        return NextResponse.json(
          { error: "Unauthorized: You do not own this plan" },
          { status: 403 }
        );
      }
    }

    // Verify user owns this booking or is admin (for user cancellations)
    if (
      !vendorCancellation &&
      session &&
      booking.userId !== session.user.id &&
      session.user.role !== "admin"
    ) {
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

    // Vendor cancellation: always 100% tripCost refund
    let refundPercentage = 0;
    let refundAmount = 0;
    let updatedVendorPayoutAmount = 0;

    if (vendorCancellation) {
      // Vendor cancelled: full refund, vendor gets nothing
      refundPercentage = 100;
      refundAmount = booking.tripCost; // 100% of trip cost
      updatedVendorPayoutAmount = 0; // Vendor's fault, no payout
    } else {
      // User cancellation: tiered refund policy
      const tripStartDate = new Date(booking.tripDate);
      const now = new Date();
      const daysUntilTrip = Math.ceil(
        (tripStartDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Check if trip has already passed
      if (tripStartDate < now) {
        return NextResponse.json(
          { error: "Trip has already started. Refund not available." },
          { status: 400 }
        );
      }

      // Tiered refund policy based on days until trip
      if (daysUntilTrip >= 15) {
        refundPercentage = 100; // Full refund
      } else if (daysUntilTrip >= 8 && daysUntilTrip <= 14) {
        refundPercentage = 50; // 50% refund
      } else if (daysUntilTrip >= 1 && daysUntilTrip <= 7) {
        refundPercentage = 0; // No refund
      }

      if (refundPercentage === 0 && booking.bookingStatus !== "cancelled") {
        return NextResponse.json(
          {
            error: `Refund not available. Cancellations must be made at least 8 days before the trip for a 50% refund, or 15+ days for a full refund.`,
          },
          { status: 400 }
        );
      }

      // Calculate refund amount (percentage of tripCost)
      const tripCostRefund = Math.round(
        (booking.tripCost * refundPercentage) / 100
      );
      refundAmount = tripCostRefund;

      // Calculate updated vendor payout amount
      const remainingTripCost = booking.tripCost - tripCostRefund;
      updatedVendorPayoutAmount = Math.round(
        remainingTripCost *
          ((100 -
            (booking.platformCut
              ? (booking.platformCut / booking.tripCost) * 100
              : 15)) /
            100)
      );
    }

    if (!booking.razorpayPaymentId) {
      return NextResponse.json(
        { error: "Payment ID not found for refund" },
        { status: 400 }
      );
    }

    // Validate refund amount
    if (refundAmount <= 0) {
      return NextResponse.json(
        { error: "Refund amount must be greater than 0" },
        { status: 400 }
      );
    }

    if (refundAmount > booking.totalAmount) {
      return NextResponse.json(
        { error: "Refund amount cannot exceed total amount paid" },
        { status: 400 }
      );
    }

    console.log("Refund request:", {
      bookingId,
      paymentId: booking.razorpayPaymentId,
      refundAmount,
      refundPercentage,
      tripCost: booking.tripCost,
      totalAmount: booking.totalAmount,
      vendorCancellation,
    });

    // Update booking status to processing with refund details
    await updateBookingRefundStatus(
      bookingId,
      "processing",
      refundAmount,
      refundPercentage,
      updatedVendorPayoutAmount
    );

    try {
      // Process refund with Razorpay
      const refund = await processRefund(
        booking.razorpayPaymentId,
        refundAmount,
        {
          bookingId,
          reason: vendorCancellation
            ? "Vendor cancelled departure"
            : `${refundPercentage}% refund - Cancellation policy`,
        }
      );

      // Update booking with refund details
      await updateBookingRefundStatus(
        bookingId,
        refund.status === "processed" ? "completed" : "processing",
        refundAmount,
        refundPercentage,
        updatedVendorPayoutAmount
      );

      return NextResponse.json(
        {
          success: true,
          refundId: refund.id,
          refundAmount,
          refundPercentage,
          message: `Refund processed successfully. ${refundPercentage}% of trip cost refunded.`,
        },
        { status: 200 }
      );
    } catch (refundError) {
      // Update booking status to failed
      await updateBookingRefundStatus(
        bookingId,
        "rejected",
        refundAmount,
        refundPercentage,
        updatedVendorPayoutAmount
      );
      console.error("Error processing refund:", refundError);

      // Extract error message from Razorpay error
      const errorMessage =
        refundError instanceof Error
          ? refundError.message
          : "Unknown refund error";

      return NextResponse.json(
        {
          error: "Failed to process refund",
          details: errorMessage,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in refund endpoint:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: "Failed to process refund request",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

// Helper function to update booking refund status
async function updateBookingRefundStatus(
  bookingId: string,
  refundStatus: "none" | "requested" | "processing" | "completed" | "rejected",
  refundAmount?: number,
  refundPercentage?: number,
  vendorPayoutAmount?: number
) {
  const updateExpression: string[] = ["refundStatus = :refundStatus"];
  const expressionAttributeValues: ExpressionAttributeValues = {
    ":refundStatus": refundStatus,
  };

  if (refundAmount !== undefined) {
    updateExpression.push("refundAmount = :refundAmount");
    expressionAttributeValues[":refundAmount"] = refundAmount;
  }

  if (refundPercentage !== undefined) {
    updateExpression.push("refundPercentage = :refundPercentage");
    expressionAttributeValues[":refundPercentage"] = refundPercentage;
  }

  if (vendorPayoutAmount !== undefined) {
    updateExpression.push("vendorPayoutAmount = :vendorPayoutAmount");
    expressionAttributeValues[":vendorPayoutAmount"] = vendorPayoutAmount;
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
