import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  verifyPaymentSignature,
  getPaymentDetails,
  processRefund,
} from "@/lib/razorpay";
import {
  createBooking,
  getPlanById,
  getDepartureById,
  incrementBookedSeats,
} from "@/lib/db-helpers";
import { DynamoDBBooking } from "@/lib/dynamodb";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  let paymentId: string | undefined;
  let totalAmount: number | undefined;

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      orderId,
      paymentId: paymentIdFromBody,
      signature,
      planId,
      departureId,
      numAdults,
      travelDate,
      totalAmount: totalAmountFromBody,
    } = body;

    // Store for catch block refund logic
    paymentId = paymentIdFromBody;
    totalAmount = totalAmountFromBody;

    console.log("Received verification data:", {
      orderId,
      paymentId: paymentIdFromBody,
      signature,
      planId,
      departureId,
      numAdults,
      travelDate,
      totalAmount: totalAmountFromBody,
    });

    // Validate required fields
    if (
      !orderId ||
      !paymentIdFromBody ||
      !signature ||
      !planId ||
      !departureId ||
      !numAdults ||
      !travelDate ||
      !totalAmountFromBody
    ) {
      console.log("Missing fields:", {
        orderId: !!orderId,
        paymentId: !!paymentIdFromBody,
        signature: !!signature,
        planId: !!planId,
        departureId: !!departureId,
        numAdults: !!numAdults,
        travelDate: !!travelDate,
        totalAmount: !!totalAmountFromBody,
      });
      return NextResponse.json(
        { error: "All payment fields are required" },
        { status: 400 }
      );
    }

    // Verify payment signature
    const isValidSignature = verifyPaymentSignature(
      orderId,
      paymentIdFromBody,
      signature
    );
    if (!isValidSignature) {
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    // Verify payment with Razorpay
    const payment = await getPaymentDetails(paymentIdFromBody);
    if (payment.status !== "captured" && payment.status !== "authorized") {
      return NextResponse.json(
        { error: "Payment not successful" },
        { status: 400 }
      );
    }

    // Get plan details
    const plan = await getPlanById(planId);
    if (!plan) {
      return NextResponse.json(
        { error: "Travel plan not found" },
        { status: 404 }
      );
    }

    // Calculate platform cut and vendor payout
    const tripCost = plan.price * numAdults;
    const platformFeePercent = 2; // 2% platform fee on top of trip cost
    const platformFee = Math.round(tripCost * (platformFeePercent / 100));
    const expectedTotal = tripCost + platformFee;

    // Vendor cut calculation (from trip cost, not including platform fee)
    const platformCutPercent = plan.vendorCut ? 100 - plan.vendorCut : 15; // Default 15% platform cut from trip cost
    const platformCut = Math.round(tripCost * (platformCutPercent / 100));
    const vendorPayoutAmount = tripCost - platformCut;

    // Verify total amount matches (trip cost + platform fee)
    if (Math.abs(totalAmountFromBody - expectedTotal) > 1) {
      // Allow 1 rupee difference for rounding
      console.log("Amount mismatch:", {
        totalAmount: totalAmountFromBody,
        expectedTotal,
        tripCost,
        platformFee,
      });
      return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
    }

    // Get and validate departure
    const departure = await getDepartureById(departureId);
    if (!departure) {
      return NextResponse.json(
        { error: "Departure not found" },
        { status: 404 }
      );
    }

    // Atomically increment booked seats (with capacity check)
    const seatIncrementSuccess = await incrementBookedSeats(
      departureId,
      numAdults
    );

    if (!seatIncrementSuccess) {
      // Race condition: payment succeeded but no capacity left
      // Initiate auto-refund using Razorpay processRefund
      console.error(
        "Capacity exceeded after payment. Initiating refund for payment:",
        paymentIdFromBody
      );

      try {
        await processRefund(paymentIdFromBody, totalAmountFromBody, {
          reason: "Booking capacity exceeded",
          bookingFailure: "true",
        });
        return NextResponse.json(
          {
            error:
              "Booking capacity exceeded. Your payment has been automatically refunded and will reflect in 5-7 business days.",
            refunded: true,
          },
          { status: 409 }
        );
      } catch (refundError) {
        console.error("Failed to initiate refund:", refundError);
        return NextResponse.json(
          {
            error:
              "Booking capacity exceeded and refund initiation failed. Please contact support with payment ID: " +
              paymentIdFromBody,
            paymentId: paymentIdFromBody,
          },
          { status: 500 }
        );
      }
    }

    // Create booking record
    const booking: DynamoDBBooking = {
      bookingId: randomUUID(),
      planId,
      departureId,
      userId: session.user.id,
      tripDate: travelDate,
      numPeople: numAdults,
      paymentStatus: "completed",
      bookingStatus: "confirmed",
      totalAmount: totalAmountFromBody,
      createdAt: new Date().toISOString(),
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentIdFromBody,
      razorpaySignature: signature,
      refundStatus: "none",
      vendorPayoutStatus: "pending",
      platformCut,
      vendorPayoutAmount,
    };

    await createBooking(booking);

    return NextResponse.json(
      {
        success: true,
        bookingId: booking.bookingId,
        message: "Payment verified and booking created successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error verifying payment:", error);
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack trace"
    );
    console.error(
      "Error message:",
      error instanceof Error ? error.message : String(error)
    );

    // If we have payment details but booking failed, initiate refund
    if (paymentId && totalAmount) {
      console.log(
        "Booking failed after payment. Initiating refund for:",
        paymentId
      );

      try {
        await processRefund(paymentId, totalAmount, {
          reason: "Booking creation failed due to system error",
          bookingFailure: "true",
        });

        return NextResponse.json(
          {
            error:
              "Booking failed. Your payment has been automatically refunded and will reflect in 5-7 business days.",
            refunded: true,
            details: error instanceof Error ? error.message : String(error),
          },
          { status: 500 }
        );
      } catch (refundError) {
        console.error("Failed to initiate refund:", refundError);
        return NextResponse.json(
          {
            error:
              "Booking failed and refund initiation failed. Please contact support immediately with payment ID: " +
              paymentId,
            paymentId,
            details: error instanceof Error ? error.message : String(error),
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      {
        error: "Failed to verify payment. Please contact support.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
