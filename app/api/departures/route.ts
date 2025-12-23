import { NextRequest, NextResponse } from "next/server";
import { getDeparturesByPlan } from "@/lib/db-helpers";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const planId = searchParams.get("planId");

    if (!planId) {
      return NextResponse.json(
        { error: "planId is required" },
        { status: 400 }
      );
    }

    // Fetch all departures for this plan
    const allDepartures = await getDeparturesByPlan(planId);

    // Filter to only show future, bookable departures
    const now = new Date();
    const availableDepartures = allDepartures
      .filter((dep) => {
        const departureDate = new Date(dep.departureDate);
        const isFuture = departureDate > now;
        const isBookable =
          dep.status === "scheduled" || dep.status === "confirmed";
        return isFuture && isBookable;
      })
      .map((dep) => ({
        ...dep,
        availableSeats: dep.totalCapacity - dep.bookedSeats,
      }))
      .sort((a, b) => {
        return (
          new Date(a.departureDate).getTime() -
          new Date(b.departureDate).getTime()
        );
      });

    return NextResponse.json({
      departures: availableDepartures,
    });
  } catch (error) {
    console.error("Error fetching departures:", error);
    return NextResponse.json(
      { error: "Failed to fetch departures" },
      { status: 500 }
    );
  }
}
