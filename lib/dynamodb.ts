import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

// Configure the DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

// Create a document client for easier operations
export const dynamoDb = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  },
});

// Table names
export const PLANS_TABLE = process.env.DYNAMODB_PLANS_TABLE || "TravelPlans";
export const USERS_TABLE = process.env.DYNAMODB_USERS_TABLE || "Users";
export const BOOKINGS_TABLE = process.env.DYNAMODB_BOOKINGS_TABLE || "Bookings";

// Type definitions for DynamoDB items
export interface DynamoDBUser {
  userId: string;
  name: string;
  email: string;
  password?: string; // Optional - only for email/password auth
  image?: string;
  role: "user" | "vendor" | "admin";
  vendorVerified: boolean;
  vendorInfo?: {
    organizationName?: string;
    address?: string;
    phoneNumber?: string;
  };
  createdAt: string;
}

export interface DynamoDBPlan {
  planId: string;
  vendorId: string;
  name: string;
  image: string;
  route: string[];
  description: string;
  price: number;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  // Refund rules
  refundPercentage?: number; // Percentage refundable ( 80 for 80%)
  refundDaysBeforeTrip?: number; // Days before trip start for refund eligibility
  // Vendor commission
  vendorCut?: number; // Percentage cut for vendor ( 85 for 85%, rest goes to platform)
}

export interface DynamoDBBooking {
  bookingId: string;
  planId: string;
  userId: string;
  dateBooked: string; // Trip Start Date
  numPeople: number;
  paymentStatus: "pending" | "completed" | "failed";
  totalAmount: number;
  createdAt: string;
  // RazorPay fields
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  // Trip and refund management
  refundStatus?: "none" | "requested" | "processing" | "completed" | "rejected";
  refundAmount?: number;
  refundDate?: string;
  // Vendor payout management
  vendorPayoutStatus?: "pending" | "processing" | "completed" | "failed";
  vendorPayoutAmount?: number;
  vendorPayoutDate?: string;
  platformCut?: number; // Amount kept by platform
}
