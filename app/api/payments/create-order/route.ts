import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createPaymentOrder } from "@/lib/razorpay";
import { getBookingById, updateBooking } from "@/lib/db-helpers";

export async function POST(request: NextRequest) {
  try {
    // first, authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bookingId } = await request.json();

    // Validate required field
    if (!bookingId) {
      return NextResponse.json(
        { error: "bookingId is required" },
        { status: 400 }
      );
    }

    // Fetch existing booking
    const booking = await getBookingById(bookingId);
    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Verify booking belongs to current user
    if (booking.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized to access this booking" },
        { status: 403 }
      );
    }

    // Verify booking is in pending state
    if (booking.bookingStatus !== "pending") {
      return NextResponse.json(
        { error: `Booking is already ${booking.bookingStatus}` },
        { status: 400 }
      );
    }

    // Check if Razorpay order already exists for this booking
    if (booking.razorpayOrderId) {
      // Return existing order details
      return NextResponse.json(
        {
          orderId: booking.razorpayOrderId,
          amount: booking.totalAmount * 100, // Convert to paise
          currency: "INR",
          key: process.env.RAZORPAY_KEY_ID,
        },
        { status: 200 }
      );
    }

    // Create Razorpay order
    // Note: createPaymentOrder throws on failure, which is caught by outer try/catch
    // Razorpay handles idempotency implicitly based on receipt + amount + currency
    const order = await createPaymentOrder(
      booking.totalAmount,
      "INR",
      `booking_${bookingId}`,
      {
        bookingId,
        planId: booking.planId,
        departureId: booking.departureId,
        userId: booking.userId,
        numPeople: booking.numPeople.toString(),
        tripDate: booking.tripDate,
        tripCost: booking.tripCost.toString(),
      }
    );

    // Store Razorpay order ID in booking
    await updateBooking(bookingId, {
      razorpayOrderId: order.id,
    });

    return NextResponse.json(
      {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        key: process.env.RAZORPAY_KEY_ID,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error creating payment order:", error);
    return NextResponse.json(
      { error: "Failed to create payment order" },
      { status: 500 }
    );
  }
}
