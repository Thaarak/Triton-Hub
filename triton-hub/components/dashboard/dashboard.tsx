"use client";

import { useState, useCallback } from "react";
import { mockUpdates } from "@/lib/mock-data";
import type { Update, FilterType } from "@/lib/types";
import { Navbar } from "./navbar";
import { Sidebar } from "./sidebar";
import { StatsSidebar } from "./stats-sidebar";
import { FilterBar } from "./filter-bar";
import { UpdateFeed } from "./update-feed";
import { format } from "date-fns";

export function Dashboard() {
  const [updates, setUpdates] = useState<Update[]>(mockUpdates);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleMarkRead = useCallback((id: string) => {
    // Optimistic update
    setUpdates((prev) =>
      prev.map((update) =>
        update.id === id ? { ...update, unread: false } : update
      )
    );
  }, []);

  const handleRefresh = useCallback(() => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
  }, []);

  const unreadCount = updates.filter((u) => u.unread).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <Navbar searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      {/* Sidebar */}
      <Sidebar />

      {/* Stats Sidebar */}
      <StatsSidebar />

      {/* Main Content */}
      <main className="pt-16 pb-20 sm:pb-0 sm:pl-56 xl:pr-72 transition-all duration-300">
        <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
          {/* Header */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Your Updates
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {unreadCount} unread notifications across all platforms
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="hidden sm:inline">Showing updates from</span>
                <span className="font-medium text-foreground">
                  {format(new Date(), "MMM d")} - Today
                </span>
              </div>
            </div>
          </div>

          {/* Filters */}
          <FilterBar
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            isLoading={isLoading}
            onRefresh={handleRefresh}
          />

          {/* Feed */}
          <UpdateFeed
            updates={updates}
            filter={activeFilter}
            searchQuery={searchQuery}
            onMarkRead={handleMarkRead}
            isLoading={isLoading}
          />
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
      className={`flex flex-col items-center gap-1 rounded-lg px-4 py-2 text-xs transition-colors ${
        active
          ? "text-primary"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {getIcon()}
      <span>{label}</span>
    </button>
  );
}
