"use client";

import { useEffect, useState } from "react";
import DashboardNav from "@/components/dashboard/DashboardNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Calendar, ChevronRight, Trophy } from "lucide-react";

export default function HistoryPage() {
    const [history, setHistory] = useState([]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const data = localStorage.getItem("interviewHistory");
            if (data) {
                try {
                    setHistory(JSON.parse(data));
                } catch (e) {
                    console.error("Failed to parse history", e);
                }
            }
        }
    }, []);

    const formatDate = (isoString) => {
        if (!isoString) return "Unknown Date";
        return new Date(isoString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "numeric"
        });
    };

    return (
        <div className="flex min-h-screen flex-col">
            <DashboardNav />
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Interview History</h2>
                </div>

                {history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[400px] border border-dashed rounded-lg bg-muted/40">
                        <p className="text-muted-foreground mb-4">No interviews completed yet.</p>
                        <Link href="/dashboard">
                            <Button>Start Your First Interview</Button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {history.map((session) => (
                            <Card key={session.id} className="hover:shadow-md transition-shadow">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        {session.company || "General Interview"}
                                    </CardTitle>
                                    <Badge variant={session.score >= 80 ? "default" : "secondary"}>
                                        {session.score || 0}/100
                                    </Badge>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center text-sm text-muted-foreground mb-4">
                                        <Calendar className="mr-1 h-3 w-3" />
                                        {formatDate(session.date)}
                                    </div>
                                    <div className="text-xs text-muted-foreground line-clamp-2 mb-4">
                                        {session.feedback}
                                    </div>
                                    <Link href={`/dashboard/history/${session.id}`}>
                                        <Button variant="outline" className="w-full">
                                            View Report <ChevronRight className="ml-1 h-3 w-3" />
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
