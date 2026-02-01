"use client";

import { useState, useEffect } from "react";
import { fetchAndTransformNotifications } from "@/lib/notifications";
import type { Update } from "@/lib/types";
import { Clock, Bell, AlertTriangle, BookOpen, Megaphone, Calendar } from "lucide-react";

export function StatsSidebar() {
  const [stats, setStats] = useState({
    upcomingDeadlines: 0,
    unreadNotifications: 0,
    urgentItems: 0,
    assignments: 0,
    announcements: 0,
    events: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const updates = await fetchAndTransformNotifications();
        const now = new Date();

        // Calculate stats from real data
        const upcomingDeadlines = updates.filter(
          (u) => u.category === "assignment" && u.dueDate && u.dueDate > now
        ).length;

        const unreadNotifications = updates.filter((u) => u.unread).length;
        const urgentItems = updates.filter((u) => u.priority === "urgent").length;
        const assignments = updates.filter((u) => u.category === "assignment").length;
        const announcements = updates.filter((u) => u.category === "announcement").length;
        const events = updates.filter((u) => u.category === "event").length;

        setStats({
          upcomingDeadlines,
          unreadNotifications,
          urgentItems,
          assignments,
          announcements,
          events,
        });
      } catch (error) {
        console.error("Failed to load stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, []);

  return (
    <aside className="hidden xl:block fixed right-0 top-16 w-72 h-[calc(100vh-4rem)] border-l border-border bg-card/50 p-6">
      <h2 className="text-sm font-semibold text-foreground mb-4">Quick Stats</h2>

      <div className="space-y-3">
        {/* Upcoming Deadlines */}
        <div className="flex items-center gap-3 rounded-lg bg-secondary/50 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20">
            <Clock className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">
              {isLoading ? "–" : stats.upcomingDeadlines}
            </p>
            <p className="text-xs text-muted-foreground">Upcoming Deadlines</p>
          </div>
        </div>

        {/* Unread Notifications */}
        <div className="flex items-center gap-3 rounded-lg bg-secondary/50 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
            <Bell className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">
              {isLoading ? "–" : stats.unreadNotifications}
            </p>
            <p className="text-xs text-muted-foreground">Unread Notifications</p>
          </div>
        </div>

        {/* Urgent Items */}
        <div className="flex items-center gap-3 rounded-lg bg-secondary/50 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/20">
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">
              {isLoading ? "–" : stats.urgentItems}
            </p>
            <p className="text-xs text-muted-foreground">Urgent Items</p>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold text-foreground mb-3">
          By Category
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span className="flex items-center gap-2">
              <BookOpen className="h-3 w-3" /> Assignments
            </span>
            <span className="font-medium text-foreground">
              {isLoading ? "–" : stats.assignments}
            </span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span className="flex items-center gap-2">
              <Megaphone className="h-3 w-3" /> Announcements
            </span>
            <span className="font-medium text-foreground">
              {isLoading ? "–" : stats.announcements}
            </span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span className="flex items-center gap-2">
              <Calendar className="h-3 w-3" /> Events
            </span>
            <span className="font-medium text-foreground">
              {isLoading ? "–" : stats.events}
            </span>
          </div>
        </div>
      </div>

      {/* Sync Status */}
      <div className="mt-6 rounded-lg border border-border bg-secondary/30 p-3">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${isLoading ? "bg-yellow-500" : "bg-green-500"} animate-pulse`} />
          <span className="text-xs text-muted-foreground">
            {isLoading ? "Syncing..." : "All synced"}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Data from Supabase
        </p>
      </div>
    </aside>
  );
}
