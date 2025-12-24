import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getBookingById,
  updateBooking,
  decrementBookedSeats,
} from "@/lib/db-helpers";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bookingId } = await params;
    const booking = await getBookingById(bookingId);

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Verify booking belongs to user
    if (booking.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if booking is already cancelled
    if (booking.bookingStatus === "cancelled") {
      return NextResponse.json(
        { error: "Booking is already cancelled" },
        { status: 400 }
      );
    }

    // Check if vendor payout already completed
    if (booking.vendorPayoutStatus === "completed") {
      return NextResponse.json(
        { error: "Cannot cancel after vendor payout is completed" },
        { status: 400 }
      );
    }

    // Check if trip has already happened
    const tripDate = new Date(booking.tripDate);
    const now = new Date();

    if (tripDate < now) {
      return NextResponse.json(
        { error: "Cannot cancel past trips" },
        { status: 400 }
      );
    }

    // Calculate days until trip for refund policy
    const daysUntilTrip = Math.ceil(
      (tripDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Determine refund eligibility
    let refundPercentage = 0;
    let refundMessage = "";
    
    if (daysUntilTrip >= 15) {
      refundPercentage = 100;
      refundMessage = "Full refund (100% of trip cost)";
    } else if (daysUntilTrip >= 8) {
      refundPercentage = 50;
      refundMessage = "Partial refund (50% of trip cost)";
    } else {
      refundPercentage = 0;
      refundMessage = "No refund available";
    }

    // Allow cancellation even with 0% refund, but inform user
    // They might want to cancel anyway to free up their booking

    // Restore departure capacity
    try {
      await decrementBookedSeats(booking.departureId, booking.numPeople);
    } catch (seatError) {
      console.error("Failed to decrement booked seats:", seatError);
      // Continue with cancellation even if seat decrement fails
      // Better to err on side of customer getting refund
    }

    // Mark booking as cancelled and set refund as requested
    // Note: vendorPayoutStatus stays "pending" - will be adjusted by refund API based on refund percentage
    await updateBooking(bookingId, {
      bookingStatus: "cancelled",
      refundStatus: "requested",
      cancelledAt: new Date().toISOString(),
    });

    // Call the refund API to process the refund with Razorpay
    // This uses Sidharth's refund logic which handles Razorpay processing
    const refundResponse = await fetch(
      `${
        process.env.NEXTAUTH_URL || "http://localhost:3000"
      }/api/payments/refund`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: request.headers.get("cookie") || "",
        },
        body: JSON.stringify({ bookingId }),
      }
    );

    const refundData = await refundResponse.json();

    if (!refundResponse.ok) {
      // Revert cancellation if refund fails
      await updateBooking(bookingId, {
        bookingStatus: booking.bookingStatus || "confirmed",
        refundStatus: "rejected",
        vendorPayoutStatus: booking.vendorPayoutStatus || "pending",
      });

      return NextResponse.json(
        {
          error: refundData.error || "Failed to process refund",
          details: refundData.details,
        },
        { status: refundResponse.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Booking cancelled successfully. ${refundMessage}`,
      refundAmount: refundData.refundAmount,
      refundPercentage: refundData.refundPercentage,
      refundId: refundData.refundId,
      bookingId,
    });
  } catch (error: unknown) {
    console.error("Error cancelling booking:", error);
    return NextResponse.json(
      {
        error: "Failed to cancel booking",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
