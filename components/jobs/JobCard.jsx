"use client";

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Calendar, ArrowRight, Building2, Globe } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function JobCard({ job, index = 0 }) {
    // Helper to format date relative (e.g., "2 days ago") or absolute
    const formatDate = (dateString) => {
        if (!dateString) return "Recently";
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return "Recently";
            return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        } catch (e) {
            return "Recently";
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
        >
            <Link href={`/dashboard/jobs/${encodeURIComponent(job.job_id)}`} prefetch={false}>
                <Card className="h-full flex flex-col group cursor-pointer border-muted hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 relative overflow-hidden">
                    {/* Subtle decorative gradient on hover */}
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary/0 group-hover:bg-primary transition-all duration-300" />

                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3 md:pb-2">
                        <div className="flex gap-3 md:gap-4 w-full">
                            <Avatar className="h-10 w-10 md:h-12 md:w-12 rounded-lg border bg-muted/50 flex-shrink-0">
                                <AvatarImage src={job.employer_logo} alt={job.employer_name} className="object-contain p-1" />
                                <AvatarFallback className="rounded-lg">{job.employer_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-sm md:text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2 md:line-clamp-1">
                                    {job.job_title}
                                </h3>
                                <p className="text-xs md:text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                                    <Building2 className="w-3 h-3 md:w-3.5 md:h-3.5 flex-shrink-0" />
                                    <span className="line-clamp-1">{job.employer_name}</span>
                                </p>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="flex-1 pb-3 md:pb-4 flex flex-col gap-2 md:gap-3">
                        <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
                            <Badge variant="secondary" className="font-normal text-xs px-2 py-0.5 rounded-md">
                                {job.job_employment_type || "Full-time"}
                            </Badge>
                            {job.job_is_remote && (
                                <Badge variant="outline" className="font-normal text-xs px-2 py-0.5 rounded-md border-primary/20 text-primary">
                                    Remote
                                </Badge>
                            )}
                            {/* Date - Mobile only (red spot) */}
                            <div className="flex md:hidden items-center gap-1 text-xs text-muted-foreground ml-auto">
                                <Calendar className="w-3 h-3 opacity-70" />
                                <span>{formatDate(job.job_posted_at_datetime_utc)}</span>
                            </div>
                        </div>

                        {/* Description - Hidden on mobile */}
                        <p className="hidden md:block text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {job.job_description ? job.job_description.slice(0, 150) + "..." : "View details for more information about this position."}
                        </p>

                        <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground pt-2 md:pt-3 border-t border-border/40">
                            <div className="flex items-center gap-2 md:gap-4">
                                <div className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3 md:w-3.5 md:h-3.5 opacity-70 flex-shrink-0" />
                                    <span className="line-clamp-1 max-w-[80px] md:max-w-[120px]">{job.job_city ? job.job_city : "Remote"}</span>
                                </div>
                                <div className="hidden md:flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5 opacity-70" />
                                    <span>{formatDate(job.job_posted_at_datetime_utc)}</span>
                                </div>
                            </div>

                            {/* View Details - Always visible on mobile (blue spot), hover on desktop */}
                            <div className="flex md:opacity-0 md:group-hover:opacity-100 items-center text-primary transition-opacity duration-300 font-medium text-xs">
                                Details <ArrowRight className="w-3 h-3 md:w-3.5 md:h-3.5 ml-1" />
                            </div>
                        </div>
                    </CardContent>

                    {/* Removed separate CardFooter to save height */}
                </Card>
            </Link>
        </motion.div>
    );
}
