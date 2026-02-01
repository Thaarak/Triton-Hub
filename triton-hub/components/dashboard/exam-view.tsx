"use client";

import { useState, useEffect } from "react";
import { Loader2, FileText, ExternalLink, RefreshCw, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCanvasToken, syncCanvasData } from "@/lib/canvas";
import { format } from "date-fns";

interface ExamItem {
    id: number;
    courseId: number;
    courseName: string;
    courseCode: string;
    name: string;
    dueAt: string | null;
    pointsPossible: number | null;
    htmlUrl: string;
}

// Keywords to identify exams
const EXAM_KEYWORDS = ['exam', 'midterm', 'final', 'quiz', 'test', 'assessment'];

export function ExamView() {
    const [exams, setExams] = useState<ExamItem[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasToken, setHasToken] = useState<boolean | null>(null);

    useEffect(() => {
        fetchExams();
    }, []);

    const fetchExams = async () => {
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

            // Filter for exam-related assignments
            const examAssignments = assignments.filter((a: any) => {
                const nameLower = a.name.toLowerCase();
                return EXAM_KEYWORDS.some(keyword => nameLower.includes(keyword));
            });

            // Sort by due date (upcoming first)
            examAssignments.sort((a: any, b: any) => {
                if (!a.dueAt) return 1;
                if (!b.dueAt) return -1;
                return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
            });

            // Only show future/unsubmitted exams
            const upcomingExams = examAssignments.filter((a: any) => {
                if (a.submittedAt) return false;
                if (!a.dueAt) return true;
                return new Date(a.dueAt) > new Date(Date.now() - 24 * 60 * 60 * 1000); // Include exams from past 24 hours
            });

            setExams(upcomingExams);

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to fetch exams');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return 'No date set';
        return format(new Date(dateStr), 'EEEE, MMM d, yyyy • h:mm a');
    };

    const getExamStatus = (dueAt: string | null) => {
        if (!dueAt) return { label: 'TBD', color: 'bg-muted text-muted-foreground' };
        const now = new Date();
        const due = new Date(dueAt);
        const hoursUntilDue = (due.getTime() - now.getTime()) / (1000 * 60 * 60);
        
        if (hoursUntilDue < 0) return { label: 'Passed', color: 'bg-gray-500/10 text-gray-500' };
        if (hoursUntilDue < 24) return { label: 'Today!', color: 'bg-red-500/10 text-red-600 dark:text-red-400' };
        if (hoursUntilDue < 72) return { label: 'Soon', color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400' };
        if (hoursUntilDue < 168) return { label: 'This Week', color: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' };
        return { label: 'Upcoming', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' };
    };

    const getDaysUntil = (dueAt: string | null) => {
        if (!dueAt) return null;
        const now = new Date();
        const due = new Date(dueAt);
        const days = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (days < 0) return `${Math.abs(days)} days ago`;
        if (days === 0) return 'Today';
        if (days === 1) return 'Tomorrow';
        return `In ${days} days`;
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                <p className="text-sm text-muted-foreground">Loading exams...</p>
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
                    <h2 className="text-2xl font-bold tracking-tight">Upcoming Exams</h2>
                    <p className="text-sm text-muted-foreground mt-1">Quizzes, midterms, and finals from your courses</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="bg-secondary text-secondary-foreground text-xs font-semibold px-2.5 py-0.5 rounded-full">
                        {exams?.length || 0} Exams
                    </span>
                    <button
                        onClick={fetchExams}
                        disabled={loading}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md bg-muted hover:bg-muted/80 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                        Refresh
                    </button>
                </div>
            </div>

            {exams && exams.length > 0 ? (
                <div className="grid gap-4">
                    {exams.map((exam) => {
                        const status = getExamStatus(exam.dueAt);
                        const daysUntil = getDaysUntil(exam.dueAt);
                        return (
                            <div key={exam.id} className="group relative rounded-xl border bg-card p-5 hover:border-primary/50 transition-all">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                                {exam.courseCode}
                                            </span>
                                            <span className={cn("text-xs font-medium px-2 py-0.5 rounded", status.color)}>
                                                {status.label}
                                            </span>
                                        </div>
                                        
                                        <h3 className="text-lg font-semibold tracking-tight group-hover:text-primary transition-colors">
                                            {exam.name}
                                        </h3>
                                        
                                        <div className="flex flex-col gap-1 mt-3">
                                            <p className="text-sm text-muted-foreground">
                                                📅 {formatDate(exam.dueAt)}
                                            </p>
                                            {daysUntil && (
                                                <p className="text-sm font-medium text-foreground">
                                                    ⏰ {daysUntil}
                                                </p>
                                            )}
                                            {exam.pointsPossible && (
                                                <p className="text-sm text-muted-foreground">
                                                    📊 {exam.pointsPossible} points
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <a 
                                        href={exam.htmlUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="shrink-0 p-2 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <ExternalLink className="h-5 w-5" />
                                    </a>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-64 border border-border rounded-xl bg-card">
                    <FileText className="h-10 w-10 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground font-medium">No upcoming exams found!</p>
                    <p className="text-xs text-muted-foreground mt-1">Looking for assignments with "exam", "quiz", "midterm", "final", or "test" in the name.</p>
                </div>
            )}
        </div>
    );
}
