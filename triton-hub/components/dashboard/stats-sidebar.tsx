"use client";

import { quickStats } from "@/lib/mock-data";
import { Clock, Mail, AtSign } from "lucide-react";

export function StatsSidebar() {
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
              {quickStats.upcomingDeadlines}
            </p>
            <p className="text-xs text-muted-foreground">Upcoming Deadlines</p>
          </div>
        </div>

        {/* Unread Emails */}
        <div className="flex items-center gap-3 rounded-lg bg-secondary/50 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
            <Mail className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">
              {quickStats.unreadEmails}
            </p>
            <p className="text-xs text-muted-foreground">Unread Emails</p>
          </div>
        </div>

        {/* Piazza Mentions */}
        <div className="flex items-center gap-3 rounded-lg bg-secondary/50 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20">
            <AtSign className="h-5 w-5 text-purple-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">
              {quickStats.piazzaMentions}
            </p>
            <p className="text-xs text-muted-foreground">Piazza @mentions</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold text-foreground mb-3">
          This Week
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Canvas updates</span>
            <span className="font-medium text-foreground">12</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Emails received</span>
            <span className="font-medium text-foreground">24</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Piazza posts</span>
            <span className="font-medium text-foreground">8</span>
          </div>
        </div>
      </div>

      {/* Sync Status */}
      <div className="mt-6 rounded-lg border border-border bg-secondary/30 p-3">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-muted-foreground">
            All sources synced
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Last updated: just now
        </p>
      </div>
    </aside>
  );
}
