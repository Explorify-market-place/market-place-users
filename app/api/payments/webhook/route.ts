import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getBookingById, updateBookingStatus } from "@/lib/db-helpers";
import { verifyPaymentSignature } from "@/lib/razorpay";
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
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(body)
      .digest("hex");

    if (expectedSignature !== signature) {
      console.error("Invalid webhook signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
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
    console.log(`Refund created: ${refund.id} for payment: ${refund.payment_id}`);
    // You can add logic here to update booking refund status if needed
  } catch (error) {
    console.error("Error handling refund created:", error);
  }
}

