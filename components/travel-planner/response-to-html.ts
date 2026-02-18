import { marked } from "marked";

const PLACEHOLDER = "https://placehold.net/default.svg";
const PLACES_REGEX = /https:\/\/places\.googleapis\.com\/v1\/[^\s)]+/g;

/**
 * Convert a markdown reply to HTML.
 *
 * @param markdown - raw markdown string from sessionManager.get_last_reply()
 * @param resolveUrls - if true, resolves Google Places photo URLs via the
 *                      server endpoint; if false, replaces them with placeholders.
 */
export async function responseToHtml(
    markdown: string,
    resolveUrls: boolean
): Promise<string> {
    if (resolveUrls) {
        const links = markdown.match(PLACES_REGEX);
        if (links) {
            try {
                const res = await fetch("/api/travel-planner/resolve-photos", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ urls: links }),
                });
                const { resolved } = (await res.json()) as {
                    resolved: Record<string, string>;
                };
                markdown = markdown.replace(
                    PLACES_REGEX,
                    (match) => resolved[match] ?? PLACEHOLDER
                );
            } catch {
                markdown = markdown.replaceAll(PLACES_REGEX, PLACEHOLDER);
            }
        }
    } else {
        markdown = markdown.replaceAll(PLACES_REGEX, PLACEHOLDER);
    }

    return await marked.parse(markdown);
}
