"use client";

import { AssignmentView } from "@/components/dashboard/assignment-view";
import { Navbar } from "@/components/dashboard/navbar";
import { Sidebar } from "@/components/dashboard/sidebar";

export default function AssignmentsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar searchQuery="" onSearchChange={() => { }} />
      <Sidebar />
      <main className="pt-16 pb-20 sm:pb-0 sm:pl-56 xl:pr-72 transition-all duration-300">
        <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
          <AssignmentView />
        </div>
      </main>
    </div>
  );
}
