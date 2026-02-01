"use client";

import { useState, useEffect } from "react";
import { Loader2, ExternalLink, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchNotifications } from "@/lib/notifications";
import { supabase } from "@/lib/supabase";
import type { Notification } from "@/lib/types";

interface AssignmentItem {
    id: string;
    courseName: string;
    courseCode: string;
    name: string;
    dueAt: string | null;
    htmlUrl: string;
}

export function AssignmentView() {
    const [assignments, setAssignments] = useState<AssignmentItem[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    useEffect(() => {
        const loadAssignments = async () => {
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

                // Filter for assignments only
                const assignmentNotifs = notifications.filter(
                    (n: Notification) => n.category === "assignment"
                );

                // Transform to AssignmentItem format
                const items: AssignmentItem[] = assignmentNotifs.map((n: Notification) => {
                    // Parse event_date and event_time
                    let dueAt: string | null = null;
                    if (n.event_date && n.event_date !== "EMPTY") {
                        dueAt = n.event_date;
                        if (n.event_time && n.event_time !== "EMPTY") {
                            // Append time info for display
                            dueAt = `${n.event_date} ${n.event_time}`;
                        }
                    }

                    return {
                        id: `notif-${n.id}`,
                        courseName: n.source,
                        courseCode: n.source,
                        name: n.summary,
                        dueAt,
                        htmlUrl: n.link !== "EMPTY" ? n.link : "",
                    };
                });

                // Sort by due date (nearest first)
                items.sort((a, b) => {
                    if (!a.dueAt) return 1;
                    if (!b.dueAt) return -1;
                    return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
                });

                setAssignments(items);
            } catch (err: any) {
                console.error(err);
                setError(err.message || "Failed to fetch assignments");
            } finally {
                setLoading(false);
            }
        };

        loadAssignments();
    }, []);

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return 'No due date';
        return new Date(dateStr).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
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
                    Please sign in to view your assignments.
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
                <h2 className="text-2xl font-bold tracking-tight">Upcoming Assignments</h2>
                <span className="bg-secondary text-secondary-foreground text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    {assignments?.length || 0} Pending
                </span>
            </div>

            {assignments && assignments.length > 0 ? (
                <div className="flex flex-col gap-4">
                    {assignments.map((a) => (
                        <div key={a.id} className="group relative flex flex-col gap-2 rounded-xl border p-4 hover:bg-muted/50 transition-colors">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                        {a.courseCode}
                                    </span>
                                    <span className={cn("text-xs font-medium", !a.dueAt ? 'text-muted-foreground' : 'text-orange-600 dark:text-orange-400')}>
                                        {formatDate(a.dueAt)}
                                    </span>
                                </div>
                                <a href={a.htmlUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                                    <ExternalLink className="h-4 w-4" />
                                </a>
                            </div>

                            <div>
                                <h3 className="font-semibold leading-none tracking-tight group-hover:underline decoration-primary/50 underline-offset-4 transition-all">
                                    {a.name}
                                </h3>
                                <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">
                                    {a.courseName}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-64 border border-border rounded-xl bg-card">
                    <CalendarIcon className="h-10 w-10 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground font-medium">No upcoming assignments found!</p>
                    <p className="text-xs text-muted-foreground mt-1">You're all caught up.</p>
                </div>
            )}
        </div>
    );
}
