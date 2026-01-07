import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // User requested to use the provided ENV key directly.
        // Ensure your Deepgram API Key has 'usage:write' scope or is domain-restricted.
        const apiKey = process.env.DEEPGRAM || process.env.DEEPGRAM_API_KEY;

        if (!apiKey) {
            console.error("Deepgram API Key missing in environment variables.");
            return NextResponse.json({ error: "Deepgram API configuration missing" }, { status: 500 });
        }

        // Return the static key to the client
        return NextResponse.json({ key: apiKey });

    } catch (error) {
        console.error("Deepgram API Route Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
