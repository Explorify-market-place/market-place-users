import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import type { TripFilter } from "@/types/filter-types";

/**
 * POST /api/trips/search/nl
 *
 * Converts a natural language search query into a structured TripFilter JSON
 * using Gemini, then returns it so the client can populate sidebar controls.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query, availableOptions } = body as {
      query: string;
      availableOptions: {
        categories: string[];
        interests: string[];
        languages: string[];
      };
    };

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return NextResponse.json(
        { error: "query is required" },
        { status: 400 },
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Graceful fallback: no API key configured, use text search
      console.warn("GEMINI_API_KEY not set — falling back to textSearch");
      return NextResponse.json({
        filter: { textSearch: query.trim() } satisfies TripFilter,
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: query.trim(),
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: buildResponseSchema(availableOptions),
      },
    });

    const text = response.text;
    if (!text) {
      // Gemini returned empty — fall back to text search
      return NextResponse.json({
        filter: { textSearch: query.trim() } satisfies TripFilter,
      });
    }

    const filter: TripFilter = JSON.parse(text);

    // Remove null/undefined/empty values to keep it clean
    const cleanFilter: TripFilter = {};
    if (filter.priceMin != null) cleanFilter.priceMin = filter.priceMin;
    if (filter.priceMax != null) cleanFilter.priceMax = filter.priceMax;
    if (filter.durationMin != null) cleanFilter.durationMin = filter.durationMin;
    if (filter.durationMax != null) cleanFilter.durationMax = filter.durationMax;
    if (filter.categories?.length) cleanFilter.categories = filter.categories;
    if (filter.interests?.length) cleanFilter.interests = filter.interests;
    if (filter.languages?.length) cleanFilter.languages = filter.languages;
    if (filter.startingPoint) cleanFilter.startingPoint = filter.startingPoint;
    if (filter.textSearch) cleanFilter.textSearch = filter.textSearch;

    return NextResponse.json({ filter: cleanFilter });
  } catch (error) {
    console.error("NL search error:", error);

    // Try to extract original query for fallback
    try {
      const body = await request.clone().json();
      return NextResponse.json({
        filter: { textSearch: body.query?.trim() || "" } satisfies TripFilter,
      });
    } catch {
      return NextResponse.json(
        { error: "Failed to process search query" },
        { status: 500 },
      );
    }
  }
}

// ── Stable system instruction (cached across calls, no per-request data) ──

const SYSTEM_INSTRUCTION = `You are a search filter assistant for a travel marketplace app called Explorify Trips.

Convert the user's natural language travel search query into a structured JSON filter.
The response schema enforces which values are valid for categories, interests, and languages — fuzzy-match the user's input to the closest allowed enum value.

Rules:
1. Prices are in INR (₹). "under 5000" → priceMax=5000. "5k-10k" → priceMin=5000, priceMax=10000.
2. Durations are in days. "3 nights" → 3 days. "a week" → 7 days. "3-5 days" → durationMin=3, durationMax=5.
3. Locations/cities/states/countries go in startingPoint.
4. Only use textSearch for keywords that genuinely don't map to any structured field.
5. Set fields to null if the user didn't mention anything relevant.`;

// ── Build response schema with enum constraints from available data ──

function buildResponseSchema(options: {
  categories: string[];
  interests: string[];
  languages: string[];
}) {
  return {
    type: "OBJECT" as const,
    properties: {
      priceMin: { type: "NUMBER" as const, nullable: true },
      priceMax: { type: "NUMBER" as const, nullable: true },
      durationMin: { type: "NUMBER" as const, nullable: true },
      durationMax: { type: "NUMBER" as const, nullable: true },
      categories: {
        type: "ARRAY" as const,
        items: {
          type: "STRING" as const,
          enum: options.categories.length > 0 ? options.categories : undefined,
        },
        nullable: true,
      },
      interests: {
        type: "ARRAY" as const,
        items: {
          type: "STRING" as const,
          enum: options.interests.length > 0 ? options.interests : undefined,
        },
        nullable: true,
      },
      languages: {
        type: "ARRAY" as const,
        items: {
          type: "STRING" as const,
          enum: options.languages.length > 0 ? options.languages : undefined,
        },
        nullable: true,
      },
      startingPoint: { type: "STRING" as const, nullable: true },
      textSearch: { type: "STRING" as const, nullable: true },
    },
  };
}
