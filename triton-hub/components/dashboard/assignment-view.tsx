"use client";

import { useState, useEffect } from "react";
import { Loader2, ExternalLink, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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

const TOKEN_STORAGE_KEY = 'canvas_token';
const URL_STORAGE_KEY = 'canvas_url';
const CANVAS_UCSD_URL = 'https://canvas.ucsd.edu';

export function AssignmentView() {
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [canvasUrl, setCanvasUrl] = useState<string | null>(null);
    const [assignments, setAssignments] = useState<AssignmentItem[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const storedToken = sessionStorage.getItem(TOKEN_STORAGE_KEY);
        const storedUrl = sessionStorage.getItem(URL_STORAGE_KEY);
        setAccessToken(storedToken);
        setCanvasUrl(storedUrl || CANVAS_UCSD_URL);
    }, []);

    useEffect(() => {
        if (accessToken !== null) { // Only fetch after initial load checks token
            if (accessToken) {
                fetchAssignments();
            } else {
                setLoading(false); // No token, stop loading
            }
        }
    }, [accessToken, canvasUrl]);

    const headers = () => ({
        Authorization: `Bearer ${accessToken}`,
    });

    const getApiBase = () => {
        const normalized = (canvasUrl || CANVAS_UCSD_URL).replace(/\/$/, '');
        const isUcsd = normalized === CANVAS_UCSD_URL || normalized.includes('canvas.ucsd.edu');
        // Use proxy in development for UCSD to avoid CORS
        if (isUcsd && process.env.NODE_ENV === 'development') {
            return '/canvas-api';
        }
        return normalized;
    };

    const fetchAssignments = async () => {
        if (!accessToken) return;

        setLoading(true);
        setError(null);

        try {
            const base = getApiBase();

            // 1. Fetch Courses to get IDs and Names
            const coursesRes = await fetch(`${base}/api/v1/courses?enrollment_type=student&enrollment_state=active&per_page=50`, {
                headers: headers()
            });

            if (!coursesRes.ok) throw new Error(`Canvas API error: ${coursesRes.status}`);
            const coursesJson = await coursesRes.json();

            // Filter courses similar to Home page logic (simplified for now, or copy exact logic if needed)
            // Just usage active courses for now
            const filteredCourses = coursesJson;

            // 2. Fetch Assignments
            const assignmentPromises = filteredCourses.map(async (course: any) => {
                const res = await fetch(`${base}/api/v1/courses/${course.id}/assignments?include[]=submission&per_page=50&order_by=due_at`, {
                    headers: headers()
                });
                if (!res.ok) return [];
                const assigns = await res.json();
                return assigns.map((a: any) => ({
                    id: a.id,
                    courseId: course.id,
                    courseName: course.name,
                    courseCode: course.course_code ?? '',
                    name: a.name,
                    dueAt: a.due_at,
                    pointsPossible: a.points_possible,
                    score: a.submission?.score ?? null,
                    submittedAt: a.submission?.submitted_at ?? null,
                    workflowState: a.submission?.workflow_state ?? null,
                    htmlUrl: a.html_url,
                }));
            });

            const allAssigns = (await Promise.all(assignmentPromises)).flat();

            // Sort: Upcoming (nearest due date first)
            allAssigns.sort((a, b) => {
                if (!a.dueAt) return 1;
                if (!b.dueAt) return -1;
                return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
            });

            // Filter out submitted ones? User usually wants to see what's TODO.
            // Let's filter out submitted ones for "Assignments" view usually
            const pendingAssigns = allAssigns.filter(a => !a.submittedAt && a.workflowState !== 'graded');

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
                    Connect your Canvas account on the Home page to view your assignments here.
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
                                    {a.pointsPossible ? `${a.pointsPossible} pts` : 'No points'}
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
