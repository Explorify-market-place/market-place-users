// app/api/stream/route.ts
import { LambdaClient, InvokeWithResponseStreamCommand } from "../../node_modules/@aws-sdk/client-lambda";
import { SessionManager, initSync } from "../../lib/travel-planner/session/pkg/session";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { marked } from "marked";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const wasmPath = resolve(__dirname, "../../lib/travel-planner/session/pkg/session_bg.wasm");
initSync(readFileSync(wasmPath));

const renderer = new marked.Renderer()
const sessionManager = new SessionManager();
const token_map: string[] = []

async function response_to_html(markdown: string, proxy_url_map: string[][]): Promise<string> {
    renderer.image = (img) => {
        let href = img.href
        for (const [proxy, base64] of proxy_url_map) {
            if (href == proxy) {
                return `<img src="${base64}" alt="${img.text}">`
            }
        }
        return `<img src="${img.href}" alt="${img.text}">`
    }
    return await marked.parse(markdown, { renderer })
}
export async function ask(prompt: string, token_map: string[]) {
    sessionManager.ask_string(prompt);
    console.log(sessionManager.get_session());

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
        const others = JSON.parse(received);
        token_map = others.token_map
        console.log(await response_to_html(sessionManager.get_last_reply(), others.proxy_url_map), token_map)
    } catch {
        console.error("Wrong format", received)
    }
}

ask("I want to travel to goa from ranchi\nI'm planning a 7-day trip for 2 adults starting on 20 Feb. I prefer a flight to save time for coding. I’m looking for a mid-range hotel near North Goa with good Wi-Fi. My budget is roughly ₹50,000 for the whole trip.", token_map)
