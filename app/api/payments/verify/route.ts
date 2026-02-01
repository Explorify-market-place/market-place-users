import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { verifyPaymentSignature, getPaymentDetails, processRefund } from "@/lib/razorpay";
import { getBookingById, updateBooking } from "@/lib/db-helpers";

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
      bookingId,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
    } = body;

    console.log("Received verification data:", {
      bookingId,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
    });

    // Set variables for catch block
    paymentId = razorpay_payment_id;

    // Validate required fields
    if (
      !bookingId ||
      !razorpay_payment_id ||
      !razorpay_order_id ||
      !razorpay_signature
    ) {
      console.log("Missing fields:", {
        bookingId: !!bookingId,
        razorpay_payment_id: !!razorpay_payment_id,
        razorpay_order_id: !!razorpay_order_id,
        razorpay_signature: !!razorpay_signature,
      });
      return NextResponse.json(
        { error: "All payment fields are required" },
        { status: 400 },
      );
    }

    // Fetch existing booking
    const booking = await getBookingById(bookingId);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Set totalAmount for potential refund
    totalAmount = booking.totalAmount;

    // Verify booking belongs to current user
    if (booking.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized to access this booking" },
        { status: 403 },
      );
    }

    // Check if booking is already confirmed (idempotency)
    if (
      booking.bookingStatus === "confirmed" &&
      booking.paymentStatus === "completed"
    ) {
      console.log("Booking already confirmed, returning success");
      return NextResponse.json(
        {
          success: true,
          bookingId: booking.bookingId,
          message: "Booking already confirmed",
          alreadyProcessed: true,
        },
        { status: 200 },
      );
    }

    // Verify booking is in pending state
    if (booking.bookingStatus !== "pending") {
      return NextResponse.json(
        {
          error: `Booking status is: ${booking.bookingStatus}, cannot verify payment`,
        },
        { status: 400 },
      );
    }

    // Verify payment signature
    const isValidSignature = verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    );
    if (!isValidSignature) {
      console.error("Invalid payment signature");
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 },
      );
    }

    // Verify payment with Razorpay
    const payment = await getPaymentDetails(razorpay_payment_id);
    if (payment.status !== "captured" && payment.status !== "authorized") {
      console.error("Payment not successful, status:", payment.status);
      return NextResponse.json(
        { error: "Payment not successful" },
        { status: 400 },
      );
    }

    // Verify payment amount matches booking
    const paymentAmount = (payment.amount as number) / 100; // Convert from paise to rupees
    if (Math.abs(paymentAmount - booking.totalAmount) > 5) {
      console.error("Payment amount mismatch:", {
        paymentAmount,
        bookingTotalAmount: booking.totalAmount,
      });
      return NextResponse.json(
        { error: "Payment amount mismatch" },
        { status: 400 },
      );
    }

    // Update booking to confirmed
    await updateBooking(bookingId, {
      bookingStatus: "confirmed",
      paymentStatus: "completed",
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
    });

    console.log("Payment verified and booking confirmed:", bookingId);

    return NextResponse.json(
      {
        success: true,
        bookingId,
        message: "Payment verified and booking confirmed successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error verifying payment:", error);
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack trace",
    );
    console.error(
      "Error message:",
      error instanceof Error ? error.message : String(error),
    );

    // If we have payment details but booking failed, initiate refund
    if (paymentId && totalAmount) {
      console.log(
        "Booking failed after payment. Initiating refund for:",
        paymentId,
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
          { status: 500 },
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
          { status: 500 },
        );
      }
    }

    return NextResponse.json(
      {
        error: "Failed to verify payment. Please contact support.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
