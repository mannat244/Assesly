"use client";

import { useState, useEffect } from "react";
import DashboardNav from "@/components/dashboard/DashboardNav";
import JobCard from "@/components/jobs/JobCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, Briefcase } from "lucide-react";
import { motion } from "framer-motion";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, Globe } from "lucide-react";

export default function JobsPage() {
    const [query, setQuery] = useState("developer");
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filter States
    const [datePosted, setDatePosted] = useState("all");
    const [jobType, setJobType] = useState("FULLTIME");
    const [remote, setRemote] = useState(false);
    const [country, setCountry] = useState("us");

    const fetchJobs = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                query: query,
                date_posted: datePosted,
                job_type: jobType,
                remote: remote.toString(),
                country: country
            });

            const response = await fetch(`/api/jobs/search?${params.toString()}`);
            const res = await response.json();

            if (res.success) {
                setJobs(res.data);
            } else {
                setError(res.error || "Failed to fetch jobs");
            }
        } catch (err) {
            setError("Failed to connect to search service.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs();
    }, []); // Initial load

    const handleSearch = (e) => {
        e.preventDefault();
        fetchJobs();
    };

    return (
        <div className="flex min-h-screen flex-col">
            <DashboardNav />
            <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Job Market</h2>
                </div>

                <div className="flex flex-col space-y-4">
                    {/* Search & Filter Bar */}
                    <div className="bg-card border rounded-xl p-4 shadow-sm space-y-4 md:space-y-0 md:flex md:items-center md:gap-4">
                        <form onSubmit={handleSearch} className="flex-1 flex items-center gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Job title, keywords, or company..."
                                    className="pl-9 bg-background/50 border-input/60 focus:bg-background transition-colors"
                                />
                            </div>
                        </form>

                        <div className="flex flex-wrap items-center gap-2">
                            <Select value={country} onValueChange={setCountry}>
                                <SelectTrigger className="w-[100px] h-10">
                                    <SelectValue placeholder="Country" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="us">🇺🇸 USA</SelectItem>
                                    <SelectItem value="in">🇮🇳 India</SelectItem>
                                    <SelectItem value="gb">🇬🇧 UK</SelectItem>
                                    <SelectItem value="ca">🇨🇦 Canada</SelectItem>
                                    <SelectItem value="au">🇦🇺 Aus</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={datePosted} onValueChange={setDatePosted}>
                                <SelectTrigger className="w-[130px] h-10">
                                    <SelectValue placeholder="Date Posted" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Any Time</SelectItem>
                                    <SelectItem value="today">Today</SelectItem>
                                    <SelectItem value="3days">Last 3 Days</SelectItem>
                                    <SelectItem value="week">This Week</SelectItem>
                                    <SelectItem value="month">This Month</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={jobType} onValueChange={setJobType}>
                                <SelectTrigger className="w-[130px] h-10">
                                    <SelectValue placeholder="Job Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="FULLTIME">Full-time</SelectItem>
                                    <SelectItem value="CONTRACTOR">Contractor</SelectItem>
                                    <SelectItem value="PARTTIME">Part-time</SelectItem>
                                    <SelectItem value="INTERN">Intern</SelectItem>
                                </SelectContent>
                            </Select>

                            <Button
                                type="button"
                                variant={remote ? "default" : "outline"}
                                onClick={() => setRemote(!remote)}
                                className="h-10 gap-2 px-4"
                            >
                                <Globe className="w-4 h-4" />
                                <span className="hidden sm:inline">Remote</span>
                            </Button>

                            <Button onClick={handleSearch} className="h-10 px-6 bg-primary hover:bg-primary/90">
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Find Jobs"}
                            </Button>
                        </div>
                    </div>

                    {/* Content Area */}
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="h-[200px] rounded-xl border bg-card text-card-foreground shadow animate-pulse" />
                            ))}
                        </div>
                    ) : error ? (
                        <div className="rounded-md bg-destructive/15 p-4 text-destructive text-center">
                            <p>⚠️ {error}</p>
                            <Button variant="outline" className="mt-2" onClick={() => fetchJobs(query)}>Retry</Button>
                        </div>
                    ) : jobs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                            <Briefcase className="h-12 w-12 mb-4 opacity-20" />
                            <p>No jobs found.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {jobs.map((job, idx) => (
                                <JobCard key={job.job_id || idx} job={job} index={idx} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
