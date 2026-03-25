"use client";

import { AssignmentView } from "@/components/dashboard/assignment-view";
import { Navbar } from "@/components/dashboard/navbar";
import { Sidebar } from "@/components/dashboard/sidebar";
import { StatsSidebar } from "@/components/dashboard/stats-sidebar";

export default function AssignmentsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Sidebar />
      <StatsSidebar />
      <main className="pt-16 pb-20 sm:pb-0 sm:pl-64 xl:pr-80 transition-all duration-300">
        <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
          <AssignmentView />
        </div>
      </main>
    </div>
  );
}
