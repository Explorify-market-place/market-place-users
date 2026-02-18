import { NextRequest } from "next/server";

const LAMBDA_URL =
    "https://um4h654pnnpflvmqr62irtlflm0ujjhf.lambda-url.ap-south-1.on.aws/";

export async function POST(req: NextRequest) {
    const { session, token_map } = await req.json();

    const upstream = await fetch(LAMBDA_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json;charset=UTF-8" },
        body: JSON.stringify({
            session,
            token_map,
            secret: process.env.API_SECRET,
        }),
    });

    if (!upstream.ok) {
        return new Response(upstream.statusText, { status: upstream.status });
    }

    // Stream the Lambda response body straight through to the client
    return new Response(upstream.body, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
}
