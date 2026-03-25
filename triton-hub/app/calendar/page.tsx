"use client";

import { CanvasSetupGuard } from "@/components/canvas-setup-guard";
import { Navbar } from "@/components/dashboard/navbar";
import { Sidebar } from "@/components/dashboard/sidebar";
import { CalendarView } from "@/components/dashboard/calendar-view";
import { StatsSidebar } from "@/components/dashboard/stats-sidebar";

export default function CalendarPage() {
  return (
    <CanvasSetupGuard>
    <div className="min-h-screen bg-background">
      <Navbar />
      <Sidebar />
      <StatsSidebar />

      <main className="pt-16 pb-20 sm:pb-0 sm:pl-64 xl:pr-80 transition-all duration-300">
        <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
          <div className="mb-8 rounded-[28px] border border-white/10 bg-card/80 p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Calendar</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Assignment planning without the clutter</h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
              Track active assignments, keep old unchecked work in a separate bucket, and focus on what still needs attention.
            </p>
          </div>

          <CalendarView />
        </div>
      </main>
    </div>
    </CanvasSetupGuard>
  );
}
