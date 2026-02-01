"use client";

import { cn } from "@/lib/utils";
import { User, BookOpen } from "lucide-react";

interface CourseListProps {
    classes: any[];
    onCourseClick: (courseCode: string) => void;
    className?: string;
}

export function CourseList({ classes, onCourseClick, className }: CourseListProps) {
    if (classes.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-border rounded-2xl bg-muted/30">
                <BookOpen className="h-10 w-10 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-sm font-medium">No courses found for the current term.</p>
            </div>
        );
    }

    return (
        <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4", className)}>
            {classes.map((cls) => (
                <div
                    key={cls.id}
                    onClick={() => onCourseClick(cls.courseCode)}
                    className="group relative overflow-hidden p-5 rounded-2xl border border-border bg-card hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-pointer active:scale-[0.98]"
                >
                    {/* Decorative background element */}
                    <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary/5 blur-2xl group-hover:bg-primary/10 transition-colors" />

                    <div className="relative space-y-3">
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <span className="inline-flex items-center rounded-md bg-orange-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                                    {cls.courseCode}
                                </span>
                                <h4 className="font-bold text-lg text-foreground leading-tight group-hover:text-orange-600 transition-colors">
                                    {cls.name}
                                </h4>
                            </div>

                            {/* Grade Display */}
                            {(cls.currentGrade || cls.currentScore != null) && (
                                <div className="text-right">
                                    <div className="text-2xl font-black text-orange-600 dark:text-orange-400 leading-none">
                                        {cls.currentGrade ?? '—'}
                                    </div>
                                    {cls.currentScore != null && (
                                        <div className="text-[10px] font-bold text-muted-foreground mt-1">
                                            {cls.currentScore.toFixed(1)}%
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-4 pt-1">
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <User className="h-4 w-4" />
                                <span className="font-medium">{cls.professor ?? 'Staff'}</span>
                            </div>
                            <div className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-[10px] font-bold">
                                {cls.term}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
