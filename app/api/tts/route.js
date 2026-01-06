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

        // Voice ID: Sarah (Young American Female) - good neutral default, 
        // or we can use specific IDs if user provides. 
        // For "Sneha" (Indian), we might want to check if a specific ID exists or use a default.
        // I'll use a placeholder or a known accessible ID.
        // 'EXAVITQu4vr4xnSDxMaL' is "Bella", soft/professional.
        // '21m00Tcm4TlvDq8ikWAM' is "Rachel".
        // Let's use "Sarah" for now: 'EXAVITQu4vr4xnSDxMaL' (actually Bella) -> let's use a standard one.
        // Better: let's use "Nicole" (Australian) or generic.
        // Actually, "Flash v2.5" is the model.
        // Let's use a standard professional voice. "Rachel" is very common.
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
