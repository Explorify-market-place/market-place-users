"use client";

import { useState, useRef, useEffect } from "react";
import {
    TravelPlannerProvider,
    useTravelPlanner,
} from "@/components/travel-planner/travel-planner-context";
import { OutputBox } from "@/components/travel-planner/output-box";

function ChatUI() {
    const { ready } = useTravelPlanner();
    const [messages, setMessages] = useState<
        { role: "user" | "assistant"; text: string }[]
    >([]);
    const [input, setInput] = useState("");
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    function handleSend() {
        const text = input.trim();
        if (!text || !ready) return;
        setMessages((prev) => [
            ...prev,
            { role: "user", text },
            { role: "assistant", text },
        ]);
        setInput("");
    }

    return (
        <div className="flex flex-col h-[100dvh] bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-blue-950 dark:to-purple-950">
            {/* Header */}
            <header className="shrink-0 border-b border-border/40 bg-background/60 backdrop-blur-xl px-6 py-4">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    ✈️ Travel Planner
                </h1>
                <p className="text-xs text-muted-foreground">
                    Ask me anything about your next trip
                </p>
            </header>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
                {!ready && (
                    <div className="text-center text-sm text-muted-foreground py-20">
                        Loading travel planner…
                    </div>
                )}

                {ready && messages.length === 0 && (
                    <div className="text-center py-20 space-y-3">
                        <p className="text-4xl">🌍</p>
                        <p className="text-lg font-semibold">Where do you want to go?</p>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto">
                            Tell me your destination, dates, budget and preferences — I&apos;ll
                            plan your perfect trip.
                        </p>
                    </div>
                )}

                {messages.map((msg, i) =>
                    msg.role === "user" ? (
                        <div key={i} className="flex justify-end">
                            <div className="max-w-[75%] bg-blue-600 text-white rounded-2xl rounded-br-sm px-4 py-3 text-sm shadow whitespace-pre-wrap">
                                {msg.text}
                            </div>
                        </div>
                    ) : (
                        <div
                            key={i}
                            className="max-w-[85%] bg-background/70 backdrop-blur border border-border/30 rounded-2xl rounded-bl-sm px-5 py-4 shadow-sm"
                        >
                            <OutputBox prompt={msg.text} />
                        </div>
                    )
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input bar */}
            <div className="shrink-0 border-t border-border/40 bg-background/60 backdrop-blur-xl px-4 py-3">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSend();
                    }}
                    className="flex gap-2 max-w-4xl mx-auto"
                >
                    <input
                        className="flex-1 rounded-full border border-border/50 bg-background px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/40 transition"
                        placeholder={
                            ready
                                ? "e.g. Plan a 5-day Goa trip for 2 adults…"
                                : "Loading…"
                        }
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={!ready}
                    />
                    <button
                        type="submit"
                        disabled={!ready || !input.trim()}
                        className="px-6 py-3 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-sm hover:from-blue-700 hover:to-purple-700 disabled:opacity-40 transition shadow"
                    >
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
}

export default function TravelPlannerPage() {
    return (
        <TravelPlannerProvider>
            <ChatUI />
        </TravelPlannerProvider>
    );
}
