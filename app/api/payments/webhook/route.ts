import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getBookingByPaymentId, updateBooking } from "@/lib/db-helpers";
/*
 * RazorPay webhook handler
 * This handles events from RazorPay like payment.captured, payment.failed
 */
export async function POST(request: NextRequest) {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "";
    if (!webhookSecret) {
      console.error("RAZORPAY_WEBHOOK_SECRET not configured");
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
    const orderId = payment.order_id;

    // Find booking by order ID
    // Note: You might need to add a GSI or scan to find by razorpayOrderId
    // For now, we'll update based on payment ID if stored

    console.log(`Payment captured: ${payment.id} for order: ${orderId}`);
    // You can add logic here to update booking status if needed
  } catch (error) {
    console.error("Error handling payment captured:", error);
  }
}

async function handlePaymentFailed(payload: any) {
  try {
    const payment = payload.payment.entity;
    console.log(`Payment failed: ${payment.id}`);
    // You can add logic here to update booking status if needed
  } catch (error) {
    console.error("Error handling payment failed:", error);
  }
}

async function handleRefundCreated(payload: any) {
  try {
    const refund = payload.refund.entity;
    const paymentId = refund.payment_id;
    const refundId = refund.id;
    const status = refund.status; // "pending", "processed", or "failed"

    console.log(`Refund ${status}: ${refundId} for payment: ${paymentId}`);

    // Map Razorpay refund status to our booking refund status
    let bookingRefundStatus:
      | "none"
      | "requested"
      | "processing"
      | "completed"
      | "rejected";
    if (status === "processed") {
      bookingRefundStatus = "completed";
    } else if (status === "failed") {
      bookingRefundStatus = "rejected";
    } else {
      bookingRefundStatus = "processing";
    }

    // Find booking by razorpayPaymentId and update refund status
    const booking = await getBookingByPaymentId(paymentId);
    if (booking) {
      const updateData: {
        refundStatus:
          | "none"
          | "requested"
          | "processing"
          | "completed"
          | "rejected";
        refundRazorpayId: string;
        refundDate?: string;
      } = {
        refundStatus: bookingRefundStatus,
        refundRazorpayId: refundId,
      };

      // Only set refundDate when refund is actually completed
      if (status === "processed") {
        updateData.refundDate = new Date().toISOString();
      }

      await updateBooking(booking.bookingId, updateData);
      console.log(
        `Updated booking ${booking.bookingId} refund status to: ${bookingRefundStatus}`
      );
    } else {
      console.warn(`No booking found for payment ID: ${paymentId}`);
    }
  } catch (error) {
    console.error("Error handling refund created:", error);
  }
}
