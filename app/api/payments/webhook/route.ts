import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getBookingByPaymentId, updateBooking } from "@/lib/db-helpers";
/*
 * RazorPay webhook handler
 * This handles events from RazorPay like payment.captured, payment.failed
 */
export async function POST(request: NextRequest) {
  try {
    const webhookSecret = process.env.RAZORPAY_KEY_SECRET || "";
    if (!webhookSecret) {
      console.error("RAZORPAY_KEY_SECRET not configured");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    const body = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(body)
      .digest("hex");

    if (expectedSignature !== signature) {
      console.error("Invalid webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(body);

    // Handle different event types
    switch (event.event) {
      case "payment.captured":
        await handlePaymentCaptured(event.payload);
        break;
      case "payment.failed":
        await handlePaymentFailed(event.payload);
        break;
      case "refund.created":
        await handleRefundCreated(event.payload);
        break;
      case "refund.processed":
        await handleRefundProcessed(event.payload);
        break;
      case "refund.failed":
        await handleRefundFailed(event.payload);
        break;
      default:
        console.log(`Unhandled event type: ${event.event}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handlePaymentCaptured(payload: any) {
  try {
    const payment = payload.payment.entity;
    const paymentId = payment.id;
    const orderId = payment.order_id;
    const amount = payment.amount / 100; // Convert paise to rupees

    console.log(
      `Payment captured: ${paymentId} for order: ${orderId}, amount: ₹${amount}`
    );

    // Find booking by payment ID and verify it's marked as completed
    const booking = await getBookingByPaymentId(paymentId);
    if (booking) {
      // Booking should already be completed from the verify endpoint
      // This is a backup confirmation
      if (booking.paymentStatus !== "completed") {
        console.warn(
          `Booking ${booking.bookingId} payment status is ${booking.paymentStatus}, updating to completed`
        );
        await updateBooking(booking.bookingId, {
          paymentStatus: "completed",
        });
      }
      console.log(`Payment confirmed for booking ${booking.bookingId}`);
    } else {
      console.warn(`No booking found for payment ID: ${paymentId}`);
    }
  } catch (error) {
    console.error("Error handling payment captured:", error);
  }
}

async function handlePaymentFailed(payload: any) {
  try {
    const payment = payload.payment.entity;
    const paymentId = payment.id;
    const orderId = payment.order_id;
    const errorCode = payment.error_code;
    const errorDescription = payment.error_description;

    console.log(
      `Payment failed: ${paymentId} for order: ${orderId}, error: ${errorCode} - ${errorDescription}`
    );

    // Find booking by payment ID and mark as failed
    const booking = await getBookingByPaymentId(paymentId);
    if (booking) {
      await updateBooking(booking.bookingId, {
        paymentStatus: "failed",
      });
      console.log(`Marked booking ${booking.bookingId} as failed`);
    } else {
      console.warn(`No booking found for failed payment ID: ${paymentId}`);
    }
  } catch (error) {
    console.error("Error handling payment failed:", error);
  }
}

async function handleRefundCreated(payload: any) {
  try {
    const refund = payload.refund.entity;
    const paymentId = refund.payment_id;
    const refundId = refund.id;
    const amount = refund.amount / 100; // Convert paise to rupees
    const status = refund.status; // "pending" initially

    console.log(
      `Refund created: ${refundId} for payment: ${paymentId}, amount: ₹${amount}, status: ${status}`
    );

    // Find booking and update to processing status
    const booking = await getBookingByPaymentId(paymentId);
    if (booking) {
      await updateBooking(booking.bookingId, {
        refundStatus: "processing",
        refundRazorpayId: refundId,
        refundAmount: amount,
      });
      console.log(
        `Refund initiated for booking ${booking.bookingId}, status: processing`
      );
    } else {
      console.warn(`No booking found for payment ID: ${paymentId}`);
    }
  } catch (error) {
    console.error("Error handling refund created:", error);
  }
}

async function handleRefundProcessed(payload: any) {
  try {
    const refund = payload.refund.entity;
    const paymentId = refund.payment_id;
    const refundId = refund.id;
    const amount = refund.amount / 100;

    console.log(
      `Refund processed: ${refundId} for payment: ${paymentId}, amount: ₹${amount}`
    );

    // Find booking and update to completed status
    const booking = await getBookingByPaymentId(paymentId);
    if (booking) {
      await updateBooking(booking.bookingId, {
        refundStatus: "completed",
        refundRazorpayId: refundId,
        refundAmount: amount,
        refundDate: new Date().toISOString(),
      });
      console.log(
        `Refund completed for booking ${booking.bookingId}, ₹${amount} refunded to user`
      );
    } else {
      console.warn(`No booking found for payment ID: ${paymentId}`);
    }
  } catch (error) {
    console.error("Error handling refund processed:", error);
  }
}

async function handleRefundFailed(payload: any) {
  try {
    const refund = payload.refund.entity;
    const paymentId = refund.payment_id;
    const refundId = refund.id;
    const amount = refund.amount / 100;

    console.log(
      `Refund failed: ${refundId} for payment: ${paymentId}, amount: ₹${amount}`
    );

    // Find booking and update to rejected status
    const booking = await getBookingByPaymentId(paymentId);
    if (booking) {
      await updateBooking(booking.bookingId, {
        refundStatus: "rejected",
        refundRazorpayId: refundId,
      });
      console.log(
        `Refund failed for booking ${booking.bookingId}, manual intervention required`
      );
    } else {
      console.warn(`No booking found for payment ID: ${paymentId}`);
    }
  } catch (error) {
    console.error("Error handling refund failed:", error);
  }
}
