"use client";

import { useState, useEffect } from "react";
import { Loader2, ExternalLink, RefreshCw, BookOpen, Megaphone, FileText, ClipboardList, GraduationCap, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCanvasToken, syncCanvasData } from "@/lib/canvas";
import { getFlaskEmails } from "@/lib/flask";
import { format } from "date-fns";

type UpdateType = 'announcement' | 'exam' | 'assignment' | 'class' | 'grade' | 'email';

interface UpdateItem {
    id: string;
    type: UpdateType;
    title: string;
    subtitle: string;
    date: Date | null;
    courseCode: string;
    htmlUrl?: string;
    urgency?: 'urgent' | 'medium' | 'low';
    // For classes with grades
    letterGrade?: string | null;
    percentage?: number | null;
}

// Keywords to identify exams
const EXAM_KEYWORDS = ['exam', 'midterm', 'final', 'quiz', 'test', 'assessment'];

const typeConfig: Record<UpdateType, { icon: typeof Megaphone; label: string; color: string; bg: string }> = {
    announcement: { icon: Megaphone, label: 'Announcement', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' },
    exam: { icon: FileText, label: 'Exam', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10' },
    assignment: { icon: ClipboardList, label: 'Assignment', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10' },
    class: { icon: BookOpen, label: 'Class', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10' },
    grade: { icon: GraduationCap, label: 'Grade', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-500/10' },
    email: { icon: Mail, label: 'Email', color: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-500/10' },
};

type FilterType = 'all' | UpdateType;

export function UpdatesFeed() {
    const [updates, setUpdates] = useState<UpdateItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasToken, setHasToken] = useState<boolean | null>(null);
    const [filter, setFilter] = useState<FilterType>('all');

    useEffect(() => {
        fetchAllUpdates();
    }, []);

    const fetchAllUpdates = async () => {
        setLoading(true);
        setError(null);

        try {
            const token = await getCanvasToken();
            
            if (!token) {
                setHasToken(false);
                setLoading(false);
                return;
            }
            
            setHasToken(true);

            const { assignments, announcements, classes, grades } = await syncCanvasData(token);

            const allUpdates: UpdateItem[] = [];

            // Create a map of grades by course ID for easy lookup
            const gradeMap = new Map<string, { letterGrade: string | null; percentage: number | null; gradesUrl?: string }>();
            grades.forEach((g: any) => {
                gradeMap.set(String(g.id), {
                    letterGrade: g.currentGrade || null,
                    percentage: g.currentScore !== null ? g.currentScore : null,
                    gradesUrl: g.gradesUrl
                });
            });

            // Add announcements
            announcements.forEach((a: any) => {
                allUpdates.push({
                    id: `ann-${a.id}`,
                    type: 'announcement',
                    title: a.title,
                    subtitle: a.message?.replace(/<[^>]*>/g, '').substring(0, 100) || '',
                    date: a.postedAt ? new Date(a.postedAt) : null,
                    courseCode: a.courseCode || a.courseName || '',
                    htmlUrl: a.htmlUrl,
                    urgency: 'low'
                });
            });

            // Add assignments and exams
            assignments.forEach((a: any) => {
                const nameLower = a.name.toLowerCase();
                const isExam = EXAM_KEYWORDS.some(keyword => nameLower.includes(keyword));
                const dueDate = a.dueAt ? new Date(a.dueAt) : null;
                
                // Calculate urgency based on due date
                let urgency: 'urgent' | 'medium' | 'low' = 'low';
                if (dueDate) {
                    const hoursUntilDue = (dueDate.getTime() - Date.now()) / (1000 * 60 * 60);
                    if (hoursUntilDue < 0) urgency = 'urgent';
                    else if (hoursUntilDue < 48) urgency = 'urgent';
                    else if (hoursUntilDue < 168) urgency = 'medium';
                }

                // Skip if already submitted
                if (a.submittedAt || a.workflowState === 'graded') return;

                allUpdates.push({
                    id: `${isExam ? 'exam' : 'assign'}-${a.id}`,
                    type: isExam ? 'exam' : 'assignment',
                    title: a.name,
                    subtitle: `${a.pointsPossible ? `${a.pointsPossible} pts` : 'No points'} • ${a.courseName}`,
                    date: dueDate,
                    courseCode: a.courseCode || '',
                    htmlUrl: a.htmlUrl,
                    urgency
                });
            });

            // Add classes with grades
            classes.forEach((c: any) => {
                const gradeInfo = gradeMap.get(String(c.id));
                allUpdates.push({
                    id: `class-${c.id}`,
                    type: 'class',
                    title: c.name,
                    subtitle: c.professor ? `Professor: ${c.professor}` : c.courseCode,
                    date: null,
                    courseCode: c.courseCode || '',
                    htmlUrl: gradeInfo?.gradesUrl || `https://canvas.ucsd.edu/courses/${c.id}`,
                    urgency: 'low',
                    letterGrade: gradeInfo?.letterGrade || null,
                    percentage: gradeInfo?.percentage || null
                });
            });

            // Fetch emails from Flask backend (last 50)
            try {
                const emailResponse = await getFlaskEmails();
                console.log('Email response:', emailResponse);
                if (emailResponse && emailResponse.emails && Array.isArray(emailResponse.emails)) {
                    // Take last 50 emails
                    const emails = emailResponse.emails.slice(0, 50);
                    console.log('Processing', emails.length, 'emails');
                    emails.forEach((e: any) => {
                        // Parse the date - Gmail returns dates in RFC 2822 format
                        let emailDate: Date | null = null;
                        if (e.date) {
                            try {
                                emailDate = new Date(e.date);
                                if (isNaN(emailDate.getTime())) emailDate = null;
                            } catch {
                                emailDate = null;
                            }
                        }
                        
                        // Extract sender name from "Name <email>" format
                        let fromDisplay = e.from || 'Unknown';
                        const fromMatch = fromDisplay.match(/^([^<]+)/);
                        if (fromMatch) {
                            fromDisplay = fromMatch[1].trim().replace(/"/g, '');
                        }
                        
                        allUpdates.push({
                            id: `email-${e.id}`,
                            type: 'email',
                            title: e.subject || '(No Subject)',
                            subtitle: `From: ${fromDisplay}${e.snippet ? ' - ' + e.snippet.substring(0, 80) : ''}`,
                            date: emailDate,
                            courseCode: '',
                            htmlUrl: `https://mail.google.com/mail/u/0/#inbox/${e.id}`,
                            urgency: 'low'
                        });
                    });
                }
            } catch (emailErr) {
                console.error('Failed to fetch emails:', emailErr);
            }

            // Sort by urgency first, then by date
            allUpdates.sort((a, b) => {
                const urgencyOrder = { urgent: 0, medium: 1, low: 2 };
                const aUrgency = urgencyOrder[a.urgency || 'low'];
                const bUrgency = urgencyOrder[b.urgency || 'low'];
                if (aUrgency !== bUrgency) return aUrgency - bUrgency;
                
                // Then by date (most recent first)
                if (!a.date) return 1;
                if (!b.date) return -1;
                return b.date.getTime() - a.date.getTime();
            });

            setUpdates(allUpdates);

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to fetch updates');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date: Date | null, type: UpdateType) => {
        if (!date) return null;
        if (type === 'announcement' || type === 'email') {
            return format(date, 'MMM d, h:mm a');
        }
        // For assignments/exams, show relative time
        const now = new Date();
        const hoursUntil = (date.getTime() - now.getTime()) / (1000 * 60 * 60);
        if (hoursUntil < 0) return 'Overdue';
        if (hoursUntil < 24) return 'Due today';
        if (hoursUntil < 48) return 'Due tomorrow';
        return format(date, 'MMM d, h:mm a');
    };

    // Helper to get grade color based on letter grade
    const getGradeColor = (grade: string | null) => {
        if (!grade) return 'text-muted-foreground';
        const letter = grade.charAt(0).toUpperCase();
        if (letter === 'A') return 'text-green-600 dark:text-green-400';
        if (letter === 'B') return 'text-blue-600 dark:text-blue-400';
        if (letter === 'C') return 'text-yellow-600 dark:text-yellow-400';
        if (letter === 'D') return 'text-orange-600 dark:text-orange-400';
        return 'text-red-600 dark:text-red-400';
    };

    const getGradeBg = (grade: string | null) => {
        if (!grade) return 'bg-muted';
        const letter = grade.charAt(0).toUpperCase();
        if (letter === 'A') return 'bg-green-500/10';
        if (letter === 'B') return 'bg-blue-500/10';
        if (letter === 'C') return 'bg-yellow-500/10';
        if (letter === 'D') return 'bg-orange-500/10';
        return 'bg-red-500/10';
    };

    const filteredUpdates = filter === 'all' 
        ? updates 
        : updates.filter(u => u.type === filter);

    const filterButtons: { key: FilterType; label: string }[] = [
        { key: 'all', label: 'All' },
        { key: 'class', label: 'Classes' },
        { key: 'announcement', label: 'Announcements' },
        { key: 'assignment', label: 'Assignments' },
        { key: 'exam', label: 'Exams' },
        { key: 'email', label: 'Emails' },
    ];

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                <p className="text-sm text-muted-foreground">Loading your updates...</p>
            </div>
        );
    }

    if (hasToken === false) {
        return (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-border rounded-xl p-6 text-center">
                <h3 className="text-lg font-semibold">Canvas Not Connected</h3>
                <p className="text-muted-foreground mt-2 mb-4">
                    Please log in with Google to connect your Canvas account.
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
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Your Updates</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        All notifications across Canvas and Email
                    </p>
                </div>
                <button
                    onClick={fetchAllUpdates}
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md bg-muted hover:bg-muted/80 transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                    Refresh
                </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 flex-wrap">
                {filterButtons.map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => setFilter(key)}
                        className={cn(
                            "px-3 py-1.5 text-sm font-medium rounded-full transition-colors",
                            filter === key
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                        )}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Updates List */}
            {filteredUpdates.length > 0 ? (
                <div className="space-y-3">
                    {filteredUpdates.map((update) => {
                        const config = typeConfig[update.type];
                        const Icon = config.icon;
                        const dateStr = formatDate(update.date, update.type);

                        return (
                            <div
                                key={update.id}
                                className={cn(
                                    "group flex items-center gap-4 p-4 rounded-xl border transition-all hover:border-primary/50",
                                    update.urgency === 'urgent' && "border-red-500/50 bg-red-500/5"
                                )}
                            >
                                <div className={cn("p-2 rounded-lg shrink-0", config.bg)}>
                                    <Icon className={cn("h-5 w-5", config.color)} />
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={cn("text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded", config.bg, config.color)}>
                                            {update.courseCode || config.label}
                                        </span>
                                        {dateStr && (
                                            <span className={cn(
                                                "text-xs",
                                                update.urgency === 'urgent' ? "text-red-600 dark:text-red-400 font-medium" : "text-muted-foreground"
                                            )}>
                                                {dateStr}
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                                        {update.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                                        {update.subtitle}
                                    </p>
                                </div>

                                {/* Grade Display for Classes */}
                                {update.type === 'class' && (
                                    <div className="flex items-center gap-3 shrink-0">
                                        {update.letterGrade || update.percentage !== null ? (
                                            <div className={cn(
                                                "flex items-center gap-2 px-3 py-2 rounded-lg",
                                                getGradeBg(update.letterGrade || null)
                                            )}>
                                                {update.letterGrade && (
                                                    <span className={cn(
                                                        "text-xl font-bold",
                                                        getGradeColor(update.letterGrade)
                                                    )}>
                                                        {update.letterGrade}
                                                    </span>
                                                )}
                                                {update.percentage !== null && update.percentage !== undefined && (
                                                    <span className="text-sm text-muted-foreground">
                                                        {update.percentage.toFixed(1)}%
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="px-3 py-2 rounded-lg bg-muted">
                                                <span className="text-sm text-muted-foreground">No grade</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {update.htmlUrl && (
                                    <a
                                        href={update.htmlUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 text-muted-foreground hover:text-foreground transition-colors shrink-0"
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                    </a>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-64 border border-border rounded-xl bg-card">
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                        <ClipboardList className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-lg font-semibold text-foreground">No Updates Found</p>
                    <p className="text-sm text-muted-foreground mt-1">You're all caught up! Check back later for new updates.</p>
                </div>
            )}
        </div>
    );
}
