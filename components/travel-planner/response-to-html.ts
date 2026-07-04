import { marked, Renderer } from "marked";

const renderer = new Renderer();
renderer.link = ({ href, title, text }) => {
    const titleAttr = title ? ` title="${title}"` : "";
    return `<a href="${href}"${titleAttr} target="_blank" rel="noopener noreferrer">${text}</a>`;
};
marked.use({ renderer });

const PLACEHOLDER = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="100%" height="100%" fill="%23f3f4f6"><animate attributeName="opacity" values="0.5;1;0.5" dur="1.5s" repeatCount="indefinite"/></rect></svg>`;
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
    if (!markdown) return "";

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

    markdown = markdown.replaceAll(
        "cid=metasearch|googleflights",
        "cid=metasearch%7Cgoogleflights"
    );
    return await marked.parse(markdown);
}
