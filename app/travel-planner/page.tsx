"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { parse } from "partial-json";
import { useTravelPlanner } from "@/components/travel-planner/travel-planner-context";
import {
    mergePlan,
    tripInputToPrompt,
    tripInputSummary,
    type PlanOutputSchema,
} from "@/components/travel-planner/plan-types";
import TransportSection from "@/components/travel-planner/sections/TransportSection";
import HotelSection from "@/components/travel-planner/sections/HotelSection";
import ItinerarySection from "@/components/travel-planner/sections/ItinerarySection";
import MessageThread from "@/components/travel-planner/sections/MessageThread";
import { useState } from "react";

function Dashboard() {
    const router = useRouter();
    const {
        sessionManager,
        tokenMapRef,
        ready,
        tripInput,
        plan,
        setPlan,
        messages,
        addMessage,
        saveSession,
        resetSession,
    } = useTravelPlanner();

    const [isStreaming, setIsStreaming] = useState(false);
    const [functionCalls, setFunctionCalls] = useState<string[]>([]);
    const hasInitiated = useRef(false);
    const photosResolved = useRef(false);
    const PLACES_REGEX = /https:\/\/places\.googleapis\.com\/v1\/[^\s)"]+/g;

    /* ── Resolve all Google Places photo URLs in-place after streaming ── */
    const resolvePhotos = useCallback(async () => {
        // Collect all Places URLs from hotels + itinerary
        const urls = new Set<string>();

        for (const h of plan.hotels) {
            if (h.image_url && PLACES_REGEX.test(h.image_url)) {
                urls.add(h.image_url);
                PLACES_REGEX.lastIndex = 0;
            }
        }
        for (const a of plan.itinerary) {
            if (a.plan) {
                for (const m of a.plan.matchAll(PLACES_REGEX)) {
                    urls.add(m[0]);
                }
            }
        }

        if (urls.size === 0) return;

        try {
            const res = await fetch("/api/travel-planner/resolve-photos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ urls: [...urls] }),
            });
            const { resolved } = (await res.json()) as { resolved: Record<string, string> };

            setPlan((prev) => ({
                ...prev,
                hotels: prev.hotels.map((h) => ({
                    ...h,
                    image_url: h.image_url && resolved[h.image_url] ? resolved[h.image_url] : h.image_url,
                })),
                itinerary: prev.itinerary.map((a) => ({
                    ...a,
                    plan: a.plan
                        ? a.plan.replace(PLACES_REGEX, (match) => resolved[match] ?? match)
                        : a.plan,
                })),
            }));
        } catch (e) {
            console.error("Photo resolution failed:", e);
        }
    }, [plan.hotels, plan.itinerary, setPlan]);

    /* ── Stream a prompt through session manager → API → merge plan ── */
    const streamPrompt = useCallback(
        async (prompt: string) => {
            if (!sessionManager) return;

            setIsStreaming(true);
            setFunctionCalls(["Planning…"]);
            photosResolved.current = false;

            // 1. Register the user prompt in the session
            sessionManager.ask_string(prompt);

            // 2. POST to server-side proxy
            const response = await fetch("/api/travel-planner/ask", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    session: JSON.parse(sessionManager.get_session()),
                    token_map: tokenMapRef.current,
                }),
            });

            if (!response.ok || !response.body) {
                addMessage({
                    role: "assistant",
                    text: `Error: ${response.status} ${response.statusText}`,
                });
                setIsStreaming(false);
                setFunctionCalls([]);
                return;
            }

            // 3. Stream the response
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let received = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                received += decoder.decode(value, { stream: true });
                const chunks = received.split("\n");

                if (chunks.length <= 1) continue;

                // Keep the last (possibly incomplete) chunk for next iteration
                received = chunks.pop()!;

                for (const chunk of chunks) {
                    sessionManager.add_chat(chunk);
                }

                // Show current function calls
                const calls = sessionManager.last_function_calls();
                setFunctionCalls(calls.length ? calls : ["Planning…"]);

                // Parse partial reply and merge into plan
                const partialReply = sessionManager.get_last_reply();
                if (partialReply) {
                    try {
                        const replyJson = parse(partialReply) as Partial<PlanOutputSchema>;
                        setPlan((prev) => mergePlan(prev, replyJson));
                    } catch {
                        /* partial parse may fail — ignore */
                    }
                }
            }

            // 4. Stream finished — `received` is the final payload (token_map JSON)
            try {
                tokenMapRef.current = JSON.parse(received);
            } catch (e) {
                console.error(`Token map parse failed: ${e}\nReceived\n${received}`);
            }

            // 5. Final render from completed reply
            const finalReply = sessionManager.get_last_reply();
            if (finalReply) {
                try {
                    const replyJson = parse(finalReply) as Partial<PlanOutputSchema>;
                    setPlan((prev) => mergePlan(prev, replyJson));

                    // Append the message as a new assistant chat message
                    if (replyJson.message) {
                        addMessage({
                            role: "assistant",
                            text: replyJson.message,
                        });
                    }
                } catch (e) {
                    console.error("Final parse failed:", e);
                }
            }

            setIsStreaming(false);
            setFunctionCalls([]);
        },
        [sessionManager, tokenMapRef, setPlan, addMessage]
    );

    /* ── Initial prompt on mount ── */
    useEffect(() => {
        if (!ready || !tripInput || hasInitiated.current) return;
        hasInitiated.current = true;

        // If we restored from localStorage, messages already exist — don’t re-send
        if (messages.length > 0) return;

        // Add the user's trip summary as the first message
        addMessage({ role: "user", text: tripInputSummary(tripInput) });

        // Build prompt and stream
        const prompt = tripInputToPrompt(tripInput);
        streamPrompt(prompt);
    }, [ready, tripInput, addMessage, streamPrompt, messages.length]);

    /* ── Redirect or load saved session ── */
    useEffect(() => {
        if (ready && !tripInput && !hasInitiated.current) {
            router.replace("/travel-planner/details");
        }
    }, [ready, tripInput, router]);

    /* ── Save session & resolve photos when streaming is done ── */
    useEffect(() => {
        if (!isStreaming && ready && tripInput && hasInitiated.current) {
            saveSession();
            if (!photosResolved.current) {
                photosResolved.current = true;
                resolvePhotos();
            }
        }
    }, [isStreaming, ready, tripInput, saveSession, resolvePhotos]);

    /* ── Handle follow-up messages ── */
    function handleSend(text: string) {
        addMessage({ role: "user", text });
        streamPrompt(text);
    }

    const hasOutbound =
        (plan.outbound.flights?.length ?? 0) > 0 ||
        (plan.outbound.trains?.length ?? 0) > 0;
    const hasInbound =
        (plan.inbound.flights?.length ?? 0) > 0 ||
        (plan.inbound.trains?.length ?? 0) > 0;
    const hasHotels = plan.hotels.length > 0;
    const hasItinerary = plan.itinerary.length > 0;

    if (!ready) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-3">
                    <div className="w-10 h-10 border-3 border-[#FF5A1F] border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-sm text-gray-500">Loading travel planner…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-24">
            {/* Header */}
            <header className="sticky top-0 z-30 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl px-6 py-4 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                        Travel planner
                    </h1>
                    {tripInput && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {tripInput.startingPoint} → {tripInput.destination} · {tripInput.startDate} to {tripInput.endDate}
                        </p>
                    )}
                </div>
                <button
                    onClick={() => {
                        resetSession();
                        router.push("/travel-planner/details");
                    }}
                    className="px-4 py-2 text-xs font-semibold rounded-full border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                    Start Over
                </button>
            </header>

            {/* Function-call status pills (while streaming) */}
            {isStreaming && functionCalls.length > 0 && (
                <div className="sticky top-[65px] z-20 flex flex-wrap gap-2 px-6 py-3 bg-gray-50/90 dark:bg-gray-950/90 backdrop-blur-md">
                    {functionCalls.map((call, i) => (
                        <span
                            key={i}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#FF5A1F]/10 text-[#FF5A1F] animate-pulse"
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {call}
                        </span>
                    ))}
                </div>
            )}

            {/* Sections */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
                {hasOutbound && (
                    <TransportSection title="🛫 Outbound — Getting There" transports={plan.outbound} />
                )}

                {hasInbound && (
                    <TransportSection title="🛬 Inbound — Coming Back" transports={plan.inbound} />
                )}

                {hasHotels && <HotelSection hotels={plan.hotels} />}

                {hasItinerary && <ItinerarySection itinerary={plan.itinerary} />}

                {/* Messages — always visible once there are any */}
                <MessageThread
                    messages={messages}
                    onSend={handleSend}
                    isStreaming={isStreaming}
                />
            </div>
        </div>
    );
}

export default function TravelPlannerPage() {
    return <Dashboard />;
}
