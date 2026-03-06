"use client";

import { useEffect, useRef, useState } from "react";
import { type ChatMessage } from "../plan-types";
import { responseToHtml } from "../response-to-html";
import { Send } from "lucide-react";

function AssistantBubble({ text }: { text: string }) {
    const [html, setHtml] = useState("");

    useEffect(() => {
        responseToHtml(text, false).then(setHtml);
    }, [text]);

    return (
        <div className="max-w-[85%]">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl rounded-bl-sm px-5 py-4 shadow-sm">
                <div
                    className="tp-prose text-sm"
                    dangerouslySetInnerHTML={{ __html: html }}
                />
            </div>
        </div>
    );
}

function UserBubble({ text }: { text: string }) {
    const [html, setHtml] = useState("");

    useEffect(() => {
        responseToHtml(text, false).then(setHtml);
    }, [text]);

    return (
        <div className="flex justify-end">
            <div className="max-w-[75%] bg-[#C2410C] text-white rounded-2xl rounded-br-sm px-4 py-3 shadow">
                <div
                    className="tp-prose tp-prose-invert text-sm"
                    dangerouslySetInnerHTML={{ __html: html }}
                />
            </div>
        </div>
    );
}

export default function MessageThread({
    messages,
    onSend,
    isStreaming,
}: {
    messages: ChatMessage[];
    onSend: (text: string) => void;
    isStreaming: boolean;
}) {
    const [input, setInput] = useState("");
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const text = input.trim();
        if (!text || isStreaming) return;
        onSend(text);
        setInput("");
    }

    return (
        <section className="tp-section">
            <h2 className="tp-section-title">💬 Messages</h2>

            <div className="space-y-4 mb-4">
                {messages.map((msg, i) =>
                    msg.role === "user" ? (
                        <UserBubble key={i} text={msg.text} />
                    ) : (
                        <AssistantBubble key={i} text={msg.text} />
                    )
                )}

                {isStreaming && (
                    <div className="flex items-center gap-2 text-sm text-gray-400 pl-1">
                        <span className="w-2 h-2 rounded-full bg-[#FF5A1F] animate-bounce" />
                        <span className="w-2 h-2 rounded-full bg-[#FF5A1F] animate-bounce [animation-delay:0.15s]" />
                        <span className="w-2 h-2 rounded-full bg-[#FF5A1F] animate-bounce [animation-delay:0.3s]" />
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input bar */}
            <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                    className="flex-1 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-[#FF5A1F]/40 focus:border-[#FF5A1F] transition"
                    placeholder={
                        isStreaming
                            ? "Waiting for response…"
                            : "Ask to update itinerary, hotels, etc."
                    }
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={isStreaming}
                />
                <button
                    type="submit"
                    disabled={isStreaming || !input.trim()}
                    className="px-5 py-3 rounded-full bg-[#FF5A1F] text-white font-semibold text-sm hover:bg-[#e14f1c] disabled:opacity-30 disabled:cursor-not-allowed transition shadow-lg shadow-[#FF5A1F]/20"
                >
                    <Send className="w-4 h-4" />
                </button>
            </form>
        </section>
    );
}
