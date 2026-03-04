/* ── Schema types matching output-schema.txt ── */

export interface TransportDetails {
    name: string;
    booking_link: string;
    /** Should be in INR */
    price: string;
    /** ISO 8601 */
    departure_from_source: string;
    /** ISO 8601 */
    arrival_at_destination: string;
    description: string;
}

export interface HotelDetails {
    name: string;
    booking_link: string;
    /** Should be in INR */
    price: string;
    /** Photos from get_hotel_details tool */
    image_urls: string[];
    rating: number;
    /** Markdown string */
    description: string;
}

export interface Activity {
    /** Location name etc. (Don't mention Day number.) */
    title: string;
    google_map_url?: string | null;
    /** Markdown string explaining the plan for the day */
    plan: string;
}

export interface Transports {
    flights?: TransportDetails[] | null;
    trains?: TransportDetails[] | null;
}

export interface PlanOutputSchema {
    outbound: Transports;
    inbound: Transports;
    hotels?: HotelDetails[] | null;
    itinerary?: Activity[] | null;
    message: string;
}

/* ── Trip input from the wizard form ── */

export interface TripInput {
    startingPoint: string;
    destination: string;
    startDate: string;
    endDate: string;
    adults: number;
    children: number;
    budget: string;
    preferences: string;
}

/* ── Accumulated plan state (sections start empty) ── */

export interface PlanState {
    outbound: Transports;
    inbound: Transports;
    hotels: HotelDetails[];
    itinerary: Activity[];
}

export function emptyPlanState(): PlanState {
    return {
        outbound: { flights: [], trains: [] },
        inbound: { flights: [], trains: [] },
        hotels: [],
        itinerary: [],
    };
}

/* ── Chat message ── */

export interface ChatMessage {
    role: "user" | "assistant";
    text: string;
}

/* ── Merge logic ──
 * For each field in the incoming response:
 *   - null / undefined → keep the old value
 *   - non-null → replace with the new value
 * The `message` field is NOT handled here — it's appended as a ChatMessage separately.
 */
export function mergePlan(
    current: PlanState,
    incoming: Partial<PlanOutputSchema>
): PlanState {
    const merged = { ...current };

    // Outbound
    if (incoming.outbound != null) {
        merged.outbound = {
            flights:
                incoming.outbound.flights != null
                    ? incoming.outbound.flights
                    : current.outbound.flights,
            trains:
                incoming.outbound.trains != null
                    ? incoming.outbound.trains
                    : current.outbound.trains,
        };
    }

    // Inbound
    if (incoming.inbound != null) {
        merged.inbound = {
            flights:
                incoming.inbound.flights != null
                    ? incoming.inbound.flights
                    : current.inbound.flights,
            trains:
                incoming.inbound.trains != null
                    ? incoming.inbound.trains
                    : current.inbound.trains,
        };
    }

    // Hotels
    if (incoming.hotels != null) {
        merged.hotels = incoming.hotels;
    }

    // Itinerary
    if (incoming.itinerary != null) {
        merged.itinerary = incoming.itinerary;
    }

    return merged;
}

/**
 * Build the initial prompt text from TripInput.
 */
export function tripInputToPrompt(input: TripInput): string {
    const parts = [
        `Plan a trip from ${input.startingPoint} to ${input.destination}.`,
        `Dates: ${input.startDate} to ${input.endDate}.`,
        `Travellers: ${input.adults} adult, ${input.children} child.`,
        `Budget: ₹${Number(input.budget).toLocaleString("en-IN")}.`,
    ];
    if (input.preferences.trim()) {
        parts.push(`Preferences/Notes: ${input.preferences.trim()}`);
    }
    return parts.join("\n");
}

/**
 * Build a user-facing summary of the trip input (for the first chat bubble).
 */
export function tripInputSummary(input: TripInput): string {
    const lines = [
        `📍 **${input.startingPoint}** → **${input.destination}**`,
        `📅 ${input.startDate} to ${input.endDate}`,
        `👥 ${input.adults} adult(s)${input.children > 0 ? `, ${input.children} child(ren)` : ""}`,
        `💰 Budget: ₹${Number(input.budget).toLocaleString("en-IN")}`,
    ];
    if (input.preferences.trim()) {
        lines.push(`✨ Preferences: ${input.preferences.trim()}`);
    }
    return lines.join("  \n");
}
