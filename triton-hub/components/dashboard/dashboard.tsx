"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import type { Update, FilterType } from "@/lib/types";
import { Navbar } from "./navbar";
import { Sidebar } from "./sidebar";
import { StatsSidebar } from "./stats-sidebar";
import { FilterBar } from "./filter-bar";
import { UpdateFeed } from "./update-feed";
import { CourseList } from "./course-list";
import { format } from "date-fns";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { syncCanvasData } from "@/lib/canvas";
import { toast } from "sonner";

import { getFlaskEmails, getFlaskAuthStatus } from "@/lib/flask";
import { Mail } from "lucide-react";

export function Dashboard() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCourseCode, setSelectedCourseCode] = useState<string | null>(null);

  // Local state for user actions
  const [readUpdates, setReadUpdates] = useState<Set<string>>(new Set());
  const [completedUpdates, setCompletedUpdates] = useState<Set<string>>(new Set());

  // Canvas State 
  const [canvasData, setCanvasData] = useState<{
    classes: any[];
    assignments: any[];
    grades: any[];
    announcements: any[];
  } | null>(null);

  // Flask/Email State
  const [emailData, setEmailData] = useState<any[]>([]);
  const [isFlaskAuthenticated, setIsFlaskAuthenticated] = useState(false);

  useEffect(() => {
    const initSync = async () => {
      setIsLoading(true);
      try {
        // 1. Supabase/Canvas Sync
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('canvas_token')
            .eq('id', session.user.id)
            .single();

          if (profile?.canvas_token) {
            try {
              const data = await syncCanvasData(profile.canvas_token);
              setCanvasData(data);
            } catch (syncError) {
              console.error("Sync failed:", syncError);
              toast.error("Failed to sync with Canvas");
            }
          }
        }

        // 2. Flask/Gmail Sync
        const authStatus = await getFlaskAuthStatus();
        setIsFlaskAuthenticated(authStatus.authenticated);

        if (authStatus.authenticated) {
          const emails = await getFlaskEmails();
          if (emails && emails.emails) {
            setEmailData(emails.emails);
          }
        }
      } catch (error) {
        console.error("Initial sync error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initSync();
  }, []);

  const handleCourseClick = useCallback((courseCode: string) => {
    setSelectedCourseCode(courseCode);
    setActiveFilter("all");
  }, []);

  const handleBackToClasses = useCallback(() => {
    setSelectedCourseCode(null);
    setActiveFilter("classes");
  }, []);

  // Transform Canvas data into the unified Update format
  const combinedUpdates = useMemo(() => {
    if (!canvasData) return [];

    const updates: Update[] = [];

    // 1. Assignments -> Updates
    const now = new Date();
    canvasData.assignments.forEach(a => {
      // Don't show assignments if they are already graded and the due date has passed
      const isPastValue = a.dueAt && new Date(a.dueAt).getTime() < now.getTime();
      if (a.score !== null && isPastValue) return;

      // Filter by selected course if applicable
      if (selectedCourseCode && a.courseCode !== selectedCourseCode) return;

      const id = `canvas-assign-${a.id}`;
      const isLocallyCompleted = completedUpdates.has(id);
      // If it has a score, we consider it completed
      const isCompleted = !!a.submittedAt || isLocallyCompleted || a.score !== null;

      // Determine subCategory based on title
      const title = a.name.toLowerCase();
      let subCategory = "Assignment";
      if (title.includes("quiz") || title.includes("test")) subCategory = "Quiz";
      else if (title.includes("midterm") || title.includes("final") || title.includes("exam")) subCategory = "Exam";
      else if (title.includes("project")) subCategory = "Project";
      else if (title.includes("lab")) subCategory = "Lab";
      else if (title.includes("homework")) subCategory = "Homework";

      const dueDate = a.dueAt ? new Date(a.dueAt) : undefined;
      const isUrgent = dueDate && !isCompleted && (dueDate.getTime() - now.getTime() < 86400000 * 2);

      updates.push({
        id,
        source: "canvas",
        category: "assignment",
        subCategory,
        title: a.name,
        snippet: `Assignment for ${a.courseName}. Points possible: ${a.pointsPossible || 'N/A'}`,
        timestamp: dueDate || now,
        url: a.htmlUrl,
        unread: !isCompleted && !readUpdates.has(id),
        course: a.courseCode,
        dueDate: dueDate,
        isCompleted: isCompleted,
        priority: isUrgent ? "urgent" : "normal"
      });
    });

    // 2. Announcements -> Updates
    canvasData.announcements.forEach(a => {
      // Filter by selected course if applicable
      if (selectedCourseCode && a.courseCode !== selectedCourseCode) return;

      const id = `canvas-ann-${a.id}`;
      const title = a.title || "";
      const isImportant = /urgent|important|due|action required|reminder/i.test(title);
      const isUnread = !readUpdates.has(id);

      updates.push({
        id,
        source: "canvas",
        category: "announcement",
        title: a.title,
        snippet: a.message?.replace(/<[^>]*>?/gm, '').substring(0, 150) + '...',
        timestamp: new Date(a.postedAt),
        url: a.htmlUrl,
        unread: isUnread,
        course: a.courseCode,
        priority: (isImportant && isUnread) ? "urgent" : "normal"
      });
    });

    // 3. Grades -> Updates
    canvasData.grades.forEach(g => {
      if (g.currentGrade || g.currentScore) {
        // Filter by selected course if applicable
        if (selectedCourseCode && g.courseCode !== selectedCourseCode) return;

        const id = `canvas-grade-${g.id}`;
        const isUnread = !readUpdates.has(id);
        updates.push({
          id,
          source: "canvas",
          category: "grade",
          title: `Grade Update: ${g.name}`,
          snippet: g.currentGrade && g.currentGrade !== 'N/A'
            ? `Current Grade: ${g.currentGrade} (${g.currentScore != null ? g.currentScore + '%' : '—'})`
            : `Current Score: ${g.currentScore != null ? g.currentScore + '%' : '—'} (Grade: —)`,
          timestamp: now,
          url: g.gradesUrl,
          unread: isUnread,
          course: g.courseCode,
          priority: isUnread ? "urgent" : "normal" // New grades are high priority
        });
      }
    });

    // 4. Gmail Emails -> Updates
    emailData.forEach(e => {
      const id = `gmail-${e.id}`;
      const isUnread = !readUpdates.has(id);

      updates.push({
        id,
        source: "email",
        category: "announcement", // Mapping to announcement for now or create new category
        title: e.subject || "(No Subject)",
        snippet: `From: ${e.from}\n\n${e.snippet}`,
        timestamp: new Date(e.date),
        url: "#", // Gmail web URL is complex, can leave as # for now
        unread: isUnread,
        priority: isUnread ? "normal" : "normal"
      });
    });

    // Filter out completed assignments in the "All" tab
    let filteredUpdates = updates;
    if (activeFilter === "all" || activeFilter === "urgent") {
      filteredUpdates = updates.filter(u => !u.isCompleted);
    }

    // Filter by category if needed (Gmail currently mapped to 'announcement')
    if (activeFilter === "email") {
      filteredUpdates = updates.filter(u => u.source === "email");
    }

    // Unified Smart Sorting: Urgency + Proximity (Lowest in About)
    return filteredUpdates.sort((a, b) => {
      const nowTime = now.getTime();

      // Helper to check if item is effectively "Pending" (Unread or Uncompleted)
      const isPending = (u: Update) => {
        if (u.category === 'assignment') return !u.isCompleted;
        return u.unread;
      };

      const aPending = isPending(a);
      const bPending = isPending(b);

      // 1. Prioritize Urgent Pending Items
      const aUrgent = aPending && a.priority === "urgent";
      const bUrgent = bPending && b.priority === "urgent";
      if (aUrgent && !bUrgent) return -1;
      if (!aUrgent && bUrgent) return 1;

      // 2. Prioritize Normal Pending Items
      if (aPending && !bPending) return -1;
      if (!aPending && bPending) return 1;

      // 3. Within the same pending status, sort by proximity "Lowest in About"
      // Helper: assignments with NO due date should be pushed to the bottom of the pending list
      const aNoDueDate = a.category === 'assignment' && !a.dueDate;
      const bNoDueDate = b.category === 'assignment' && !b.dueDate;

      if (aPending && bPending) {
        if (aNoDueDate && !bNoDueDate) return 1;
        if (!aNoDueDate && bNoDueDate) return -1;

        const aDist = Math.abs(a.timestamp.getTime() - nowTime);
        const bDist = Math.abs(b.timestamp.getTime() - nowTime);
        return aDist - bDist;
      }

      // 4. For everything else (Read/Finished), sort by newest first
      return b.timestamp.getTime() - a.timestamp.getTime();
    });
  }, [canvasData, emailData, readUpdates, completedUpdates, selectedCourseCode, activeFilter]);

  const handleMarkRead = useCallback((id: string) => {
    // If it's an assignment, we mark it as completed
    if (id.startsWith('canvas-assign-')) {
      setCompletedUpdates(prev => new Set(prev).add(id));
    }
    setReadUpdates(prev => new Set(prev).add(id));
  }, []);

  const handleRefresh = useCallback(() => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1500);
  }, []);

  const unreadCount = combinedUpdates.filter((u) => u.unread).length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <Sidebar />
      <StatsSidebar />

      <main className="pt-16 pb-20 sm:pb-0 sm:pl-56 xl:pr-72 transition-all duration-300">
        <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
          {/* Header */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
              <div className="flex items-center gap-3">
                {selectedCourseCode && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBackToClasses}
                    className="rounded-full h-8 w-8 hover:bg-secondary"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                )}
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    {selectedCourseCode
                      ? selectedCourseCode
                      : (activeFilter === "classes" ? "My Courses" : "Your Updates")}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedCourseCode
                      ? `Viewing assignments and updates for ${selectedCourseCode}`
                      : (activeFilter === "classes"
                        ? "Viewing your current semester classes and professors"
                        : `${unreadCount} unread notifications across all platforms`)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="hidden sm:inline">Showing updates from</span>
                <span className="font-medium text-foreground">
                  {format(new Date(), "MMM d")} - Today
                </span>
              </div>
            </div>
          </div>

          {!selectedCourseCode && (
            <FilterBar
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              isLoading={isLoading}
              onRefresh={handleRefresh}
            />
          )}

          {/* Logic for showing sync card vs content */}
          {activeFilter === "classes" && !selectedCourseCode ? (
            canvasData ? (
              <CourseList classes={canvasData.classes} onCourseClick={handleCourseClick} />
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <div className="p-4 rounded-full bg-muted/50 mb-4 animate-pulse">
                  <span className="text-4xl">📚</span>
                </div>
                <h3 className="text-lg font-medium text-foreground">Syncing Canvas Data...</h3>
                <p className="max-w-xs text-center text-sm mt-2">
                  We are fetching your latest classes and assignments from UCSD Canvas.
                </p>
              </div>
            )
          ) : (
            <>
              <UpdateFeed
                updates={combinedUpdates}
                filter={selectedCourseCode ? 'all' : activeFilter}
                searchQuery={searchQuery}
                onMarkRead={handleMarkRead}
                isLoading={isLoading}
              />
            </>
          )}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-border bg-card p-2 sm:hidden">
        <MobileNavItem icon="dashboard" label="Home" active />
        <MobileNavItem icon="canvas" label="Canvas" />
        <MobileNavItem icon="email" label="Email" />
        <MobileNavItem icon="piazza" label="Piazza" />
      </nav>
    </div>
  );
}

function MobileNavItem({
  icon,
  label,
  active = false,
}: {
  icon: string;
  label: string;
  active?: boolean;
}) {
  const getIcon = () => {
    switch (icon) {
      case "dashboard":
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        );
      case "canvas":
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        );
      case "email":
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case "piazza":
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <button
      className={`flex flex-col items-center gap-1 rounded-lg px-4 py-2 text-xs transition-colors ${active
        ? "text-primary"
        : "text-muted-foreground hover:text-foreground"
        }`}
    >
      {getIcon()}
      <span>{label}</span>
    </button>
  );
}
