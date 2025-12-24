import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createPaymentOrder } from "@/lib/razorpay";
import { getPlanById, getDepartureById } from "@/lib/db-helpers";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { planId, numPeople, departureId } = await request.json();

    // Validate required fields
    if (!planId || !numPeople || !departureId) {
      return NextResponse.json(
        { error: "planId, numPeople, and departureId are required" },
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

    // Get and validate departure
    const departure = await getDepartureById(departureId);
    if (!departure) {
      return NextResponse.json(
        { error: "Departure not found" },
        { status: 404 }
      );
    }

    // Validate departure belongs to this plan
    if (departure.planId !== planId) {
      return NextResponse.json(
        { error: "Departure does not belong to this plan" },
        { status: 400 }
      );
    }

    // Validate departure status
    if (departure.status !== "scheduled" && departure.status !== "confirmed") {
      return NextResponse.json(
        { error: "This departure is not available for booking" },
        { status: 400 }
      );
    }

    // Validate departure is in the future
    const departureDate = new Date(departure.departureDate);
    if (departureDate <= new Date()) {
      return NextResponse.json(
        { error: "Cannot book past departures" },
        { status: 400 }
      );
    }

    // Validate capacity
    const availableSeats = departure.totalCapacity - departure.bookedSeats;
    if (availableSeats < numPeople) {
      return NextResponse.json(
        { error: `Only ${availableSeats} seats available` },
        { status: 400 }
      );
    }

    // Calculate total amount (trip cost + 2% platform fee) TODO: do something about platform fee
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
        departureId,
        userId: session.user.id,
        numPeople: numPeople.toString(),
        tripDate: departure.departureDate,
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
