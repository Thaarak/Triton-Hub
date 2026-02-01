"use client";

import { useState, useEffect } from "react";
import { Loader2, Megaphone, ExternalLink, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { syncCanvasData } from "@/lib/canvas";
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

const TOKEN_STORAGE_KEY = 'canvas_token';
const URL_STORAGE_KEY = 'canvas_url';

export function AnnouncementView() {
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [canvasUrl, setCanvasUrl] = useState<string | null>(null);
    const [announcements, setAnnouncements] = useState<AnnouncementItem[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const storedToken = sessionStorage.getItem(TOKEN_STORAGE_KEY);
        const storedUrl = sessionStorage.getItem(URL_STORAGE_KEY);
        setAccessToken(storedToken);
        setCanvasUrl(storedUrl);
    }, []);

    useEffect(() => {
        if (accessToken !== null) {
            if (accessToken) {
                fetchAnnouncements();
            } else {
                setLoading(false);
            }
        }
    }, [accessToken, canvasUrl]);

    const fetchAnnouncements = async () => {
        if (!accessToken) return;

        setLoading(true);
        setError(null);

        try {
            const { announcements } = await syncCanvasData(accessToken, canvasUrl || undefined);

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

    // Strip HTML tags for preview (simple version)
    const stripHtml = (html: string) => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.body.textContent || "";
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!accessToken) {
        return (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-border rounded-xl p-6 text-center">
                <h3 className="text-lg font-semibold">Canvas Not Connected</h3>
                <p className="text-muted-foreground mt-2 mb-4">
                    Connect your Canvas account on the Home page to view your announcements here.
                </p>
                <a href="/home" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
                    Go to Home
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
                <h2 className="text-2xl font-bold tracking-tight">Recent Announcements</h2>
                <span className="bg-secondary text-secondary-foreground text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    {announcements?.length || 0} Total
                </span>
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
