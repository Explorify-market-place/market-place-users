// app/api/stream/route.ts
import { LambdaClient, InvokeWithResponseStreamCommand } from "../../node_modules/@aws-sdk/client-lambda";
import { SessionManager } from "../../lib/travel-planner/session/pkg/session";

const sessionManager = new SessionManager();
const token_map: string[] = []

export async function ask(prompt: string, token_map: string[]) {
    sessionManager.ask(prompt);
    const client = new LambdaClient();

    const command = new InvokeWithResponseStreamCommand({
        FunctionName: "travel-planner",
        Payload: JSON.stringify({
            session: sessionManager.get_session(),
            token_map
        }),
    });

    const response = await client.send(command);

    // The stream is found in response.EventStream
    if (!response.EventStream) {
        return new Response("No stream available", { status: 500 });
    }

    for await (const event of response.EventStream!) {
        // Events can be 'PayloadChunk' or 'InvokeComplete'
        if (event.PayloadChunk?.Payload) {
            let chunk = event.PayloadChunk.Payload;
            console.log(chunk)
        }
    }
}

ask("I want to travel to goa from ranchi\nI'm planning a 7-day trip for 2 adults starting on {}. I prefer a flight to save time for coding. I’m looking for a mid-range hotel near North Goa with good Wi-Fi. My budget is roughly ₹50,000 for the whole trip.", token_map)
