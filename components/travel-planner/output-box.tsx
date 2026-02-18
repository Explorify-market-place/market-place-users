"use client";

import { useEffect, useState, useRef } from "react";
import { useTravelPlanner } from "./travel-planner-context";
import { responseToHtml } from "./response-to-html";

export function OutputBox({ prompt }: { prompt: string }) {
    const { sessionManager, tokenMapRef } = useTravelPlanner();

    const [functionCalls, setFunctionCalls] = useState<string[]>([]);
    const [html, setHtml] = useState("");
    const [isStreaming, setIsStreaming] = useState(true);
    const hasRun = useRef(false);

    useEffect(() => {
        if (!sessionManager || hasRun.current) return;
        hasRun.current = true;

        (async () => {
            // 1. Register the user prompt in the session
            sessionManager.ask_string(prompt);

            // 2. POST to server-side proxy (which injects API_SECRET)
            const response = await fetch("/api/travel-planner/ask", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    session: JSON.parse(sessionManager.get_session()),
                    token_map: tokenMapRef.current,
                }),
            });

            if (!response.ok || !response.body) {
                setHtml(`<p class="text-red-500">Error: ${response.status} ${response.statusText}</p>`);
                setIsStreaming(false);
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

                // Show partial reply with placeholder images
                const partialReply = sessionManager.get_last_reply();
                if (partialReply) {
                    const partialHtml = await responseToHtml(partialReply, false);
                    setHtml(partialHtml);
                }
            }

            // 4. Stream finished — `received` is the final payload (token_map JSON)
            try {
                tokenMapRef.current = JSON.parse(received);
            } catch (e) { console.error(`Token map parse failed: ${e}\nReceived\n${received}`) }

            // 5. Final render with resolved photo URLs
            setIsStreaming(false);
            setFunctionCalls([]);

            const finalReply = sessionManager.get_last_reply();
            if (finalReply) {
                const finalHtml = await responseToHtml(finalReply, true);
                setHtml(finalHtml);
            }
        })();
    }, [sessionManager, prompt, tokenMapRef]);

    return (
        <div className="w-full">
            {/* Function-call status pills */}
            {isStreaming && functionCalls.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                    {functionCalls.map((call, i) => (
                        <span
                            key={i}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 animate-pulse"
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {call}
                        </span>
                    ))}
                </div>
            )}

            {/* Streamed / final HTML response */}
            {html ? (
                <div
                    className="tp-prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: html }}
                />
            ) : isStreaming ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:0.15s]" />
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:0.3s]" />
                </div>
            ) : null}
        </div>
    );
}
