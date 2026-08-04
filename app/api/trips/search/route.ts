import { NextResponse } from "next/server";
import { getAllActivePlans } from "@/lib/db-helpers";
import type { FilterOptions } from "@/types/filter-types";
import type { DynamoDBPlan } from "@/types/dynamodb";

/**
 * GET /api/trips/search
 *
 * Returns all active plans along with unique filter option values
 * extracted from the data. Replaces the direct getAllActivePlans() call
 * that previously lived in the server component.
 */
export async function GET() {
  try {
    const plans = await getAllActivePlans();

    const filterOptions = extractFilterOptions(plans);

    return NextResponse.json({ plans, filterOptions });
  } catch (error) {
    console.error("Error fetching trips:", error);
    return NextResponse.json(
      { error: "Failed to fetch trips" },
      { status: 500 },
    );
  }
}

/** Extract unique filter options from the plans array */
function extractFilterOptions(plans: DynamoDBPlan[]): FilterOptions {
  const categoriesSet = new Set<string>();
  const interestsSet = new Set<string>();
  const languagesSet = new Set<string>();
  const locationsSet = new Set<string>();
  let minPrice = Infinity;
  let maxPrice = -Infinity;

  for (const plan of plans) {
    plan.categories?.forEach((c) => categoriesSet.add(c));
    plan.interests?.forEach((i) => interestsSet.add(i));
    plan.languages?.forEach((l) => languagesSet.add(l));
    if (plan.startingPoint) locationsSet.add(plan.startingPoint);
    if (plan.endingPoint) locationsSet.add(plan.endingPoint);

    if (plan.price < minPrice) minPrice = plan.price;
    if (plan.price > maxPrice) maxPrice = plan.price;
  }

  return {
    categories: [...categoriesSet].sort(),
    interests: [...interestsSet].sort(),
    languages: [...languagesSet].sort(),
    priceRange: {
      min: minPrice === Infinity ? 0 : minPrice,
      max: maxPrice === -Infinity ? 50000 : maxPrice,
    },
    locations: [...locationsSet].sort(),
  };
}
