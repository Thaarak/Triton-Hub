"use client";

import { useState, useEffect } from "react";
import { Loader2, Megaphone, ExternalLink, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCanvasToken, syncCanvasData } from "@/lib/canvas";
import { format } from "date-fns";

interface AnnouncementItem {
    id: number;
    title: string;
    message: string;
    postedAt: string | null;
    courseName?: string;
    courseCode?: string;
    htmlUrl: string;
}

export function AnnouncementView() {
    const [announcements, setAnnouncements] = useState<AnnouncementItem[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasToken, setHasToken] = useState<boolean | null>(null);

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        setLoading(true);
        setError(null);

        try {
            // Get token from backend session
            const token = await getCanvasToken();
            
            if (!token) {
                setHasToken(false);
                setLoading(false);
                return;
            }
            
            setHasToken(true);

            const { announcements } = await syncCanvasData(token);

            // Sort by postedAt descending (newest first)
            const sorted = announcements.sort((a: any, b: any) => {
                if (!a.postedAt) return 1;
                if (!b.postedAt) return -1;
                return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
            });

            setAnnouncements(sorted);

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to fetch announcements');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return 'Unknown date';
        return format(new Date(dateStr), 'MMM d, h:mm a');
    };

    // Strip HTML tags for preview
    const stripHtml = (html: string) => {
        if (typeof window === 'undefined') return html.replace(/<[^>]*>/g, '');
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.body.textContent || "";
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                <p className="text-sm text-muted-foreground">Loading announcements...</p>
            </div>
        );
    }

    if (hasToken === false) {
        return (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-border rounded-xl p-6 text-center">
                <h3 className="text-lg font-semibold">Canvas Not Connected</h3>
                <p className="text-muted-foreground mt-2 mb-4">
                    Please log in to connect your Canvas account.
                </p>
                <a href="/login" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
                    Go to Login
                </a>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive font-medium">
                Error: {error}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Recent Announcements</h2>
                    <p className="text-sm text-muted-foreground mt-1">Latest updates from your courses</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="bg-secondary text-secondary-foreground text-xs font-semibold px-2.5 py-0.5 rounded-full">
                        {announcements?.length || 0} Total
                    </span>
                    <button
                        onClick={fetchAnnouncements}
                        disabled={loading}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md bg-muted hover:bg-muted/80 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                        Refresh
                    </button>
                </div>
            </div>

            {announcements && announcements.length > 0 ? (
                <div className="space-y-4">
                    {announcements.map((a) => (
                        <div key={a.id} className="group relative flex flex-col gap-2 rounded-xl border p-5 hover:bg-muted/50 transition-colors">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-500/10 dark:text-blue-400 px-1.5 py-0.5 rounded">
                                        {a.courseCode || a.courseName}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {formatDate(a.postedAt)}
                                    </span>
                                </div>
                                <a href={a.htmlUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                                    <ExternalLink className="h-4 w-4" />
                                </a>
                            </div>

                            <div>
                                <h3 className="text-base font-semibold leading-none tracking-tight group-hover:underline decoration-primary/50 underline-offset-4 transition-all">
                                    {a.title}
                                </h3>
                                <div className="text-sm text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                                    {stripHtml(a.message)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-64 border border-border rounded-xl bg-card">
                    <Megaphone className="h-10 w-10 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground font-medium">No announcements found!</p>
                </div>
            )}
        </div>
    );
}
