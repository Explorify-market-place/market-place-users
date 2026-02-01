import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getPlanById,
  getDepartureById,
  incrementBookedSeats,
  createBooking,
} from "@/lib/db-helpers";
import { DynamoDBBooking } from "@/lib/dynamodb";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  try {
    // first, authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // parse request body
    const body = await request.json();
    const { planId, departureId, numPeople } = body;

    // Validate required fields, send back 400 if missing
    if (!planId || !departureId || !numPeople) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Validate numPeople
    if (typeof numPeople !== "number" || numPeople < 1 || numPeople > 10) {
      return NextResponse.json(
        { error: "Number of people must be between 1 and 10" },
        { status: 400 },
      );
    }

    // Fetch and validate plan
    const plan = await getPlanById(planId);
    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    if (!plan.isActive) {
      return NextResponse.json(
        { error: "This trip is no longer available" },
        { status: 400 },
      );
    }

    // Fetch and validate departure
    const departure = await getDepartureById(departureId);
    if (!departure) {
      return NextResponse.json(
        { error: "Departure not found" },
        { status: 404 },
      );
    }

    // Validate departure belongs to plan
    if (departure.planId !== planId) {
      return NextResponse.json(
        { error: "Departure does not match plan" },
        { status: 400 },
      );
    }

    // Check departure status
    if (departure.status === "cancelled" || !departure.isActive) {
      return NextResponse.json(
        { error: "This departure has been cancelled" },
        { status: 400 },
      );
    }

    // check if departure already completed
    if (departure.status === "completed") {
      return NextResponse.json(
        { error: "This departure has already been completed" },
        { status: 400 },
      );
    }

    // Check departure is in the future
    const departureDate = new Date(departure.departureDate);
    if (departureDate < new Date()) {
      return NextResponse.json(
        { error: "This departure is in the past" },
        { status: 400 },
      );
    }

    // Check seat availability
    const availableSeats = departure.totalCapacity - departure.bookedSeats;
    if (availableSeats < numPeople) {
      return NextResponse.json(
        {
          error: "Not enough seats available",
          availableSeats,
          requested: numPeople,
        },
        { status: 400 },
      );
    }

    // Calculate costs - NO extra platform fee charged to user
    // User pays exactly tripCost, platform takes 15% (or 100 - vendorCut) from that
    const tripCost = plan.price * numPeople;
    const totalAmount = tripCost; // No extra fees - user pays trip cost only
    
    // Vendor payout: use plan.vendorCut if defined, otherwise default to 85%
    const vendorCutPercent = plan.vendorCut ?? 85;
    const vendorPayoutAmount = Math.round(tripCost * (vendorCutPercent / 100));
    const platformCut = tripCost - vendorPayoutAmount; // Platform keeps the rest

    // Generate booking ID
    const bookingId = randomUUID();

    // Atomically increment booked seats
    // This uses conditional update to prevent overbooking
    try {
      await incrementBookedSeats(departureId, numPeople);
    } catch (error) {
      console.error("Failed to increment seats:", error);
      return NextResponse.json(
        {
          error: "Unable to reserve seats. This departure may be fully booked.",
        },
        { status: 409 },
      );
    }

    // Create pending booking
    const booking: DynamoDBBooking = {
      bookingId,
      planId,
      departureId,
      userId: session.user.id,
      tripDate: departure.departureDate,
      numPeople,
      paymentStatus: "pending",
      bookingStatus: "pending",
      tripCost,
      platformFee: 0, // No extra platform fee charged
      totalAmount,
      createdAt: new Date().toISOString(),
      refundStatus: "none",
      vendorPayoutStatus: "pending",
      platformCut,
      vendorPayoutAmount,
    };

    try {
      await createBooking(booking);
    } catch (error) {
      // Rollback seat increment if booking creation fails
      console.error("Failed to create booking, rolling back seats:", error);
      try {
        await incrementBookedSeats(departureId, -numPeople); // Release seats
      } catch (rollbackError) {
        console.error("Failed to rollback seats:", rollbackError);
      }
      return NextResponse.json(
        { error: "Failed to create booking" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        bookingId,
        totalAmount,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Booking creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
