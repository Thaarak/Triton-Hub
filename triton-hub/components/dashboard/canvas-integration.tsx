"use client";

import { useState, useEffect } from "react";
import { Loader2, ExternalLink, GraduationCap, BookOpen, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClassItem {
    id: number;
    name: string;
    courseCode: string;
    professor: string | null;
    term: string | null;
}

interface CourseGrade {
    id: number;
    name: string;
    courseCode: string;
    currentScore: number | null;
    finalScore: number | null;
    currentGrade: string | null;
    finalGrade: string | null;
    gradesUrl: string | null;
}

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

export function CanvasIntegration() {
    const [classes, setClasses] = useState<ClassItem[] | null>(null);
    const [grades, setGrades] = useState<CourseGrade[] | null>(null);
    const [assignments, setAssignments] = useState<AssignmentItem[] | null>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeSubTab, setActiveSubTab] = useState<'classes' | 'grades'>('classes');

    // Auto-fetch on mount using token from backend session
    useEffect(() => {
        fetchCanvasData();
    }, []);

    const fetchCanvasData = async () => {
        setLoading(true);
        setError(null);

        try {
            // First get the canvas token from backend session
            const tokenResponse = await fetch('/api/flask/canvas/get-token', {
                credentials: 'include'
            });

            if (!tokenResponse.ok) {
                throw new Error('Canvas not configured. Please log in again.');
            }

            const tokenData = await tokenResponse.json();
            const accessToken = tokenData.canvas_token;

            if (!accessToken) {
                throw new Error('No Canvas token found. Please set up Canvas from login.');
            }

            const headers = {
                Authorization: `Bearer ${accessToken}`,
            };

            const base = '/canvas-api';

            // 1. Fetch Classes (and determine common term)
            const coursesRes = await fetch(`${base}/api/v1/courses?enrollment_type=student&enrollment_state=active&include[]=teachers&include[]=term&include[]=total_scores&per_page=50`, {
                headers
            });
            if (!coursesRes.ok) throw new Error(`Canvas API error: ${coursesRes.status}`);
            const coursesJson = await coursesRes.json();

            // Find common term
            const termCounts = new Map<string, number>();
            coursesJson.forEach((c: any) => {
                if (c.term?.name) termCounts.set(c.term.name, (termCounts.get(c.term.name) || 0) + 1);
            });
            let commonTerm: string | null = null;
            let maxCount = 0;
            termCounts.forEach((count, name) => {
                if (count > maxCount) {
                    maxCount = count;
                    commonTerm = name;
                }
            });

            const filteredCourses = commonTerm
                ? coursesJson.filter((c: any) => c.term?.name === commonTerm)
                : coursesJson;

            // Map Classes
            setClasses(filteredCourses.map((c: any) => ({
                id: c.id,
                name: c.name,
                courseCode: c.course_code ?? '',
                professor: c.teachers?.[0]?.display_name ?? null,
                term: c.term?.name ?? null
            })));

            // Map Grades
            setGrades(filteredCourses.map((course: any) => {
                const enrollment = course.enrollments?.[0];
                const g = enrollment?.grades;
                return {
                    id: course.id,
                    name: course.name,
                    courseCode: course.course_code ?? '',
                    currentScore: enrollment?.computed_current_score ?? g?.current_score ?? null,
                    finalScore: enrollment?.computed_final_score ?? g?.final_score ?? null,
                    currentGrade: enrollment?.computed_current_grade ?? g?.current_grade ?? null,
                    finalGrade: enrollment?.computed_final_grade ?? g?.final_grade ?? null,
                    gradesUrl: g?.html_url ?? null,
                };
            }));

            // 2. Fetch Assignments for these courses
            const assignmentPromises = filteredCourses.map(async (course: any) => {
                const res = await fetch(`${base}/api/v1/courses/${course.id}/assignments?include[]=submission&per_page=50&order_by=due_at`, {
                    headers
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
            // Sort upcoming (due in future or null due date at end)
            allAssigns.sort((a, b) => {
                if (!a.dueAt) return 1;
                if (!b.dueAt) return -1;
                return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
            });
            setAssignments(allAssigns.filter(a => !a.submittedAt)); // Show only upcoming/unsubmitted

        } catch (err: any) {
            setError(err.message || 'Failed to sync with Canvas');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header with refresh button */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 bg-muted p-1 rounded-lg w-fit">
                    <button
                        onClick={() => setActiveSubTab('classes')}
                        className={cn(
                            "flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                            activeSubTab === 'classes' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <BookOpen className="h-4 w-4" /> Classes
                    </button>
                    <button
                        onClick={() => setActiveSubTab('grades')}
                        className={cn(
                            "flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                            activeSubTab === 'grades' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <GraduationCap className="h-4 w-4" /> Grades
                    </button>
                </div>
                <button
                    onClick={fetchCanvasData}
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md bg-muted hover:bg-muted/80 transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                    {loading ? "Syncing..." : "Refresh"}
                </button>
            </div>

            {error && (
                <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive font-medium">
                    {error}
                </div>
            )}

            {/* Content Area */}
            <div className="min-h-[300px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-border rounded-xl">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
                        <p className="text-muted-foreground text-sm">Loading Canvas data...</p>
                    </div>
                ) : (
                    <>
                        {activeSubTab === 'classes' && (
                            <div className="space-y-4">
                                {classes && classes.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-4">
                                        {classes.map((cls) => (
                                            <div key={cls.id} className="p-4 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors flex items-center justify-between group">
                                                <div>
                                                    <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">{cls.name}</h4>
                                                    <p className="text-sm text-muted-foreground">{cls.courseCode} • {cls.professor ?? 'Unknown Professor'}</p>
                                                </div>
                                                <div className="text-xs font-medium px-2 py-1 rounded bg-secondary text-secondary-foreground">
                                                    {cls.term}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <EmptyState message="No classes found." />
                                )}
                            </div>
                        )}

                        {activeSubTab === 'grades' && (
                            <div className="space-y-4">
                                {grades && grades.length > 0 ? (
                                    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-muted text-muted-foreground font-medium">
                                                <tr>
                                                    <th className="px-6 py-3">Course</th>
                                                    <th className="px-6 py-3">Current Score</th>
                                                    <th className="px-6 py-3">Current Grade</th>
                                                    <th className="px-6 py-3 text-right">Link</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                {grades.map((g) => (
                                                    <tr key={g.id} className="hover:bg-muted/50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="font-medium text-foreground">{g.name}</div>
                                                            <div className="text-xs text-muted-foreground">{g.courseCode}</div>
                                                        </td>
                                                        <td className="px-6 py-4 font-mono font-medium">
                                                            {g.currentScore != null ? `${g.currentScore}%` : '—'}
                                                        </td>
                                                        <td className="px-6 py-4 font-medium">
                                                            <span className={cn(
                                                                "px-2 py-1 rounded text-xs",
                                                                g.currentGrade ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                                                            )}>
                                                                {g.currentGrade ?? 'N/A'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            {g.gradesUrl && (
                                                                <a href={g.gradesUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary inline-flex items-center gap-1">
                                                                    Canvas <ExternalLink className="h-3 w-3" />
                                                                </a>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <EmptyState message="No grades found." />
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-border rounded-xl">
            <p className="text-muted-foreground text-sm">{message}</p>
        </div>
    );
}
