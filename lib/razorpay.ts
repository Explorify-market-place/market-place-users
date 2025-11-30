import Razorpay from "razorpay";
import crypto from "crypto";

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
  orderId: string, paymentId: string, signature: string): boolean {

  const payload = `${orderId}|${paymentId}`;
  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
    .update(payload)
    .digest("hex");

  return generatedSignature === signature;
}

/*
* Create a Razorpay payment order
*/
export async function createPaymentOrder(
  amount: number,
  currency: string = "INR",
  receipt?: string,
  notes?: Record<string, string>
) {
  const options = {
    amount: amount * 100, // Razorpay expects amount in paise (smallest currency unit)
    currency,
    receipt: receipt || `receipt_${Date.now()}`,
    notes: notes || {},
  };

  try {
    const order = await razorpay.orders.create(options);
    return order;
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
    const refund = await razorpay.payments.refund(paymentId, {
      amount: amount * 100, // Convert to paise
      notes: notes || {},
    });
    return refund;
  } catch (error) {
    console.error("Error processing refund:", error);
    throw error;
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

