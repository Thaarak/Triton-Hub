"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CalendarDays, GraduationCap, Inbox, LayoutList, Library } from "lucide-react";
import { CourseList } from "@/components/dashboard/course-list";
import { UpdateCard } from "@/components/dashboard/update-card";
import { cn } from "@/lib/utils";
import type { Update } from "@/lib/types";

const courses = [
  { id: 1, courseCode: "DSC 80", name: "Data Science in Practice", professor: "Prof. Park", term: "Spring quarter", currentGrade: "A−", currentScore: 92.4 },
  { id: 2, courseCode: "CSE 101", name: "Design and Analysis of Algorithms", professor: "Prof. Rao", term: "Spring quarter", currentGrade: "B+", currentScore: 89.1 },
  { id: 3, courseCode: "COGS 108", name: "Data Science in Practice Lab", professor: "Prof. Brooks", term: "Spring quarter", currentGrade: "A", currentScore: 96.2 },
];

const sampleUpdates: Update[] = [
  { id: "project", category: "assignment", source: "canvas", title: "Project 3 · Build a prediction pipeline", course: courses[0].name, snippet: "Submit your notebook and a short write-up explaining how you checked for data leakage.", timestamp: new Date("2026-04-16T23:00:00Z"), dueDate: new Date("2026-04-17T06:59:00Z"), priority: "urgent", subCategory: "Project", unread: false, url: "" },
  { id: "hours", category: "announcement", source: "email", title: "Extra office hours before the midterm", course: courses[1].name, snippet: "We’re adding a review session on Thursday. Bring a recurrence or proof you’d like to work through with the teaching team.", timestamp: new Date("2026-04-15T17:00:00Z"), unread: false, url: "" },
  { id: "rubric", category: "announcement", source: "canvas", title: "Final project rubric is available", course: courses[2].name, snippet: "Review the rubric before your group meeting. The data description and evaluation sections are new this quarter.", timestamp: new Date("2026-04-14T21:00:00Z"), unread: false, url: "" },
  { id: "algorithms", category: "assignment", source: "canvas", title: "Problem set 4 · Dynamic programming", course: courses[1].name, snippet: "Work through the three practice problems and explain the runtime of each solution.", timestamp: new Date("2026-04-19T23:00:00Z"), dueDate: new Date("2026-04-20T06:59:00Z"), subCategory: "Homework", unread: false, url: "" },
];

const tabs = [
  { label: "Overview", icon: LayoutList },
  { label: "Courses", icon: Library },
  { label: "Assignments", icon: CalendarDays },
  { label: "Email", icon: Inbox },
] as const;
type Tab = (typeof tabs)[number]["label"];

export function DemoDashboard() {
  const [tab, setTab] = useState<Tab>("Overview");
  const [course, setCourse] = useState<string>();
  const displayed = sampleUpdates.filter((item) => {
    if (course && item.course !== course) return false;
    if (tab === "Assignments") return item.category === "assignment";
    if (tab === "Email") return item.source === "email";
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold">
            <GraduationCap className="size-5 text-primary" /> Triton Hub
          </Link>
          <Link href="/login" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            Student sign-in <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 pb-12 pt-8 sm:px-8 sm:pt-11">
        <div className="mb-7 border-l-2 border-primary pl-3 text-sm text-muted-foreground">
          <strong className="font-semibold text-foreground">Sample dashboard.</strong> All courses, assignments, grades, and emails are fictional.
        </div>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Your student workspace</h1>
        <p className="mt-3 text-muted-foreground">See what’s due, what changed, and which messages need your attention.</p>
        <nav aria-label="Sample dashboard views" className="mb-7 mt-8 flex flex-wrap gap-2 border-b border-border pb-4">
          {tabs.map(({ label, icon: Icon }) => (
            <button key={label} type="button" aria-pressed={tab === label}
              onClick={() => { setTab(label); setCourse(undefined); }}
              className={cn("inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
                tab === label ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
              <Icon className="size-4" /> {label}
            </button>
          ))}
        </nav>
        {tab === "Courses" ? (
          <section aria-labelledby="courses-title">
            <h2 id="courses-title" className="mb-4 text-xl font-semibold">Sample courses</h2>
            <CourseList classes={courses} onCourseClick={(name) => {
              setCourse(courses.find((entry) => entry.courseCode === name)?.name);
              setTab("Overview");
            }} />
          </section>
        ) : (
          <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_16rem]">
            <section aria-labelledby="feed-title" className="min-w-0">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 id="feed-title" className="text-xl font-semibold">{course || (tab === "Overview" ? "Recent updates" : tab)}</h2>
                {course && <button type="button" className="text-sm underline" onClick={() => setCourse(undefined)}>Show all courses</button>}
              </div>
              <div className="space-y-3">
                {displayed.map((update) => <UpdateCard key={update.id} update={update} showRelativeTime={false} />)}
              </div>
            </section>
            <aside className="self-start rounded-xl border border-border bg-card p-5">
              <h2 className="text-base font-semibold">Sample deadlines</h2>
              <ul className="mt-4 space-y-4 text-sm">
                <li><p className="font-medium">Prediction pipeline</p><p className="text-muted-foreground">Apr 16 · DSC 80</p></li>
                <li><p className="font-medium">Dynamic programming</p><p className="text-muted-foreground">Apr 19 · CSE 101</p></li>
              </ul>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
