import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createPaymentOrder } from "@/lib/razorpay";
import { getPlanById } from "@/lib/db-helpers";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { planId, numPeople, dateBooked } = await request.json();

    // Validate required fields
    if (!planId || !numPeople || !dateBooked) {
      return NextResponse.json(
        { error: "planId, numPeople, and dateBooked are required" },
        { status: 400 }
      );
    }

    // Validate numPeople
    if (numPeople < 1) {
      return NextResponse.json(
        { error: "Number of people must be at least 1" },
        { status: 400 }
      );
    }

    // Get plan details
    const plan = await getPlanById(planId);
    if (!plan) {
      return NextResponse.json(
        { error: "Travel plan not found" },
        { status: 404 }
      );
    }

    if (!plan.isActive) {
      return NextResponse.json(
        { error: "This travel plan is not active" },
        { status: 400 }
      );
    }

    // Calculate total amount (trip cost + 2% platform fee)
    const tripCost = plan.price * numPeople;
    const platformFee = Math.round(tripCost * 0.02); // 2% platform fee
    const totalAmount = tripCost + platformFee;

    // Create Razorpay order
    const order = await createPaymentOrder(
      totalAmount,
      "INR",
      `booking_${Date.now()}`,
      {
        planId,
        userId: session.user.id,
        numPeople: numPeople.toString(),
        dateBooked,
        tripCost: tripCost.toString(),
        platformFee: platformFee.toString(),
      }
    );

    return NextResponse.json(
      {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        key: process.env.RAZORPAY_KEY_ID,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error creating payment order:", error);
    return NextResponse.json(
      { error: "Failed to create payment order" },
      { status: 500 }
    );
  }
}

