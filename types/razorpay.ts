/**
 * Razorpay Types
 *
 * Type definitions for Razorpay API responses and webhook payloads.
 * Reference: https://razorpay.com/docs/api/
 */

// ============ ORDER TYPES ============

export interface RazorpayOrder {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: "created" | "attempted" | "paid";
  attempts: number;
  notes: Record<string, string>;
  created_at: number;
}

// ============ PAYMENT TYPES ============

export interface RazorpayPaymentEntity {
  id: string;
  entity: "payment";
  amount: number;
  currency: string;
  status: "created" | "authorized" | "captured" | "refunded" | "failed";
  order_id: string;
  invoice_id: string | null;
  international: boolean;
  method: string;
  amount_refunded: number;
  refund_status: string | null;
  captured: boolean;
  description: string;
  card_id: string | null;
  bank: string | null;
  wallet: string | null;
  vpa: string | null;
  email: string;
  contact: string;
  fee: number;
  tax: number;
  error_code: string | null;
  error_description: string | null;
  error_source: string | null;
  error_step: string | null;
  error_reason: string | null;
  notes: Record<string, string>;
  created_at: number;
}

// ============ REFUND TYPES ============

export interface RazorpayRefundEntity {
  id: string;
  entity: "refund";
  amount: number;
  currency: string;
  payment_id: string;
  notes: Record<string, string>;
  receipt: string | null;
  acquirer_data: {
    arn: string | null;
  };
  created_at: number;
  batch_id: string | null;
  status: "pending" | "processed" | "failed";
  speed_processed: "normal" | "optimum";
  speed_requested: "normal" | "optimum";
}

// ============ WEBHOOK PAYLOAD TYPES ============

export interface RazorpayWebhookPayload {
  payment?: {
    entity: RazorpayPaymentEntity;
  };
  refund?: {
    entity: RazorpayRefundEntity;
  };
}

export interface RazorpayWebhookEvent {
  entity: "event";
  account_id: string;
  event:
    | "payment.captured"
    | "payment.failed"
    | "payment.authorized"
    | "refund.created"
    | "refund.processed"
    | "refund.failed";
  contains: string[];
  payload: RazorpayWebhookPayload;
  created_at: number;
}

// ============ CHECKOUT TYPES ============

export interface RazorpayCheckoutResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

// ============ ERROR TYPES ============

export interface RazorpayError extends Error {
  error?: {
    code: string;
    description: string;
    source: string;
    step: string;
    reason: string;
    metadata?: Record<string, unknown>;
  };
  statusCode?: number;
}

export interface RazorpayRefundData {
  amount: number;
  speed?: "normal" | "optimum";
  notes?: Record<string, string>;
}
