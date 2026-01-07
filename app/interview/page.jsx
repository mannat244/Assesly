"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Mic, MicOff, Video, VideoOff, PhoneOff, Code, CodeXml } from "lucide-react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import "@uiw/react-textarea-code-editor/dist.css";

const CodeEditor = dynamic(
    () => import("@uiw/react-textarea-code-editor").then((mod) => mod.default),
    { ssr: false }
);

export default function InterviewPage() {
    const router = useRouter();
    const [micOn, setMicOn] = useState(true);
    const [cameraOn, setCameraOn] = useState(true);
    const [messages, setMessages] = useState([]); // Initialized in useEffect
    const [contextState, setContextState] = useState({ targetCompany: "General", jobDescription: "", resume: "", interviewHistory: [] }); // DB-First Context
    const [audioProvider, setAudioProvider] = useState("cartesia"); // Audio Preference
    const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
    const messagesRef = useRef([]); // Ref to hold latest messages for closures

    // Sync messages state to ref
    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);
    const [transcript, setTranscript] = useState("");
    const [isRecording, setIsRecording] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);
    const hasStartedRef = useRef(false);
    useEffect(() => { hasStartedRef.current = hasStarted; }, [hasStarted]);

    const [videoSrc, setVideoSrc] = useState("/listen.mp4");

    // Coding Mode State
    const [isCodingMode, setIsCodingMode] = useState(false);
    const [codeLanguage, setCodeLanguage] = useState("js");
    const [code, setCode] = useState(`function solution() {\n  // Write your code here\n  return;\n}`);

    const recognitionRef = useRef(null); // Keep for fallback
    const audioPlayerRef = useRef(null); // Audio Player logic
    const videoRef = useRef(null);
    const aiVideoRef = useRef(null);
    const silenceTimer = useRef(null);
    const transcriptRef = useRef(""); // Ref to hold latest transcript for closures

    // Sync transcript state to ref
    useEffect(() => { transcriptRef.current = transcript; }, [transcript]);

    // Handle AI Video State
    const [videoLoopCount, setVideoLoopCount] = useState(0);
    const [isAiCamOff, setIsAiCamOff] = useState(true); // START WITH CAMERA OFF (First-Load UX)

    useEffect(() => {
        let camTimer = null;

        if (isSpeaking) {
            // Audio started -> Turn Camera ON
            setIsAiCamOff(false);
            setVideoLoopCount(0);
            const speakVid = Math.random() > 0.5 ? "/speak1.mp4" : "/speak2.mp4";
            setVideoSrc(speakVid);
        } else {
            // AI is listening
            if (isAiCamOff) {
                // If cam is OFF, turn it back ON after 5-10s random delay
                const randomDelay = Math.floor(Math.random() * 5000) + 5000; // 5000ms to 10000ms
                camTimer = setTimeout(() => {
                    setIsAiCamOff(false);
                    setVideoLoopCount(0); // Reset loop count so she listens for a bit again
                }, randomDelay);
            } else {
                setVideoSrc("/listen.mp4");
            }
        }

        return () => clearTimeout(camTimer);
    }, [isSpeaking, isAiCamOff]);

    const handleVideoEnded = () => {
        if (!isSpeaking && videoSrc === "/listen.mp4") {
            const newCount = videoLoopCount + 1;
            setVideoLoopCount(newCount);

            // After 2 loops (~10-15s) of listening, simulate "Camera Off"
            if (newCount >= 2) {
                setIsAiCamOff(true);
            } else {
                // Restart video for loop effect
                if (aiVideoRef.current) {
                    aiVideoRef.current.currentTime = 0;
                    aiVideoRef.current.play().catch(() => { });
                }
            }
        }
    };

    // Initialize - Fetch Context from DB and Setup Prompt
    useEffect(() => {
        async function fetchContext() {
            try {
                const res = await fetch("/api/user/sync");
                if (!res.ok) {
                    if (res.status === 401) router.push("/login");
                    else console.error("Failed to load interview context");
                    return;
                }

                const data = await res.json();

                // Fallbacks if data is missing
                const userName = data.name || "Candidate";
                const targetCompany = data.targetCompany || "General Tech";
                const jobDescription = data.jobDescription || "Software Engineer";
                const resume = data.resume || "Not provided";

                // Save critical context for feedback/history later if needed (though history uses DB now too)
                // We can keep a minimal local context state if needed, or just rely on the conversation
                // For now, we mainly need to set the system prompt.

                // Also store minimal context for the "End Interview" feedback payload if it still reads strictly from localStorage? 
                // Wait, "End Interview" reads from localStorage in the current code (line ~670). 
                // We should update "End Interview" logic later or just update localStorage here as a "cache" for that button. 
                // To be safe and minimal: We update localStorage here JUST so the existing "End Interview" button works without refactoring it yet.
                // OR better: Refactor "End Interview" logic too. 
                // Let's refactor "End Interview" logic in a separate step or just include it?
                // The prompt says "remove local storage". So we must refactor "End Interview" too.
                // For this step, simply SET the messages. 
                // I will add a state `interviewContext` to the component to store this data for the "End Interview" button.

                const systemPrompt = `
                You are Sneha, a Senior Software Engineer and interviewer at ${targetCompany}.

                You are calm, precise, and professional. You are not hostile and not friendly.
                Your goal is to evaluate how the candidate thinks, not to intimidate them.

                CONTEXT:
                Candidate Name: ${userName}
                Target Company: ${targetCompany}
                Job Description: ${jobDescription}
                Candidate Resume: ${resume}

                INTERVIEW STYLE:
                - Speak like a real interviewer in a live video interview.
                - Short, clear sentences. **Max 2-3 sentences per turn.**
                - **NO numbered lists (1., 2., etc.)**. NO bullet points.
                - **NO markdown formatting** (bold, italics).
                - Conversational and natural. Do not lecture.
                - No exaggerated praise or fake enthusiasm.
                - You may acknowledge answers briefly with phrases like "Okay", "I see", or "Got it".

                INTERVIEW RULES:
                1. **PHASE 1: INTRODUCTION**: Start by greeting the candidate by name (${userName}). Ask them to briefly introduce themselves or walk you through their resume.
                2. **PHASE 2: PROJECT DEEP DIVE**: Pick a specific project from their resume (or ask about one if missing).
                   - Ask: "How did you implement [feature]?" or "Tell me about the architecture of [Project X]."
                   - Dig into specific technical decisions (DB choice, API design, challenges).
                   - DO NOT ask generic "What is React?" questions. Ask "How did YOU use React in this project?"
                3. **PHASE 3: PROBLEM SOLVING**: Only after discussing projects, move to hypothetical system design or coding challenges related to the job description.
                4. **General Rules**:
                   - Ask ONE clear question at a time.
                   - Keep it conversational.
                   - If they mention a technology, ask *why* they used it.

                Your goal is to decide whether this candidate can be trusted to work on real production systems.
                `;

                const initialMessages = [{ role: "system", content: systemPrompt }];
                setMessages(initialMessages);
                messagesRef.current = initialMessages;

                // Store context in state for Feedback generation and History updates
                setContextState({
                    targetCompany,
                    jobDescription,
                    resume,
                    interviewHistory: data.interviewHistory || [],
                });
                if (data.preferences?.audioProvider) {
                    setAudioProvider(data.preferences.audioProvider);
                } else if (data.preferences?.usePremiumAudio) {
                    setAudioProvider(data.preferences.usePremiumAudio ? "elevenlabs" : "cartesia");
                }

            } catch (error) {
                console.error("Error fetching context:", error);
            }
        }

        fetchContext();
    }, [router]);

    // Initialize Webcam
    useEffect(() => {
        let stream = null;
        if (cameraOn) {
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(s => {
                    stream = s;
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                })
                .catch(err => console.error("Error accessing webcam:", err));
        }
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [cameraOn]);

    const [error, setError] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // --- State Refs for Stable Callbacks ---
    const micOnRef = useRef(micOn);
    useEffect(() => { micOnRef.current = micOn; }, [micOn]);

    const isSpeakingRef = useRef(isSpeaking);
    useEffect(() => { isSpeakingRef.current = isSpeaking; }, [isSpeaking]);

    const isProcessingRef = useRef(isProcessing);
    useEffect(() => { isProcessingRef.current = isProcessing; }, [isProcessing]);

    const isRecordingRef = useRef(isRecording);
    useEffect(() => { isRecordingRef.current = isRecording; }, [isRecording]);

    const isGeneratingFeedbackRef = useRef(isGeneratingFeedback);
    useEffect(() => { isGeneratingFeedbackRef.current = isGeneratingFeedback; }, [isGeneratingFeedback]);


    // --- Stable Helper Functions ---



    const startListening = useCallback(() => {
        if (!micOnRef.current || isSpeakingRef.current || isProcessingRef.current || isRecordingRef.current) return;
        setIsRecording(true);
        try {
            if (recognitionRef.current) recognitionRef.current.start();
        } catch (e) {
            // console.error("Speech Start Error:", e); 
        }
    }, []);

    // Clean text helper
    const cleanTextForSpeech = (text) => {
        return text
            .replace(/[*#_`~-]/g, "")
            .replace(/\[.*?\]/g, "")
            .replace(/\n/g, ". ");
    };

    const speak = useCallback(async (text) => {
        setIsProcessing(true);
        if (recognitionRef.current) recognitionRef.current.stop();

        const cleanText = cleanTextForSpeech(text);

        // RETRY LOGIC for TTS API
        const MAX_RETRIES = 2; // Total 3 attempts
        let attempt = 0;
        let audioUrl = null;

        while (attempt <= MAX_RETRIES && !audioUrl) {
            try {
                // Tiered Audio Architecture
                let endpoint = "/api/cartesia"; // Default: Cartesia (Sonic-3)
                if (audioProvider === "elevenlabs") {
                    endpoint = "/api/tts"; // Premium: ElevenLabs
                } else if (audioProvider === "deepgram") {
                    endpoint = "/api/speak"; // Economy: Deepgram
                }

                const response = await fetch(endpoint, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text: cleanText }),
                });

                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    throw new Error(errData.error || "TTS API Failed");
                }

                const audioBlob = await response.blob();
                audioUrl = URL.createObjectURL(audioBlob);

            } catch (error) {
                console.warn(`TTS Attempt ${attempt + 1} failed:`, error);
                attempt++;
                if (attempt <= MAX_RETRIES) {
                    // Wait 500ms before retry
                    await new Promise(r => setTimeout(r, 500));
                }
            }
        }

        if (audioUrl) {
            // SUCCESS - Play Audio
            if (audioPlayerRef.current) audioPlayerRef.current.pause();
            const audio = new Audio(audioUrl);
            audioPlayerRef.current = audio;

            audio.onended = () => {
                setIsSpeaking(false);
                setTimeout(() => { if (micOnRef.current) startListening(); }, 500);
            };

            try {
                await audio.play();
                setIsProcessing(false);
                setIsSpeaking(true);
                if (isCodingMode) setIsCodingMode(false);
            } catch (playError) {
                console.error("Audio playback error:", playError);
                // If playback fails (e.g. autoplay policy), try fallback
                fallbackToWebSpeech(cleanText);
            }
        } else {
            // FAILURE - Fallback to Web Speech
            console.warn("All TTS retries failed. Using Web Speech fallback.");
            fallbackToWebSpeech(cleanText);
        }
    }, [startListening, isCodingMode, audioProvider]);

    const fallbackToWebSpeech = (text) => {
        if (typeof window !== "undefined" && window.speechSynthesis) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);

            // Voice selection logic
            const voices = window.speechSynthesis.getVoices();
            let selectedVoice = voices.find(v => v.lang.includes('en-IN') || v.name.includes('India'));
            // If no specific Indian voice, try to find a female voice or Google US English which is often better than default
            if (!selectedVoice) selectedVoice = voices.find(v => v.name.includes('Google US English'));
            if (!selectedVoice) selectedVoice = voices.find(v => v.name.includes('Female') || v.name.includes('Samantha'));

            if (selectedVoice) utterance.voice = selectedVoice;

            // Slow down slightly for clarity if it's the robotic voice
            utterance.rate = 0.95;

            utterance.onstart = () => { setIsProcessing(false); setIsSpeaking(true); };
            utterance.onend = () => {
                setIsSpeaking(false);
                setTimeout(() => { if (micOnRef.current) startListening(); }, 100);
            };
            window.speechSynthesis.speak(utterance);
        } else {
            setIsProcessing(false);
            setIsSpeaking(false);
        }
    };

    const handleUserResponse = useCallback(async (userText) => {
        setIsProcessing(true);
        if (recognitionRef.current) recognitionRef.current.stop();

        let currentHistory = messagesRef.current;
        let newMessages = [...currentHistory];

        if (userText) {
            console.log("📝 User Input:", userText);
            newMessages.push({ role: "user", content: userText });
            setMessages(newMessages);
            messagesRef.current = newMessages; // Update ref!
            setTranscript("");
            transcriptRef.current = "";
        } else {
            console.log("🚀 Starting Interview");
            setHasStarted(true);
        }

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: newMessages }),
            });

            if (!response.body) throw new Error("No response body");
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let aiText = "";

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                aiText += decoder.decode(value, { stream: true });
            }

            const updatedMessages = [...newMessages, { role: "assistant", content: aiText }];
            setMessages(updatedMessages);
            messagesRef.current = updatedMessages;

            speak(aiText);
        } catch (error) {
            console.error("Error fetching AI response:", error);
            setIsProcessing(false);
            if (micOnRef.current) startListening();
        }
    }, [speak, startListening]);

    const stopAndSubmit = useCallback(() => {
        if (recognitionRef.current) recognitionRef.current.stop();

        const text = transcriptRef.current; // Use ref for latest transcript
        if (text && text.trim().length > 1 && !isSpeakingRef.current && !isProcessingRef.current) {
            handleUserResponse(text.trim());
            setTranscript("");
            transcriptRef.current = "";
        } else if (micOnRef.current && !isSpeakingRef.current && !isProcessingRef.current) {
            // Just noise or empty
        }
    }, [handleUserResponse]);

    // --- Speech Recognition Setup ---
    useEffect(() => {
        if (typeof window !== "undefined") {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
                setError("Browser does not support Speech Recognition. Please use Chrome.");
                return;
            }

            recognitionRef.current = new SpeechRecognition();
            // MOBILE-SAFE CONFIG: Turn-based, not continuous
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'en-IN'; // Better accent support

            recognitionRef.current.onresult = (event) => {
                if (isSpeakingRef.current || isProcessingRef.current) return;

                let finalTranscript = "";
                let interimTranscript = "";

                // Mobile-safe: Only process NEW results from this turn
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }

                // UI update: Show whatever we have (interim or final)
                const displayText = interimTranscript || finalTranscript;
                if (displayText) {
                    setTranscript(displayText);
                }

                // Submission logic: Only trust FINAL results
                if (finalTranscript.trim()) {
                    clearTimeout(silenceTimer.current);

                    // Small delay to allow for natural pauses between sentences in a single turn, 
                    // but since continuous=false, this "turn" might end abruptly. 
                    // We need to accumulate? No, turn-based means we interpret *this* utternace.
                    // For short 800ms silence = submit.

                    // Actually, with continuous=false, onend might fire right after final.
                    // We should capture the final text and store it, or submit it.
                    // Let's use the silence timer to debounce the submission.

                    // Update the Ref so stopAndSubmit has it
                    transcriptRef.current = finalTranscript;

                    silenceTimer.current = setTimeout(() => {
                        stopAndSubmit();
                    }, 2000);
                }
            };

            recognitionRef.current.onerror = (event) => {
                // Ignore 'no-speech' errors which are common
                if (event.error !== 'no-speech') {
                    console.warn("Speech Recognition Error:", event.error);
                }

                if (event.error === 'not-allowed') {
                    setError("Microphone access denied.");
                    setMicOn(false);
                }
            };

            recognitionRef.current.onend = () => {
                setIsRecording(false);

                // Auto-restart loop (The "Pulse" of the conversation)
                // Only restart if: Mic is ON, AI is NOT speaking, AI is NOT thinking
                if (micOnRef.current && !isSpeakingRef.current && !isProcessingRef.current && !isGeneratingFeedbackRef.current) {
                    // Small delay to prevent CPU spinning
                    setTimeout(() => startListening(), 400);
                }
            };

            // Start immediately
            startListening();

            return () => {
                if (recognitionRef.current) recognitionRef.current.abort();
                clearTimeout(silenceTimer.current);
            };
        }
    }, [startListening, stopAndSubmit]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
            if (recognitionRef.current) recognitionRef.current.abort();
        };
    }, []);

    const toggleMic = useCallback(() => {
        const newState = !micOn;
        setMicOn(newState);
        if (!newState) {
            // Mic MUTED -> Stop everything
            if (audioPlayerRef.current) {
                audioPlayerRef.current.pause();
                audioPlayerRef.current = null;
            }
            setIsSpeaking(false);
            if (recognitionRef.current) recognitionRef.current.abort();
        } else {
            // Mic UNMUTED -> Start listening
            setTimeout(() => startListening(), 100);
        }
    }, [micOn, startListening]);

    const toggleCam = () => setCameraOn(!cameraOn);

    const handleCodeSubmit = async () => {
        setIsProcessing(true);
        const codeMessage = `[CODE SUBMISSION]:\n\`\`\`javascript\n${code}\n\`\`\``;
        await handleUserResponse(codeMessage);
    };

    return (
        <div className="flex flex-col h-[100dvh] bg-neutral-950 text-white">
            {/* Video Area */}
            <div className={`flex-1 flex md:max-h-[85vh] transition-all duration-500 
                ${isCodingMode ? 'flex-col md:flex-row p-4 gap-4' : 'flex-col md:flex-row items-center justify-center p-0 md:p-4 md:gap-4'}`}>

                {/* Main Content Area: Either Video (when not coding) or Code Editor (when coding) */}
                <div className={`relative bg-neutral-900 overflow-hidden shadow-2xl transition-all duration-500 
                    ${isCodingMode ? 'w-full md:w-2/3 order-2 rounded-2xl border border-neutral-800' : 'w-full md:max-w-4xl h-full md:h-auto md:aspect-video order-1 rounded-none md:rounded-2xl md:border border-neutral-800'}`}>

                    {isCodingMode ? (
                        // CODING ENVIRONMENT
                        <div className="flex flex-col h-full">
                            <div className="bg-neutral-800 px-4 py-2 flex justify-between items-center border-b border-neutral-700">
                                <span className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                                    <CodeXml className="w-4 h-4 text-indigo-400" /> Live Code Editor
                                </span>
                                <div className="flex items-center gap-2">
                                    <Select value={codeLanguage} onValueChange={setCodeLanguage}>
                                        <SelectTrigger className="h-7 w-24 text-xs border-neutral-600 bg-neutral-700 text-neutral-200">
                                            <SelectValue placeholder="Lang" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-neutral-800 border-neutral-700 text-neutral-200">
                                            <SelectItem value="js">JavaScript</SelectItem>
                                            <SelectItem value="python">Python</SelectItem>
                                            <SelectItem value="java">Java</SelectItem>
                                            <SelectItem value="cpp">C++</SelectItem>
                                            <SelectItem value="html">HTML</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button size="sm" onClick={handleCodeSubmit} disabled={isProcessing} className="bg-indigo-600 hover:bg-indigo-700 h-7 text-xs">
                                        {isProcessing ? "Reviewing..." : "Submit Code"}
                                    </Button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-auto bg-[#1e1e1e]">
                                <CodeEditor
                                    value={code}
                                    language={codeLanguage}
                                    placeholder="Please enter JS code."
                                    onChange={(evn) => setCode(evn.target.value)}
                                    padding={20}
                                    style={{
                                        fontSize: 14,
                                        backgroundColor: "#1e1e1e",
                                        fontFamily: 'ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace',
                                        minHeight: "100%",
                                    }}
                                />
                            </div>
                        </div>
                    ) : (
                        // INTERVIEWER VIDEO (Standard View)
                        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                            {!hasStarted ? (
                                // Initial State: Circle Avatar
                                <div className="text-center animate-in fade-in duration-700">
                                    <Avatar className="w-40 h-40 md:w-56 md:h-56 mx-auto border-4 border-indigo-500/30 mb-6 shadow-xl">
                                        <AvatarImage src="/avatar.jpg" className="object-cover" />
                                        <AvatarFallback>Sneha</AvatarFallback>
                                    </Avatar>
                                    <h3 className="text-2xl font-light text-neutral-300">Ready for your interview?</h3>
                                    <p className="text-neutral-500 mt-2">Sneha is waiting to start.</p>
                                </div>
                            ) : isAiCamOff ? (
                                // "Camera Off" State (Simulated)
                                <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-900 animate-in fade-in duration-500">
                                    <Avatar className="w-32 h-32 border-4 border-neutral-700 mb-4 opacity-50">
                                        <AvatarImage src="/avatar.jpg" className="object-cover grayscale" />
                                        <AvatarFallback>Sneha</AvatarFallback>
                                    </Avatar>
                                    <div className="flex items-center gap-2 text-neutral-500">
                                        <VideoOff className="w-5 h-5" />
                                        <span className="text-sm font-medium">Camera Off</span>
                                    </div>
                                </div>
                            ) : (
                                // Active State: Full Video
                                <video
                                    ref={aiVideoRef}
                                    src={videoSrc}
                                    autoPlay
                                    loop={isSpeaking}
                                    playsInline
                                    onEnded={handleVideoEnded}
                                    className="w-full h-full object-cover transition-opacity duration-300"
                                    style={{ objectPosition: 'center' }}
                                />
                            )}
                        </div>
                    )}

                    {/* Transcripts & Overlays (Only show in Video Mode) */}
                    {!isCodingMode && (
                        <div className="absolute bottom-16 md:bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl text-center pointer-events-none z-20 px-4">
                            {isRecording && (
                                <div className="inline-flex items-center gap-3 bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full text-base font-medium text-white/90 shadow-lg border border-white/5 animate-in fade-in slide-in-from-bottom-2">
                                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                    <span className="text-sm">{transcript || "Listening..."}</span>
                                </div>
                            )}
                            {error && !isRecording && (
                                <div className="inline-block bg-red-900/80 backdrop-blur-md px-6 py-3 rounded-full text-lg font-medium text-white shadow-lg mt-2">
                                    ⚠️ {error}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* SIDEBAR (Visible only in Coding Mode) */}
                {isCodingMode && (
                    <div className="w-full md:w-1/3 order-1 flex flex-col gap-4 animate-in slide-in-from-left-10 duration-500">
                        {/* AI Sidebar View ("Camera Off" static avatar as per request) */}
                        <div className="w-full aspect-video bg-neutral-900 rounded-xl overflow-hidden border border-neutral-800 flex items-center justify-center">
                            <div className="flex flex-col items-center opacity-70">
                                <Avatar className="w-20 h-20 border-2 border-neutral-700 mb-2">
                                    <AvatarImage src="/avatar.jpg" className="object-cover grayscale" />
                                    <AvatarFallback>Sneha</AvatarFallback>
                                </Avatar>
                                <span className="text-xs text-neutral-500">Interviewer (Listening)</span>
                            </div>
                        </div>

                        {/* Context/Prompt Area */}
                        <div className="flex-1 bg-neutral-900/50 rounded-xl p-4 border border-neutral-800/50 overflow-y-auto">
                            <h4 className="text-sm font-semibold text-indigo-400 mb-2">Instructions</h4>
                            <p className="text-sm text-neutral-400 leading-relaxed">
                                {messages[messages.length - 1]?.role === 'assistant' ? messages[messages.length - 1].content : "Waiting for instructions..."}
                            </p>
                        </div>
                    </div>
                )}

                {/* User Video Overlay - Fixed to Screen (Desktop: Bottom-Right, Mobile: Top-Right) */}
                <motion.div
                    drag
                    dragConstraints={{ left: -300, right: 0, top: 0, bottom: 300 }}
                    whileHover={{ scale: 1.05 }}
                    className={`fixed top-20 right-4 md:top-auto md:bottom-28 md:right-8 z-40
                    w-28 md:w-64 aspect-video bg-black rounded-xl border border-white/10 overflow-hidden shadow-2xl 
                    ${isCodingMode ? 'opacity-75 hover:opacity-100' : ''}`}
                >
                    {cameraOn ? (
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-neutral-800">
                            <VideoOff className="w-6 h-6 text-muted-foreground" />
                        </div>
                    )}
                    <div className="absolute bottom-2 left-3 text-[10px] md:text-xs font-medium text-white/50 tracking-wider">YOU</div>
                </motion.div>

            </div>

            {/* Controls */}
            <div className="h-24 bg-neutral-950 border-t border-neutral-800/50 flex items-center justify-center gap-6 pb-4 z-50 relative">
                {/* ... (buttons kept same, just context) ... */}
                <Button variant={micOn ? "secondary" : "destructive"} size="icon" className="rounded-full h-14 w-14 shadow-lg transition-transform hover:scale-105" onClick={toggleMic}>
                    {micOn ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
                </Button>

                {/* Code Editor Toggle */}
                {hasStarted && (
                    <Button
                        variant={isCodingMode ? "default" : "secondary"}
                        size="icon"
                        className={`rounded-full h-14 w-14 shadow-lg transition-transform hover:scale-105 ${isCodingMode ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : ''}`}
                        onClick={() => setIsCodingMode(!isCodingMode)}
                        title="Toggle Code Editor"
                    >
                        {isCodingMode ? <CodeXml className="h-6 w-6" /> : <Code className="h-6 w-6" />}
                    </Button>
                )}

                {!hasStarted && messages.length === 1 ? (
                    <Button
                        size="lg"
                        className="h-16 px-10 rounded-full text-xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-[0_0_30px_-5px_rgba(59,130,246,0.5)] hover:shadow-[0_0_50px_-10px_rgba(59,130,246,0.8)] transition-all duration-300 transform hover:scale-105 active:scale-95 border border-white/10"
                        onClick={() => handleUserResponse(null)}
                    >
                        Start Interview
                    </Button>
                ) : (
                    <Button
                        variant="destructive"
                        size="icon"
                        className="rounded-full h-14 w-14 shadow-lg transition-transform hover:scale-105"
                        disabled={isGeneratingFeedback}
                        onClick={async () => {
                            if (typeof window !== "undefined") {
                                setIsGeneratingFeedback(true);
                                try {
                                    // DB-First: Use state, not localStorage
                                    const history = [...contextState.interviewHistory];
                                    const context = {
                                        targetCompany: contextState.targetCompany,
                                        jobDescription: contextState.jobDescription,
                                        resume: contextState.resume
                                    };

                                    const feedbackResponse = await fetch("/api/feedback", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({
                                            messages: messages,
                                            context: context
                                        }),
                                    });

                                    let feedbackData = { score: 0, feedback: "Analysis unavailable.", strengths: [], areasForImprovement: [] };
                                    if (feedbackResponse.ok) feedbackData = await feedbackResponse.json();

                                    const newSession = {
                                        id: Date.now().toString(),
                                        date: new Date().toISOString(),
                                        company: context.targetCompany,
                                        score: feedbackData.score || 0,
                                        messages: messages,
                                        feedback: feedbackData.feedback,
                                        strengths: feedbackData.strengths,
                                        areasForImprovement: feedbackData.areasForImprovement
                                    };

                                    history.unshift(newSession);

                                    // Save to MongoDB
                                    try {
                                        await fetch('/api/user/sync', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ interviewHistory: history })
                                        });
                                    } catch (err) {
                                        console.error("Failed to sync history remotely", err);
                                    }

                                    router.push('/dashboard/history');
                                } catch (e) {
                                    console.error("Error ending interview:", e);
                                    setIsGeneratingFeedback(false);
                                }
                            }
                        }}>
                        {isGeneratingFeedback ? (
                            <div className="h-6 w-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <PhoneOff className="h-6 w-6" />
                        )}
                    </Button>
                )}

                <Button variant={cameraOn ? "secondary" : "destructive"} size="icon" className="rounded-full h-14 w-14 shadow-lg transition-transform hover:scale-105" onClick={toggleCam}>
                    {cameraOn ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
                </Button>
            </div>

            {/* Conversation Captions (Subtitles logic) - Synced with Audio */}
            {isSpeaking && messages.length > 0 && messages[messages.length - 1]?.role === 'assistant' && (
                <div className="absolute bottom-32 md:bottom-36 left-0 right-0 text-center px-6 pointer-events-none z-30">
                    <span className="inline-block bg-black/60 backdrop-blur-md px-6 py-4 rounded-3xl text-white/95 text-lg md:text-xl font-medium shadow-2xl border border-white/10 leading-relaxed tracking-wide">
                        {messages[messages.length - 1].content}
                    </span>
                </div>
            )}
        </div>
    );
}