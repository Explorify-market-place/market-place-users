import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/places/autocomplete
 * Server-side proxy to Google Places Autocomplete.
 * Keeps the API key hidden from the client.
 *
 * Body: { input: string }
 * Returns: { predictions: { description: string; place_id: string }[] }
 */
export async function POST(req: NextRequest) {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
        console.error("Missing Google Maps API key in env")
        return NextResponse.json(
            { error: "Something went wrong" },
            { status: 500 },
        );
    }

    let body: { input?: string };
    try {
        body = await req.json();
    } catch (e) {
        return NextResponse.json({ error: `Invalid JSON body: ${e}` }, { status: 400 });
    }

    const { input } = body;
    if (!input || input.trim().length < 2) {
        return NextResponse.json({ predictions: [] });
    }

    const url = new URL(
        "https://maps.googleapis.com/maps/api/place/autocomplete/json",
    );
    url.searchParams.set("input", input);
    url.searchParams.set("key", apiKey);

    try {
        const res = await fetch(url.toString());
        const data = await res.json();

        // Surface any Google API error to the client for debugging
        if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
            console.error("[Places Autocomplete] Google API error:", JSON.stringify(data));
            return NextResponse.json(
                {
                    error: `Google API returned status: ${data.status}`,
                    error_message: data.error_message || null,
                    full_response: data,
                },
                { status: 502 },
            );
        }

        const predictions = (data.predictions ?? []).map(
            (p: { description: string; place_id: string }) => ({
                description: p.description,
                place_id: p.place_id,
            }),
        );

        return NextResponse.json({ predictions });
    } catch (e) {
        console.error("[Places Autocomplete] Fetch failed:", e);
        return NextResponse.json(
            { error: `Fetch to Google API failed: ${e}` },
            { status: 502 },
        );
    }
}
