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

    const { orderId, paymentId, signature, planId, numPeople, dateBooked } =
      await request.json();

    // Validate required fields
    if (!orderId || !paymentId || !signature || !planId || !numPeople || !dateBooked) {
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

    // Calculate total amount
    const totalAmount = plan.price * numPeople;

    // Create booking record
    const booking: DynamoDBBooking = {
      bookingId: randomUUID(),
      planId,
      userId: session.user.id,
      dateBooked,
      numPeople,
      paymentStatus: "completed",
      totalAmount,
      createdAt: new Date().toISOString(),
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      razorpaySignature: signature,
      refundStatus: "none",
      vendorPayoutStatus: "pending", // Will be processed when trip starts
      platformCut: plan.vendorCut
        ? totalAmount * (1 - plan.vendorCut / 100)
        : totalAmount * 0.15, // Default 15% platform cut, modify this as a function of daysUntilTrip if required
      vendorPayoutAmount: plan.vendorCut
        ? totalAmount * (plan.vendorCut / 100)
        : totalAmount * 0.85, // Default 85% vendor cut, modify this as a function of daysUntilTrip if required
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

