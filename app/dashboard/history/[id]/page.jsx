"use client";

import { useEffect, useState } from "react";
import DashboardNav from "@/components/dashboard/DashboardNav";
import { Card, CardContent, CardTitle, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { ChevronLeft, MessageSquare, CheckCircle, AlertCircle } from "lucide-react";
import { useParams } from "next/navigation";

export default function InterviewReportPage() {
    const { id } = useParams();
    const [session, setSession] = useState(null);

    useEffect(() => {
        if (!id) return;

        fetch('/api/user/sync')
            .then(res => res.json())
            .then(data => {
                if (data.interviewHistory && Array.isArray(data.interviewHistory)) {
                    const found = data.interviewHistory.find(s => s.id === id);
                    setSession(found);
                }
            })
            .catch(err => console.error("Failed to load session:", err));
    }, [id]);

    if (!session) {
        return (
            <div className="flex min-h-screen flex-col">
                <DashboardNav />
                <div className="p-8">Loading or Session Not Found...</div>
            </div>
        );
    }

    const formatDate = (isoString) => {
        if (!isoString) return "Unknown Date";
        return new Date(isoString).toLocaleDateString("en-US", {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric'
        });
    };

    return (
        <div className="flex min-h-screen flex-col">
            <DashboardNav />
            <div className="flex-1 space-y-4 p-8 pt-6">

                {/* Header */}
                <div className="flex items-center space-x-2 mb-6">
                    <Link href="/dashboard/history">
                        <Button variant="ghost" size="sm">
                            <ChevronLeft className="h-4 w-4 mr-1" /> Back
                        </Button>
                    </Link>
                    <h2 className="text-2xl font-bold tracking-tight">Interview Report</h2>
                </div>

                <div className="grid gap-6 md:grid-cols-7">

                    {/* Main Analysis Column */}
                    <div className="md:col-span-4 space-y-6">

                        {/* Summary Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Performance Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-muted-foreground">Target Company</p>
                                        <p className="text-2xl font-bold">{session.company}</p>
                                    </div>
                                    <div className="text-right space-y-1">
                                        <p className="text-sm font-medium text-muted-foreground">Overall Score</p>
                                        <div className="text-3xl font-extrabold text-primary">{session.score}/100</div>
                                    </div>
                                </div>

                                <Progress value={session.score} className="h-2" />

                                <div className="pt-4 border-t">
                                    <p className="text-sm font-medium text-muted-foreground mb-2">Examiner Feedback</p>
                                    <p className="text-sm leading-relaxed">
                                        {session.feedback || "No specific feedback provided for this session."}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Artificial/Mocked Analysis for now (since we don't have real granular data yet) */}
                        <div className="grid gap-4 md:grid-cols-2">
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium flex items-center">
                                        <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                                        Strengths
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="text-sm space-y-2 list-disc list-inside text-muted-foreground">
                                        {session.strengths && session.strengths.length > 0 ? (
                                            session.strengths.map((s, i) => <li key={i}>{s}</li>)
                                        ) : (
                                            <li>No specific strengths identified.</li>
                                        )}
                                    </ul>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium flex items-center">
                                        <AlertCircle className="h-4 w-4 mr-2 text-yellow-500" />
                                        Areas for Improvement
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="text-sm space-y-2 list-disc list-inside text-muted-foreground">
                                        {session.areasForImprovement && session.areasForImprovement.length > 0 ? (
                                            session.areasForImprovement.map((s, i) => <li key={i}>{s}</li>)
                                        ) : (
                                            <li>No specific improvements identified.</li>
                                        )}
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>

                    </div>

                    {/* Transcript Column */}
                    <div className="md:col-span-3">
                        <Card className="h-full flex flex-col">
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <MessageSquare className="h-4 w-4 mr-2" />
                                    Transcript
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-auto max-h-[600px] scrollbar-hide">
                                <div className="space-y-4">
                                    {session.messages && session.messages.filter(m => m.role !== 'system').map((m, i) => (
                                        <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                                            <span className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">
                                                {m.role === 'user' ? 'You' : 'Interviewer'}
                                            </span>
                                            <div className={`rounded-2xl px-4 py-2 text-sm max-w-[90%] ${m.role === 'user'
                                                ? 'bg-blue-600 text-white rounded-tr-none'
                                                : 'bg-muted rounded-tl-none'
                                                }`}>
                                                {m.content}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                </div>
            </div>
        </div>
    );
}
