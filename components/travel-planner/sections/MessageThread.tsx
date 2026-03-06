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
    isStreaming,
}: {
    messages: ChatMessage[];
    isStreaming: boolean;
}) {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <section className="tp-section">
            <h2 className="tp-section-title">💬 Messages</h2>

            <div className="space-y-4">
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
        </section>
    );
}
