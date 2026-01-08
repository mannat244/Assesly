import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

export async function POST(req) {
    try {
        const { text } = await req.json();

        if (!process.env.ELEVENLABS_API_KEY) {
            return new Response(JSON.stringify({ error: "ELEVENLABS_API_KEY not configured" }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const elevenlabs = new ElevenLabsClient({
            apiKey: process.env.ELEVENLABS_API_KEY,
        });

        // Voice ID: Brian (Deep Standard Male) - "nPczCjz86yL85AF55l3R"
        const audio = await elevenlabs.textToSpeech.convert("KrfvGW2D1x6nS5QnRj2q", {
            text,
            model_id: "eleven_flash_v2_5", // USER REQUESTED V2.5
            output_format: "mp3_44100_128",
        });

        return new Response(audio, {
            headers: {
                "Content-Type": "audio/mpeg",
            },
        });
    } catch (error) {
        console.error("ElevenLabs TTS Error:", error);
        // Extract error message if possible
        const errorMessage = error?.body?.message || error?.message || "TTS Failed";
        return new Response(JSON.stringify({ error: errorMessage }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
