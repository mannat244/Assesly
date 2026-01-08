"use client";

import { useState, useEffect } from "react";
import DashboardNav from "@/components/dashboard/DashboardNav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, MapPin, Building2, Calendar, Globe, ExternalLink, Banknote, Loader2, Mic } from "lucide-react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";

export default function JobDetailsPage() {
    const params = useParams();
    const router = useRouter();
    // In Next.js App Router client components, params might be available directly or via hook. 
    // useParams() is the standard hook for client components.
    const id = params?.id;

    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [syncing, setSyncing] = useState(false);

    useEffect(() => {
        if (!id) return;

        const fetchJob = async () => {
            setLoading(true);
            try {
                // Determine API URL - decoded ID
                const decodedId = decodeURIComponent(id);
                const response = await fetch(`/api/jobs/details?id=${encodeURIComponent(decodedId)}`);
                const res = await response.json();

                if (res.success) {
                    setJob(res.data);
                } else {
                    setError(res.error || "Job not found");
                }
            } catch (err) {
                setError("Failed to load job details.");
            } finally {
                setLoading(false);
            }
        };

        fetchJob();
    }, [id]);

    const handleStartInterview = async () => {
        if (!job) return;
        setSyncing(true);
        try {
            const contextData = {
                jobDescription: job.job_description,
                targetCompany: job.employer_name,
                role: job.job_title
            };

            await fetch('/api/user/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(contextData)
            });

            router.push('/interview');
        } catch (e) {
            console.error("Failed to start interview", e);
            setSyncing(false);
        }
    };

    const formatDate = (dateString) => {
        try { return new Date(dateString).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }); }
        catch (e) { return "Recently"; }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen flex-col">
                <DashboardNav />
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </div>
        );
    }

    if (error || !job) {
        return (
            <div className="flex min-h-screen flex-col">
                <DashboardNav />
                <div className="flex-1 p-8 text-center text-muted-foreground">
                    <h2 className="text-2xl font-bold mb-2">Job Not Found</h2>
                    <p>{error || "The job posting you are looking for may have expired."}</p>
                    <Link href="/dashboard/jobs">
                        <Button variant="link" className="mt-4">Back to Jobs</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col">
            <DashboardNav />
            <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
                <div className="flex items-center space-x-2 mb-4">
                    <Link href="/dashboard/jobs" className="text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <h2 className="text-lg font-medium tracking-tight">Back to Listings</h2>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {/* Main Content */}
                    <div className="md:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <div className="flex items-start justify-between gap-4">
                                    <div className="space-y-1">
                                        <CardTitle className="text-2xl leading-tight">{job.job_title}</CardTitle>
                                        <CardDescription className="flex items-center gap-2 text-base mt-2">
                                            <Building2 className="w-4 h-4" /> {job.employer_name}
                                        </CardDescription>
                                    </div>
                                    <div className="shrink-0 h-16 w-16 bg-muted rounded-lg flex items-center justify-center overflow-hidden border">
                                        {job.employer_logo ? (
                                            <img src={job.employer_logo} alt={job.employer_name} className="max-w-full max-h-full object-contain" />
                                        ) : (
                                            <span className="text-2xl font-bold text-muted-foreground">{job.employer_name?.charAt(0)}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-4">
                                    {job.job_is_remote && <Badge variant="secondary">Remote</Badge>}
                                    <Badge variant="outline">{job.job_employment_type}</Badge>
                                    <div className="ml-auto text-sm text-muted-foreground flex items-center gap-1">
                                        <Calendar className="w-3 h-3" /> {formatDate(job.job_posted_at_datetime_utc)}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
                                <h3 className="text-foreground font-semibold mb-2">Description</h3>
                                <div className="whitespace-pre-wrap leading-relaxed">{job.job_description}</div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Job Overview</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-sm font-medium text-foreground mb-1">Location</p>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <MapPin className="w-4 h-4" />
                                        {job.job_city ? `${job.job_city}, ${job.job_country}` : "Remote"}
                                    </div>
                                </div>

                                {(job.job_min_salary || job.job_max_salary) && (
                                    <div>
                                        <p className="text-sm font-medium text-foreground mb-1">Salary</p>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Banknote className="w-4 h-4" />
                                            ${job.job_min_salary ? job.job_min_salary.toLocaleString() : ''} - ${job.job_max_salary ? job.job_max_salary.toLocaleString() : ''}
                                        </div>
                                    </div>
                                )}

                                <div className="pt-4 space-y-3">
                                    <Button onClick={handleStartInterview} className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0">
                                        {syncing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
                                        Practice for this Job
                                    </Button>
                                    <a href={job.job_apply_link} target="_blank" rel="noopener noreferrer" className="block w-full">
                                        <Button variant="default" className="w-full">Apply Now <ExternalLink className="ml-2 w-4 h-4" /></Button>
                                    </a>
                                    {job.employer_website && (
                                        <a href={job.employer_website} target="_blank" rel="noopener noreferrer" className="block w-full">
                                            <Button variant="outline" className="w-full">Visit Website</Button>
                                        </a>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
