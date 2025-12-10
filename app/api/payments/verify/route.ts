import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { verifyPaymentSignature, getPaymentDetails } from "@/lib/razorpay";
import { createBooking, getPlanById } from "@/lib/db-helpers";
import { DynamoDBBooking } from "@/lib/dynamodb";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { orderId, paymentId, signature, planId, numAdults, travelDate, totalAmount } =
      await request.json();

    console.log("Received verification data:", { orderId, paymentId, signature, planId, numAdults, travelDate, totalAmount });

    // Validate required fields
    if (!orderId || !paymentId || !signature || !planId || !numAdults || !travelDate || !totalAmount) {
      console.log("Missing fields:", {
        orderId: !!orderId,
        paymentId: !!paymentId,
        signature: !!signature,
        planId: !!planId,
        numAdults: !!numAdults,
        travelDate: !!travelDate,
        totalAmount: !!totalAmount,
      });
      return NextResponse.json(
        { error: "All payment fields are required" },
        { status: 400 }
      );
    }

    // Verify payment signature
    const isValidSignature = verifyPaymentSignature(orderId, paymentId, signature);
    if (!isValidSignature) {
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    // Verify payment with Razorpay
    const payment = await getPaymentDetails(paymentId);
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
    const platformCutPercent = plan.vendorCut ? (100 - plan.vendorCut) : 15; // Default 15% platform cut from trip cost
    const platformCut = Math.round(tripCost * (platformCutPercent / 100));
    const vendorPayoutAmount = tripCost - platformCut;

    // Verify total amount matches (trip cost + platform fee)
    if (Math.abs(totalAmount - expectedTotal) > 1) { // Allow 1 rupee difference for rounding
      console.log("Amount mismatch:", { totalAmount, expectedTotal, tripCost, platformFee });
      return NextResponse.json(
        { error: "Amount mismatch" },
        { status: 400 }
      );
    }

    // Create booking record
    const booking: DynamoDBBooking = {
      bookingId: randomUUID(),
      planId,
      userId: session.user.id,
      dateBooked: travelDate,
      numPeople: numAdults,
      paymentStatus: "completed",
      bookingStatus: "confirmed",
      totalAmount,
      createdAt: new Date().toISOString(),
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
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
    return NextResponse.json(
      { error: "Failed to verify payment" },
      { status: 500 }
    );
  }
}

