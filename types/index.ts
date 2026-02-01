/**
 * Central Types Export
 *
 * Re-exports all types from the types directory for convenient imports.
 * Usage: import { DynamoDBUser, RazorpayOrder } from "@/types";
 */

// DynamoDB entity types
export type {
  DynamoDBUser,
  DynamoDBPlan,
  DynamoDBDeparture,
  DynamoDBBooking,
  // Sub-types
  BankDetails,
  VendorInfo,
  UserRole,
  Duration,
  Stop,
  Accessibility,
  DepartureStatus,
  PaymentStatus,
  BookingStatus,
  RefundStatus,
  VendorPayoutStatus,
} from "./dynamodb";

// DynamoDB utility types
export type {
  ExpressionAttributeValues,
  ExpressionAttributeNames,
  DynamoDBUpdateInput,
} from "./dynamodb-utils";

// Razorpay types
export type {
  RazorpayOrder,
  RazorpayPaymentEntity,
  RazorpayRefundEntity,
  RazorpayWebhookPayload,
  RazorpayWebhookEvent,
  RazorpayCheckoutResponse,
  RazorpayError,
  RazorpayRefundData,
} from "./razorpay";

// API types
export type {
  ApiResponse,
  PaginatedResponse,
  ErrorResponse,
  TripCard,
} from "./api";
