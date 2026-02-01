"use client";

import { Mail } from "lucide-react";
import { Navbar } from "@/components/dashboard/navbar";
import { Sidebar } from "@/components/dashboard/sidebar";

export default function EmailPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar searchQuery="" onSearchChange={() => {}} />
      <Sidebar />
      <main className="pt-16 pb-20 sm:pb-0 sm:pl-56 xl:pr-72 transition-all duration-300">
        <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">Email</h1>
            <p className="text-sm text-muted-foreground mt-1">
              View your emails synced from Gmail
            </p>
          </div>
          
          <div className="flex flex-col items-center justify-center h-64 border border-border rounded-xl bg-card">
            <Mail className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-muted-foreground font-medium">Email integration coming soon!</p>
            <p className="text-xs text-muted-foreground mt-1">Your Gmail emails will appear here.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
