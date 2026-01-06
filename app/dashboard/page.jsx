"use client";

import { useState, useEffect } from "react";
import DashboardNav from "@/components/dashboard/DashboardNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BarChart3, Clock, TrendingUp, ArrowRight, Briefcase, FileText, Edit } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import jobDescriptions from "@/lib/jobDescriptions.json";

export default function DashboardPage() {
    const router = useRouter();
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [selectedRole, setSelectedRole] = useState(null);
    const [useCustomJD, setUseCustomJD] = useState(false);
    const [customJD, setCustomJD] = useState("");
    const [resumeText, setResumeText] = useState("");
    const [showResumeEditor, setShowResumeEditor] = useState(false);
    const [recentInterviews, setRecentInterviews] = useState([]);
    const [stats, setStats] = useState({ total: 0, avgScore: 0, lastWeek: 0 });

    // Hybrid Sync Logic
    useEffect(() => {
        if (typeof window !== "undefined") {
            const user = localStorage.getItem("user");
            if (!user) {
                router.push("/login");
                return;
            }

            // 1. Try Local Storage first (Speed)
            const savedContext = localStorage.getItem("interviewContext");
            let localDataFound = false;

            if (savedContext) {
                try {
                    const parsed = JSON.parse(savedContext);
                    if (parsed.resume || parsed.targetCompany) {
                        setResumeText(parsed.resume || "");
                        setCustomJD(parsed.jobDescription || "");
                        if (parsed.targetCompany) setSelectedCompany(parsed.targetCompany);
                        if (parsed.role) setSelectedRole(parsed.role);
                        localDataFound = true;
                    }
                } catch (e) {
                    console.error("Failed to parse saved context", e);
                }
            }

            // 2. If no local data, fetch from MongoDB (Persistence/Fallback)
            if (!localDataFound) {
                fetch('/api/user/sync')
                    .then(res => res.json())
                    .then(data => {
                        if (data.resume || data.targetCompany) {
                            setResumeText(data.resume || "");
                            setCustomJD(data.jobDescription || "");
                            if (data.targetCompany) setSelectedCompany(data.targetCompany);
                            if (data.role) setSelectedRole(data.role);

                            // Update local storage to match remote
                            localStorage.setItem("interviewContext", JSON.stringify(data));
                        }
                    })
                    .catch(err => console.error("Sync failed:", err));
            }

            // Load recent interviews (Local only for now, could be synced too)
            const historyStr = localStorage.getItem("interviewHistory");
            if (historyStr) {
                try {
                    const history = JSON.parse(historyStr);
                    setRecentInterviews(history.slice(0, 3));
                    const total = history.length;
                    const avgScore = total > 0 ? Math.round(history.reduce((sum, i) => sum + (i.score || 0), 0) / total) : 0;
                    const lastWeek = history.filter(i => {
                        const date = new Date(i.date);
                        const weekAgo = new Date();
                        weekAgo.setDate(weekAgo.getDate() - 7);
                        return date > weekAgo;
                    }).length;
                    setStats({ total, avgScore, lastWeek });
                } catch (e) { console.error("Failed to parse history", e); }
            }
        }
    }, [router]);

    const companies = ["Google", "Microsoft", "Amazon", "Meta", "Netflix"];

    const getRolesForCompany = (company) => {
        if (!company || !jobDescriptions[company]) return [];
        return Object.keys(jobDescriptions[company]);
    };

    const getJobDescription = () => {
        if (useCustomJD) return customJD;
        if (selectedCompany && selectedRole && jobDescriptions[selectedCompany]?.[selectedRole]) {
            return jobDescriptions[selectedCompany][selectedRole];
        }
        return "";
    };

    // Save to DB (Debounced)
    const saveToRemote = async (data) => {
        try {
            await fetch('/api/user/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } catch (e) {
            console.error("Remote save failed", e);
        }
    };

    const handleStartInterview = () => {
        const contextData = {
            resume: resumeText,
            jobDescription: getJobDescription(),
            targetCompany: selectedCompany || "General Tech Company",
            role: selectedRole || "General Role"
        };

        if (typeof window !== "undefined") {
            // Local Save (Instant)
            localStorage.setItem("interviewContext", JSON.stringify(contextData));
            // Remote Save (Async)
            saveToRemote(contextData);
        }
        router.push("/interview");
    };

    const handleSaveResume = () => {
        if (typeof window !== "undefined") {
            const savedContext = localStorage.getItem("interviewContext");
            let context = savedContext ? JSON.parse(savedContext) : {};
            context.resume = resumeText;

            // Local Save
            localStorage.setItem("interviewContext", JSON.stringify(context));
            // Remote Save
            saveToRemote(context);

            setShowResumeEditor(false);
        }
    };

    const formatDate = (isoString) => {
        if (!isoString) return "Unknown";
        return new Date(isoString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric"
        });
    };

    const currentJD = getJobDescription();

    return (
        <div className="flex min-h-screen flex-col">
            <DashboardNav />
            <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                    <Button variant="outline" size="sm" onClick={() => setShowResumeEditor(!showResumeEditor)}>
                        <Edit className="mr-2 h-4 w-4" />
                        {showResumeEditor ? "Hide" : "Edit"} Resume
                    </Button>
                </div>

                {/* Resume Editor (Collapsible) */}
                {showResumeEditor && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Your Resume</CardTitle>
                            <CardDescription>Update your resume text for personalized interview questions</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Textarea
                                placeholder="Paste your resume content here..."
                                className="min-h-[150px]"
                                value={resumeText}
                                onChange={(e) => setResumeText(e.target.value)}
                            />
                            <Button onClick={handleSaveResume}>
                                <FileText className="mr-2 h-4 w-4" />
                                Save Resume
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Interviews</CardTitle>
                            <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total}</div>
                            <p className="text-xs text-muted-foreground">All time</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.avgScore}/100</div>
                            <p className="text-xs text-muted-foreground">Across all interviews</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">This Week</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.lastWeek}</div>
                            <p className="text-xs text-muted-foreground">Last 7 days</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main Content - Start Interview */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Start New Interview</CardTitle>
                                <CardDescription>
                                    Select company, role, and choose a job description template or use your own
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Company Selection */}
                                <div className="space-y-2">
                                    <Label>Target Company</Label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {companies.map((company) => (
                                            <Button
                                                key={company}
                                                variant={selectedCompany === company ? "default" : "outline"}
                                                className="h-auto py-3"
                                                onClick={() => {
                                                    setSelectedCompany(company);
                                                    setSelectedRole(null);
                                                }}
                                            >
                                                {company}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                {/* Role Selection */}
                                {selectedCompany && (
                                    <div className="space-y-2">
                                        <Label>Select Role</Label>
                                        <Select value={selectedRole || ""} onValueChange={setSelectedRole}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Choose a role..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {getRolesForCompany(selectedCompany).map((role) => (
                                                    <SelectItem key={role} value={role}>
                                                        {role}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {/* JD Option Toggle */}
                                {selectedRole && (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-4">
                                            <Button
                                                variant={!useCustomJD ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setUseCustomJD(false)}
                                            >
                                                Use Template JD
                                            </Button>
                                            <Button
                                                variant={useCustomJD ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setUseCustomJD(true)}
                                            >
                                                Custom JD
                                            </Button>
                                        </div>

                                        {useCustomJD ? (
                                            <Textarea
                                                placeholder="Paste your custom job description..."
                                                className="min-h-[100px]"
                                                value={customJD}
                                                onChange={(e) => setCustomJD(e.target.value)}
                                            />
                                        ) : (
                                            <div className="rounded-lg border bg-muted/50 p-4 text-sm">
                                                <p className="font-medium mb-2">Template JD Preview:</p>
                                                <p className="text-muted-foreground line-clamp-3">{currentJD}</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <Button
                                    size="lg"
                                    className="w-full"
                                    onClick={handleStartInterview}
                                    disabled={!selectedCompany || !selectedRole}
                                >
                                    <Briefcase className="mr-2 h-4 w-4" />
                                    Start Interview Session
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar - Recent Interviews */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg">Recent Interviews</CardTitle>
                                    <Link href="/dashboard/history">
                                        <Button variant="ghost" size="sm">
                                            See More <ArrowRight className="ml-1 h-3 w-3" />
                                        </Button>
                                    </Link>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {recentInterviews.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        No interviews yet. Start your first one!
                                    </p>
                                ) : (
                                    recentInterviews.map((interview) => (
                                        <Link key={interview.id} href={`/dashboard/history/${interview.id}`}>
                                            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                                                <CardContent className="p-4">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="font-medium text-sm">{interview.company}</div>
                                                        <Badge variant={interview.score >= 80 ? "default" : "secondary"} className="text-xs">
                                                            {interview.score}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatDate(interview.date)}
                                                    </p>
                                                </CardContent>
                                            </Card>
                                        </Link>
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
