import { Groq } from "groq-sdk";
import { NextResponse } from "next/server";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || "dummy_key",
});

export async function POST(req) {
    try {
        const { messages } = await req.json();

        console.log("------------------------------------------------");
        console.log("🔍 SERVER RECEIVED MESSAGES:");
        messages.forEach((m, i) => console.log(`[${i}] ${m.role.toUpperCase()}: ${m.content.slice(0, 100)}...`));
        console.log("------------------------------------------------");

        const completion = await groq.chat.completions.create({
            messages: messages,
            model: "openai/gpt-oss-120b", // As requested by user
            temperature: 0.1,
            max_completion_tokens: 500,
            top_p: 1,
            stream: true,
            stop: null,
        });

        const stream = new ReadableStream({
            async start(controller) {
                for await (const chunk of completion) {
                    const content = chunk.choices[0]?.delta?.content || "";
                    if (content) {
                        controller.enqueue(new TextEncoder().encode(content));
                    }
                }
                controller.close();
            },
        });

        return new NextResponse(stream, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
            },
        });
    } catch (error) {
        console.error("Error in chat API:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
