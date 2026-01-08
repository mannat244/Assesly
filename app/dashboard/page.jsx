"use client";

import { useState, useEffect, useRef } from "react";
import DashboardNav from "@/components/dashboard/DashboardNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BarChart3, Clock, TrendingUp, ArrowRight, Briefcase, FileText, Edit, Sparkles, Building2, MapPin, ExternalLink } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import jobDescriptions from "@/lib/jobDescriptions.json";
import { useAuth } from "@/context/AuthContext";
import JobCard from "@/components/jobs/JobCard";

export default function DashboardPage() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [selectedRole, setSelectedRole] = useState(null);
    const [useCustomJD, setUseCustomJD] = useState(false);
    const [customJD, setCustomJD] = useState("");
    const [resumeText, setResumeText] = useState("");
    const [showResumeEditor, setShowResumeEditor] = useState(false);
    const [recentInterviews, setRecentInterviews] = useState([]);
    const [stats, setStats] = useState({ total: 0, avgScore: 0, lastWeek: 0 });
    const dataLoaded = useRef(false);

    const [audioProvider, setAudioProvider] = useState("cartesia");
    const [featuredJobs, setFeaturedJobs] = useState([]);

    // Authentication check
    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    // DB Sync Logic - Fetch user data on mount
    useEffect(() => {
        if (!user || dataLoaded.current) return;

        dataLoaded.current = true;

        fetch('/api/user/sync')
            .then(res => res.json())
            .then(data => {
                if (data.resume || data.targetCompany) {
                    setResumeText(data.resume || "");
                    setCustomJD(data.jobDescription || "");
                    if (data.targetCompany) setSelectedCompany(data.targetCompany);
                    if (data.role) setSelectedRole(data.role);
                }
                if (data.preferences?.audioProvider) {
                    setAudioProvider(data.preferences.audioProvider);
                } else if (data.preferences?.usePremiumAudio) {
                    // Backward compatible migration
                    setAudioProvider(data.preferences.usePremiumAudio ? "elevenlabs" : "cartesia");
                }
                if (data.interviewHistory && Array.isArray(data.interviewHistory)) {
                    const history = data.interviewHistory;
                    // history is stored in reverse chronological order usually, or we sort it?
                    // Assuming API returns what we stored. 
                    // Let's just trust the API returns the history array.
                    // But wait, the stats logic was client side. 
                    // We should recalculate stats here.
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
                }
            })
            .catch(err => console.error("Sync failed:", err));
    }, [user]);

    // Fetch Featured Jobs from India
    useEffect(() => {
        async function fetchJobs() {
            try {
                const response = await fetch('/api/jobs/search?query=developer&country=in&page=1');
                const res = await response.json();
                if (res.success && res.data) {
                    setFeaturedJobs(res.data.slice(0, 4)); // Get top 4 jobs
                }
            } catch (err) {
                console.error("Failed to fetch jobs:", err);
            }
        }
        fetchJobs();
    }, []);

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

    // Save to DB
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

    const handleTogglePremium = async (newValue) => {
        setUsePremiumAudio(newValue);
        await saveToRemote({ preferences: { usePremiumAudio: newValue } });
    };

    const handleStartInterview = async () => {
        const contextData = {
            resume: resumeText,
            jobDescription: getJobDescription(),
            targetCompany: selectedCompany || "General Tech Company",
            role: selectedRole || "General Role"
        };

        // Save to DB
        await saveToRemote(contextData);

        router.push("/interview");
    };

    const handleSaveResume = async () => {
        const contextData = {
            resume: resumeText,
            // also preserve other fields so we don't overwrite them with null if the backend is doing a full replace
            // actually the API endpoint is doing a partial update (User.findByIdAndUpdate), so we can just send what we want to update.
            // But let's check api/user/sync
        };
        // Re-reading api/user/sync POST:
        // if (data.resume !== undefined) updateData.resume = data.resume;
        // So yes, we can just send the resume.

        await saveToRemote({ resume: resumeText });

        setShowResumeEditor(false);
    };

    const formatDate = (isoString) => {
        if (!isoString) return "Unknown";
        return new Date(isoString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric"
        });
    };

    const currentJD = getJobDescription();

    // Show loading state while checking authentication
    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    // Don't render dashboard content if not authenticated
    if (!user) {
        return null;
    }

    return (
        <div className="flex min-h-screen flex-col">
            <DashboardNav />
            <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
                {/* Hero Section */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 p-8 md:p-12">
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                            <Sparkles className="h-5 w-5 text-primary" />
                            <span className="text-sm font-medium text-primary">Welcome to Assessly</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold mb-3">
                            Ready to ace your next interview?
                        </h1>
                        <p className="text-muted-foreground text-lg mb-6 max-w-2xl">
                            Practice with AI-powered interviews, explore opportunities, and track your progress—all in one place.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <Button size="lg" variant="outline" onClick={() => router.push('/dashboard/jobs')} className="gap-2">
                                <Building2 className="h-4 w-4" />
                                Browse Jobs
                            </Button>
                            <Button size="lg" variant="ghost" onClick={() => setShowResumeEditor(!showResumeEditor)} className="gap-2">
                                <Edit className="h-4 w-4" />
                                {showResumeEditor ? "Hide" : "Edit"} Resume
                            </Button>
                        </div>
                        <div className="mt-8 flex items-center gap-2 text-sm text-muted-foreground animate-bounce">
                            <ArrowRight className="h-4 w-4 rotate-90" />
                            <span>Scroll down to start practicing</span>
                        </div>
                    </div>
                </div>

                {/* Featured Jobs Section */}
                {featuredJobs.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                                    <Building2 className="h-6 w-6 text-primary" />
                                    Featured Opportunities in India
                                </h2>
                                <p className="text-muted-foreground text-sm mt-1">
                                    Top roles matching your profile
                                </p>
                            </div>
                            <Link href="/dashboard/jobs">
                                <Button variant="ghost" size="sm" className="gap-1">
                                    View All <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {featuredJobs.map((job, idx) => (
                                <JobCard key={job.job_id || idx} job={job} index={idx} />
                            ))}
                        </div>
                    </div>
                )}


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
                <div className="grid grid-cols-3 gap-4 md:grid-cols-3">
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
                            <CardContent className="space-y-6">
                                {/* Step 1: Company & Role Selection */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">1</div>
                                        <span>Choose Your Target</span>
                                    </div>

                                    <div className="space-y-3 pl-8">
                                        <div className="space-y-2">
                                            <Label className="text-sm">Company</Label>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                {companies.map((company) => (
                                                    <Button
                                                        key={company}
                                                        variant={selectedCompany === company ? "default" : "outline"}
                                                        className="h-auto py-2.5 text-sm"
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

                                        {selectedCompany && (
                                            <div className="space-y-2">
                                                <Label className="text-sm">Role</Label>
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
                                    </div>
                                </div>

                                {/* Step 2: Job Description */}
                                {selectedRole && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">2</div>
                                            <span>Job Description</span>
                                        </div>

                                        <div className="space-y-3 pl-8">
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant={!useCustomJD ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => setUseCustomJD(false)}
                                                >
                                                    Use Template
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
                                                    className="min-h-[120px]"
                                                    value={customJD}
                                                    onChange={(e) => setCustomJD(e.target.value)}
                                                />
                                            ) : (
                                                <div className="rounded-lg border bg-muted/50 p-3 text-sm">
                                                    <p className="font-medium mb-1.5 text-xs text-muted-foreground">Template Preview:</p>
                                                    <p className="text-foreground/80 line-clamp-3 text-xs leading-relaxed">{currentJD}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Step 3: Voice Configuration */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">3</div>
                                        <span>Voice Settings</span>
                                    </div>

                                    <div className="pl-8">
                                        <div className="rounded-lg border bg-muted/30 p-4">
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="space-y-0.5">
                                                    <Label className="text-sm font-medium">AI Interviewer Voice</Label>
                                                    <p className="text-xs text-muted-foreground">
                                                        Choose your preferred voice model
                                                    </p>
                                                </div>
                                                <Select value={audioProvider} onValueChange={(val) => {
                                                    setAudioProvider(val);
                                                    saveToRemote({ preferences: { audioProvider: val } });
                                                }}>
                                                    <SelectTrigger className="w-[160px]">
                                                        <SelectValue placeholder="Select Voice" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="cartesia">Cartesia</SelectItem>
                                                        <SelectItem value="deepgram">Deepgram</SelectItem>
                                                        <SelectItem value="elevenlabs">ElevenLabs</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Start Button */}
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
                            <CardContent className="space-y-4">
                                {recentInterviews.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-8">
                                        No interviews yet. Start your first one!
                                    </p>
                                ) : (
                                    recentInterviews.map((interview) => (
                                        <Link className="flex flex-col" key={interview.id} href={`/dashboard/history/${interview.id}`}>
                                            <Card className="hover:bg-muted/50 transition-colors cursor-pointer border-l-4 border-l-primary/20 hover:border-l-primary">
                                                <CardContent className="p-2">
                                                    <div className="flex  items-center justify-between gap-4">
                                                        <div className="flex-1 min-w-0 space-y-2">
                                                            <div className="flex items-center gap-2">
                                                                <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                                <p className="font-medium text-sm truncate">{interview.company}</p>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                <Clock className="h-3 w-3 flex-shrink-0" />
                                                                <span>{formatDate(interview.date)}</span>
                                                            </div>
                                                        </div>
                                                        <Badge
                                                            variant={interview.score >= 80 ? "default" : "secondary"}
                                                            className="text-sm font-bold px-3 py-1.5 flex-shrink-0"
                                                        >
                                                            {interview.score}
                                                        </Badge>
                                                    </div>
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
        </div >
    );
}
