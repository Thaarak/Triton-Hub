"use client";

import { CanvasIntegration } from "@/components/dashboard/canvas-integration";
import { Navbar } from "@/components/dashboard/navbar";
import { Sidebar } from "@/components/dashboard/sidebar";
import { StatsSidebar } from "@/components/dashboard/stats-sidebar";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar - Pass dummy props or remove if not needed, keeping layout consistent */}
      <Navbar searchQuery="" onSearchChange={() => { }} />

      {/* Sidebar */}
      <Sidebar />

      {/* StatsSidebar */}
      <StatsSidebar />

      {/* Main Content */}
      <main className="pt-16 pb-20 sm:pb-0 sm:pl-56 xl:pr-72 transition-all duration-300">
        <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">
              Canvas Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Sync your Canvas account to view your classes, grades, and assignments.
            </p>
          </div>

          <CanvasIntegration />
        </div>
      </main>
    </div>
  );
}
