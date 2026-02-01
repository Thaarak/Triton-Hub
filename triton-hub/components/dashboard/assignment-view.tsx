"use client";

import { useState, useEffect } from "react";
import { Loader2, ExternalLink, Calendar as CalendarIcon, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCanvasToken, syncCanvasData } from "@/lib/canvas";

interface AssignmentItem {
    id: number;
    courseId: number;
    courseName: string;
    courseCode: string;
    name: string;
    dueAt: string | null;
    pointsPossible: number | null;
    score: number | null;
    submittedAt: string | null;
    workflowState: string | null;
    htmlUrl: string;
}

export function AssignmentView() {
    const [assignments, setAssignments] = useState<AssignmentItem[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasToken, setHasToken] = useState<boolean | null>(null);

    useEffect(() => {
        fetchAssignments();
    }, []);

    const fetchAssignments = async () => {
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

            const { assignments } = await syncCanvasData(token);

            // Sort: Upcoming (nearest due date first)
            assignments.sort((a: any, b: any) => {
                if (!a.dueAt) return 1;
                if (!b.dueAt) return -1;
                return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
            });

            // Filter out submitted ones - show only pending
            const pendingAssigns = assignments.filter((a: any) => !a.submittedAt && a.workflowState !== 'graded');

            setAssignments(pendingAssigns);

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to fetch assignments');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return 'No due date';
        return new Date(dateStr).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getDueStatus = (dueAt: string | null) => {
        if (!dueAt) return { text: 'No due date', color: 'text-muted-foreground' };
        const now = new Date();
        const due = new Date(dueAt);
        const hoursUntilDue = (due.getTime() - now.getTime()) / (1000 * 60 * 60);
        
        if (hoursUntilDue < 0) return { text: 'Overdue', color: 'text-red-600 dark:text-red-400' };
        if (hoursUntilDue < 24) return { text: 'Due soon', color: 'text-orange-600 dark:text-orange-400' };
        if (hoursUntilDue < 72) return { text: 'Upcoming', color: 'text-yellow-600 dark:text-yellow-400' };
        return { text: formatDate(dueAt), color: 'text-muted-foreground' };
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                <p className="text-sm text-muted-foreground">Loading assignments...</p>
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
                    <h2 className="text-2xl font-bold tracking-tight">Upcoming Assignments</h2>
                    <p className="text-sm text-muted-foreground mt-1">Assignments that need your attention</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="bg-secondary text-secondary-foreground text-xs font-semibold px-2.5 py-0.5 rounded-full">
                        {assignments?.length || 0} Pending
                    </span>
                    <button
                        onClick={fetchAssignments}
                        disabled={loading}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md bg-muted hover:bg-muted/80 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                        Refresh
                    </button>
                </div>
            </div>

            {assignments && assignments.length > 0 ? (
                <div className="flex flex-col gap-4">
                    {assignments.map((a) => {
                        const status = getDueStatus(a.dueAt);
                        return (
                            <div key={a.id} className="group relative flex flex-col gap-2 rounded-xl border p-4 hover:bg-muted/50 transition-colors">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                            {a.courseCode}
                                        </span>
                                        <span className={cn("text-xs font-medium", status.color)}>
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
                                        {a.pointsPossible ? `${a.pointsPossible} pts` : 'No points'} • {a.courseName}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
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
