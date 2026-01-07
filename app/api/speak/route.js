import { createClient } from "@deepgram/sdk";
import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        const { text } = await request.json();
        const apiKey = process.env.DEEPGRAM || process.env.DEEPGRAM_API_KEY;

        if (!text) return NextResponse.json({ error: "No text provided" }, { status: 400 });

        // Deepgram TTS REST API
        // Documentation: https://developers.deepgram.com/docs/text-to-speech
        // Endpoint: https://api.deepgram.com/v1/speak?model=aura-asteria-en

        const response = await fetch("https://api.deepgram.com/v1/speak?model=aura-2-aurora-en", {
            method: "POST",
            headers: {
                "Authorization": `Token ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ text }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Deepgram TTS Error:", errorText);
            return NextResponse.json({ error: "Deepgram TTS Failed" }, { status: 500 });
        }

        // Return Audio Stream
        return new Response(response.body, {
            headers: { "Content-Type": "audio/mp3" },
        });

    } catch (error) {
        console.error("TTS API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
