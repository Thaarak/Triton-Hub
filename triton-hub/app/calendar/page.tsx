"use client";

import { Navbar } from "@/components/dashboard/navbar";
import { Sidebar } from "@/components/dashboard/sidebar";
import { CalendarView } from "@/components/dashboard/calendar-view";

export default function CalendarPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Sidebar />

      <main className="pt-16 pb-20 sm:pb-0 sm:pl-56 transition-all duration-300">
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
            <p className="text-sm text-muted-foreground mt-1">
              View and manage your events, exams, and assignments
            </p>
          </div>

          <CalendarView />
        </div>
      </main>
    </div>
  );
}
