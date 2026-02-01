"use client";

import { useState, useEffect } from "react";
import { Loader2, Megaphone, ExternalLink } from "lucide-react";
import { fetchNotifications } from "@/lib/notifications";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import type { Notification } from "@/lib/types";

interface AnnouncementItem {
    id: string;
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
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    useEffect(() => {
        const loadAnnouncements = async () => {
            setLoading(true);
            setError(null);

            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    setIsAuthenticated(false);
                    setLoading(false);
                    return;
                }
                setIsAuthenticated(true);

                const notifications = await fetchNotifications();

                // Filter for announcements only
                const announcementNotifs = notifications.filter(
                    (n: Notification) => n.category === "announcement"
                );

                // Transform to AnnouncementItem format
                const items: AnnouncementItem[] = announcementNotifs.map((n: Notification) => ({
                    id: `notif-${n.id}`,
                    title: n.summary,
                    message: n.summary,
                    postedAt: n.created_at,
                    courseName: n.source,
                    courseCode: n.source,
                    htmlUrl: n.link !== "EMPTY" ? n.link : "",
                }));

                // Sort by postedAt descending (newest first)
                items.sort((a, b) => {
                    if (!a.postedAt) return 1;
                    if (!b.postedAt) return -1;
                    return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
                });

                setAnnouncements(items);
            } catch (err: any) {
                console.error(err);
                setError(err.message || "Failed to fetch announcements");
            } finally {
                setLoading(false);
            }
        };

        loadAnnouncements();
    }, []);

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return 'Unknown date';
        return format(new Date(dateStr), 'MMM d, h:mm a');
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (isAuthenticated === false) {
        return (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-border rounded-xl p-6 text-center">
                <h3 className="text-lg font-semibold">Not Signed In</h3>
                <p className="text-muted-foreground mt-2 mb-4">
                    Please sign in to view your announcements.
                </p>
                <a href="/login" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
                    Sign In
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
                                    {a.message}
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
