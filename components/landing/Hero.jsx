import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Sparkles, MessageSquare, CheckCircle } from "lucide-react";

export default function Hero() {
  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-background">
      {/* Dark Horizon Glow */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: "radial-gradient(125% 125% at 50% 90%, #000000 40%, #0d1a36 100%)",
        }}
      />

      <div className="container relative z-10 grid gap-8 px-4 py-16 md:px-6 md:py-24 lg:grid-cols-2 lg:gap-12 lg:px-8 lg:py-32">
        {/* Left Column - Text Content */}
        <div className="flex flex-col justify-center space-y-6">
          {/* Badge */}

          {/* Headline */}
          <h1 className="text-4xl font-extrabold leading-tight tracking-tighter md:text-5xl lg:text-6xl text-white">
            Interview practice that{" "}
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">actually feels real</span>
          </h1>

          {/* Description */}
          <p className="max-w-[600px] text-lg text-neutral-400">
            Assessly uses AI-driven interviews, voice interaction, and structured feedback to help you prepare for real hiring conversations — not MCQs.
          </p>

          {/* CTAs */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/login">
              <Button size="lg" className="w-full sm:w-auto bg-white text-black hover:bg-neutral-200">
                Start Free Interview  →
              </Button>
            </Link>
          </div>

          <div className="pt-8 flex items-center gap-8 text-neutral-500">
            <span className="text-sm">Trusted by candidates from:</span>
            <div className="flex items-center gap-6 opacity-70 grayscale transition-all duration-300 hover:grayscale-0 hover:opacity-100">
              <img src="/google.png" alt="Google" className="h-6 w-auto object-contain" />
              <img src="/meta.png" alt="Meta" className="h-5 w-auto object-contain" />
              <img src="/netflix.png" alt="Netflix" className="h-6 w-auto object-contain" />
              <img src="/nvidia.png" alt="Nvidia" className="h-5 w-auto object-contain" />
            </div>
          </div>
        </div>

        {/* Right Column - Video Call Mockup */}
        <div className="relative flex items-center justify-center lg:justify-end">
          <div className="relative w-full max-w-md">
            {/* Main Chat Interface */}
            <Card className="overflow-hidden border-neutral-800 bg-neutral-900/50 backdrop-blur-sm shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-neutral-800 bg-black/20 px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-red-500"></div>
                  <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                </div>
                <span className="text-xs font-medium text-neutral-400">AI Interviewer • 10:42 AM</span>
              </div>

              {/* Chat Content */}
              <div className="space-y-4 p-6">
                {/* AI Message */}
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium text-neutral-200">AI Interviewer</p>
                    <div className="rounded-lg rounded-tl-none bg-neutral-800/80 p-3 text-sm text-neutral-300">
                      Let's discuss a scenario. How would you design a distributed key-value store to handle millions of requests per second?
                    </div>
                  </div>
                </div>

                {/* User Message */}
                <div className="flex items-start gap-3 flex-row-reverse">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-700 text-white">
                    U
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium text-right text-neutral-200">You</p>
                    <div className="rounded-lg rounded-tr-none bg-blue-600 p-3 text-sm text-white ml-auto max-w-[85%]">
                      I'd start with consistent hashing for data distribution...
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Floating Status Card */}
            <Card className="absolute -bottom-4 -right-4 border-neutral-800 bg-neutral-900 p-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-200">Strong Opening</p>
                  <p className="text-xs text-neutral-400">Demonstrating confident technical understanding</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
