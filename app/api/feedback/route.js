import { Groq } from "groq-sdk";
import { NextResponse } from "next/server";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req) {
    try {
        const { messages, context } = await req.json();

        // Filter system messages if needed, but keeping them helps context
        // We only really need the specialized system prompt for the feedback generation

        const feedbackSystemPrompt = `
            You are a Senior Hiring Manager creating a post-interview report.
            Analyze the following interview transcript between a candidate and an interviewer(AI).
            
            Context:
            Target Company: ${context?.targetCompany || "General Tech"}
            Job Description: ${context?.jobDescription || "Software Engineer"}
            
            Output MUST be a valid JSON object with this exact structure:
            {
                "score": <integer_0_to_100>,
                "feedback": "<string_summary_paragraph>",
                "strengths": ["<string>", "<string>", "<string>"],
                "areasForImprovement": ["<string>", "<string>", "<string>"]
            }

            Scoring Guide:
            - 90-100: Hired immediately. Perfect answers, deep insight.
            - 80-89: Strong candidate. Good answers, minor nitpicks.
            - 70-79: Acceptable. Passed the bar, but unremarkable.
            - 60-69: Weak. Missed some key concepts.
            - <60: Rejected. Fundamental gaps.

            Be honest and critical. Do not hallucinate conversation that didn't happen.
            If the conversation was too short (less than 3 turns), give a low score and mention it was incomplete.
        `;

        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: feedbackSystemPrompt },
                ...messages.map(m => ({ role: m.role, content: m.content }))
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.1,
            response_format: { type: "json_object" },
            max_completion_tokens: 1024,
        });

        const result = completion.choices[0]?.message?.content;

        if (!result) {
            throw new Error("No content generated");
        }

        const parsedResult = JSON.parse(result);

        return NextResponse.json(parsedResult);

    } catch (error) {
        console.error("Error generating feedback:", error);
        // Fallback for failure cases
        return NextResponse.json({
            score: 0,
            feedback: "Failed to generate report due to server error. Please try again.",
            strengths: ["N/A"],
            areasForImprovement: ["N/A"]
        }, { status: 500 });
    }
}
