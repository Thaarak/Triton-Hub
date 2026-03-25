"use client";

import { Navbar } from "@/components/dashboard/navbar";
import { Sidebar } from "@/components/dashboard/sidebar";
import { StatsSidebar } from "@/components/dashboard/stats-sidebar";
import { SettingsView } from "@/components/dashboard/settings-view";

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Sidebar />
      <StatsSidebar />
      <main className="pt-16 pb-20 sm:pb-0 sm:pl-56 xl:pr-72 transition-all duration-300">
        <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
          <SettingsView />
        </div>
      </main>
    </div>
  );
}
