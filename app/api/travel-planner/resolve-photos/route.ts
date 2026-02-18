import { NextRequest, NextResponse } from "next/server";

const BROKEN_IMAGE = "/broken-image.png";

async function resolveOne(url: string): Promise<string> {
    try {
        const resolved = url.replace(
            "key=placeholder_api_key",
            "key=" + process.env.GOOGLE_MAPS_API_KEY
        ) + "&skipHttpRedirect=true";

        const res = await fetch(resolved);
        const data = await res.json();
        return data.photoUri ?? BROKEN_IMAGE;
    } catch {
        return BROKEN_IMAGE;
    }
}

export async function POST(req: NextRequest) {
    const { urls } = (await req.json()) as { urls: string[] };

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
        return NextResponse.json({ resolved: {} });
    }

    const results = await Promise.all(urls.map((u) => resolveOne(u)));
    const resolved: Record<string, string> = {};
    urls.forEach((url, i) => {
        resolved[url] = results[i];
    });

    return NextResponse.json({ resolved });
}
