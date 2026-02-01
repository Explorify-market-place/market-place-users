import Razorpay from "razorpay";
import crypto from "crypto";

// Type definitions for Razorpay
export interface RazorpayOrder {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  attempts: number;
  notes: Record<string, string>;
  created_at: number;
}

/*
 *Initialize Razorpay instance
 */
export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

/*
 * Verify Razorpay payment signature
 */
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const payload = `${orderId}|${paymentId}`;
  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
    .update(payload)
    .digest("hex");

  return generatedSignature === signature;
}

/*
 * Create a Razorpay payment order
 * 
 * Based on Razorpay API docs: https://razorpay.com/docs/api/orders/
 * - amount: Amount in paise (multiply by 100)
 * - currency: 3-letter ISO code (INR, USD, etc.)
 * - receipt: Unique receipt ID for your reference
 * - notes: Key-value pairs for additional info (max 15 keys, 256 chars each)
 */
export async function createPaymentOrder(
  amount: number,
  currency: string = "INR",
  receipt?: string,
  notes?: Record<string, string>
): Promise<RazorpayOrder> {
  const options: Parameters<typeof razorpay.orders.create>[0] = {
    amount: amount * 100, // Razorpay expects amount in paise (smallest currency unit)
    currency,
    receipt: receipt || `receipt_${Date.now()}`,
    notes: notes || {},
  };

  try {
    // Razorpay handles idempotency implicitly based on receipt + amount + currency
    console.log("Creating Razorpay order:", { amount, currency, receipt });
    
    const order = await razorpay.orders.create(options);
    return order as unknown as RazorpayOrder;
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    throw error;
  }
}

// Process refund
export async function processRefund(
  paymentId: string,
  amount: number,
  notes?: Record<string, string>
) {
  try {
    // First, fetch the payment to check its status
    const payment = await razorpay.payments.fetch(paymentId);
    console.log("Payment status:", {
      id: payment.id,
      status: payment.status,
      captured: payment.captured,
      amount: payment.amount,
      method: payment.method,
    });

    // Check if payment is captured
    if (payment.status !== "captured") {
      throw new Error(
        `Payment is not captured yet. Status: ${payment.status}. Cannot process refund.`
      );
    }

    // For vendor cancellation, refund the trip cost (excluding platform fee)
    // Otherwise use the provided amount
    const refundAmount = Math.round(amount * 100);

    // Razorpay requires amount in paise and notes as string key-value pairs only
    const refundData: any = {
      amount: refundAmount, // Amount in paise
      speed: "normal", // Can be 'normal' or 'optimum'
    };

    // Validate refund amount doesn't exceed payment amount
    if (refundData.amount > payment.amount) {
      console.warn(
        `Refund amount (${refundData.amount}) exceeds payment amount (${payment.amount}). Adjusting to payment amount.`
      );
      refundData.amount = payment.amount;
    }

    // Only add notes if provided and ensure all values are strings
    if (notes && Object.keys(notes).length > 0) {
      const stringNotes: Record<string, string> = {};
      for (const [key, value] of Object.entries(notes)) {
        stringNotes[key] = String(value);
      }
      refundData.notes = stringNotes;
    }

    console.log("Processing refund with data:", {
      paymentId,
      requestedAmount: amount,
      amountInPaise: refundData.amount,
    });

    // Simplified refund call - only essential parameters
    const refund = await razorpay.payments.refund(paymentId, {
      amount: refundData.amount,
    });

    console.log("Refund successful:", {
      id: refund.id,
      status: refund.status,
      amount: refund.amount,
    });
    return refund;
  } catch (error: any) {
    // Extract the actual error message from Razorpay
    const errorMessage =
      error.error?.description ||
      error.description ||
      error.message ||
      "Unknown error";

    console.error("Error processing refund:", {
      message: errorMessage,
      error: error.error || error,
      statusCode: error.statusCode,
    });

    // Throw a more descriptive error
    const enhancedError: any = new Error(
      `Razorpay refund failed: ${errorMessage}`
    );
    enhancedError.razorpayError = error.error || error;
    enhancedError.statusCode = error.statusCode;
    throw enhancedError;
  }
}
/*
 * Transfer money to vendor (using Razorpay Payouts/Transfers)
 * Note: This requires Razorpay X (for payouts) or you can use Razorpay Route
 */
export async function transferToVendor(
  accountId: string,
  amount: number,
  currency: string = "INR",
  notes?: Record<string, string>
) {
  try {
    /*
     * Using Razorpay Route for transfers
     * Note: This requires vendor to have a Razorpay account and account_id
     */
    const transfer = await razorpay.transfers.create({
      account: accountId,
      amount: amount * 100, // Convert to paise
      currency,
      notes: notes || {},
    });
    return transfer;
  } catch (error) {
    console.error("Error transferring to vendor:", error);
    throw error;
  }
}

// Get payment details
export async function getPaymentDetails(paymentId: string) {
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return payment;
  } catch (error) {
    console.error("Error fetching payment details:", error);
    throw error;
  }
}

// Get order details
export async function getOrderDetails(orderId: string) {
  try {
    const order = await razorpay.orders.fetch(orderId);
    return order;
  } catch (error) {
    console.error("Error fetching order details:", error);
    throw error;
  }
}
