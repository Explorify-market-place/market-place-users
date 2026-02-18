import { SessionManager, initSync } from "../../lib/travel-planner/session/pkg/session";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { marked } from "marked";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const wasmPath = resolve(__dirname, "../../lib/travel-planner/session/pkg/session_bg.wasm");
initSync(readFileSync(wasmPath));

const sessionManager = new SessionManager();
const token_map: string[] = []

async function resolvePlacesUrl(url: string): Promise<string> {
    return fetch(url.replace("key=placeholder_api_key", "key=" + process.env.GOOGLE_MAPS_API_KEY) + "&skipHttpRedirect=true")
        .then(r => r.json())
        .catch((e) => { console.error(e); return placeholder_url })
        .then(data => data.photoUri)
}
const placeholder_url = "https://placehold.co/400"
async function responseToHtml(markdown: string, resolve_url: boolean): Promise<string> {
    const regex = /https:\/\/places\.googleapis\.com\/v1\/[^\s)]+/g;
    if (resolve_url) {
        const links = markdown.match(regex);
        if (links) {
            const results = await Promise.all(
                links.map(url => resolvePlacesUrl(url))
            );
            const lookup = new Map(links.map((url, i) => [url, results[i]]));
            markdown = markdown.replace(regex, (match) => {
                return lookup.get(match) || placeholder_url;
            });
        }
    } else markdown = markdown.replaceAll(regex, placeholder_url)

    return await marked.parse(markdown);
}
export async function ask(prompt: string, token_map: string[]) {
    sessionManager.ask_string(prompt);

    const response = await fetch("https://um4h654pnnpflvmqr62irtlflm0ujjhf.lambda-url.ap-south-1.on.aws/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json;charset=UTF-8"
        },
        body: JSON.stringify({
            session: JSON.parse(sessionManager.get_session()),
            token_map,
            secret: process.env.API_SECRET
        })
    })

    // The stream is found in response.EventStream
    if (response.status != 200) {
        console.error(response)
        return
    }
    const decoder = new TextDecoder()

    let received = ''
    for await (const event of response.body!) {
        received += decoder.decode(event, { stream: true });
        const chunks = received.split('\n')
        if (chunks.length <= 1) continue;
        received = chunks.pop()
        for (const chunk of chunks) {
            sessionManager.add_chat(chunk)
        }
        const function_calls = sessionManager.last_function_calls()
        console.log(function_calls.length ? function_calls : ["Planning.."])
    }
    try {
        token_map = JSON.parse(received)
        console.log(await responseToHtml(sessionManager.get_last_reply(), true), token_map)
    } catch {
        console.error("Wrong format", received)
    }
}

ask("I want to travel to goa from ranchi\nI'm planning a 7-day trip for 2 adults starting on 20 Feb. I prefer a flight to save time for coding. I’m looking for a mid-range hotel near North Goa with good Wi-Fi. My budget is roughly ₹50,000 for the whole trip.", token_map)
