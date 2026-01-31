"use client";

import { useMemo } from "react";
import type { Update, FilterType } from "@/lib/types";
import { UpdateCard } from "./update-card";
import { Loader2 } from "lucide-react";

interface UpdateFeedProps {
  updates: Update[];
  filter: FilterType;
  searchQuery: string;
  onMarkRead: (id: string) => void;
  isLoading: boolean;
}

export function UpdateFeed({
  updates,
  filter,
  searchQuery,
  onMarkRead,
  isLoading,
}: UpdateFeedProps) {
  const filteredUpdates = useMemo(() => {
    return updates.filter((update) => {
      // Apply source/urgent filter
      if (filter !== "all") {
        if (filter === "urgent") {
          if (update.priority !== "urgent") return false;
        } else {
          if (update.source !== filter) return false;
        }
      }

      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          update.title.toLowerCase().includes(query) ||
          update.snippet.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [updates, filter, searchQuery]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading your updates...</p>
      </div>
    );
  }

  if (filteredUpdates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center mb-4">
          <svg
            className="h-8 w-8 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">
          No updates found
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          {searchQuery
            ? `No results for "${searchQuery}". Try a different search term.`
            : "You're all caught up! Check back later for new updates."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {filteredUpdates.map((update) => (
        <UpdateCard key={update.id} update={update} onMarkRead={onMarkRead} />
      ))}
    </div>
  );
}
