"use client";

import { useMemo } from "react";
import type { Update, FilterType } from "@/lib/types";
import type { InboxEmailFetchResult } from "@/lib/notifications";
import type { NotificationSourceFilter } from "@/lib/user-preferences";
import { UpdateCard } from "./update-card";
import { Loader2 } from "lucide-react";
import Link from "next/link";

interface UpdateFeedProps {
  updates: Update[];
  filter: FilterType;
  onMarkRead: (id: string) => void;
  isLoading: boolean;
  /** Last POST /api/emails result; used when Email tab is empty to show diagnostics. */
  inboxMeta?: InboxEmailFetchResult | null;
  sourceFeedFilter?: NotificationSourceFilter;
}

export function UpdateFeed({
  updates,
  filter,
  onMarkRead,
  isLoading,
  inboxMeta = null,
  sourceFeedFilter = "both",
}: UpdateFeedProps) {
  const emailSourceCount = useMemo(
    () => updates.filter((u) => u.source === "email").length,
    [updates]
  );

  const filteredUpdates = useMemo(() => {
    const list = updates.filter((update) => {
      // Apply source/urgent filter
      if (filter !== "all") {
        if (filter === "urgent") {
          if (update.priority !== "urgent") return false;
        } else {
          if (update.source !== filter && update.category !== filter) return false;
        }
      }

      return true;
    });

    return list;
  }, [updates, filter]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading your updates...</p>
      </div>
    );
  }

  if (filteredUpdates.length === 0) {
    if (filter === "email") {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center px-4">
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
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No Gmail-linked items in the feed</h3>
          <p className="text-sm text-muted-foreground max-w-md mb-4">
            This tab only shows items that are not from the live Canvas API (inbox-merged mail and other non-Canvas
            sources). Canvas announcements stay on <strong className="text-foreground">All</strong> or{" "}
            <strong className="text-foreground">Announcements</strong>.
          </p>
          {sourceFeedFilter === "canvas" ? (
            <p className="text-sm text-amber-600 dark:text-amber-400 max-w-md rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3">
              Your feed is set to <strong>Canvas only</strong>, so Gmail-merged rows are hidden everywhere. Open{" "}
              <Link href="/settings" className="underline underline-offset-2">
                Settings
              </Link>{" "}
              and choose <strong>Show both</strong>, then Refresh.
            </p>
          ) : null}
          {sourceFeedFilter !== "canvas" && inboxMeta?.error && inboxMeta.message ? (
            <p className="text-sm text-left max-w-md rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-foreground">
              <span className="font-medium">Gmail: </span>
              {inboxMeta.message}
              <span className="block mt-1 text-xs text-muted-foreground">Code: {inboxMeta.error}</span>
            </p>
          ) : null}
          {sourceFeedFilter !== "canvas" &&
          !inboxMeta?.error &&
          inboxMeta &&
          inboxMeta.emails.length === 0 &&
          emailSourceCount === 0 ? (
            <p className="text-sm text-muted-foreground max-w-md rounded-xl border border-white/10 bg-secondary/40 px-4 py-3">
              The inbox request returned no messages (empty INBOX or no access). After Refresh, check{" "}
              <strong className="text-foreground">Application → Session Storage → triton_last_inbox_debug</strong> in
              DevTools, or the Network tab for <code className="rounded bg-muted px-1 text-xs">POST /api/emails</code>.
            </p>
          ) : null}
          {sourceFeedFilter !== "canvas" && inboxMeta && inboxMeta.emails.length > 0 && emailSourceCount === 0 ? (
            <p className="text-sm text-amber-600 dark:text-amber-400 max-w-md">
              Gmail returned {inboxMeta.emails.length} message(s) but they did not appear in the feed. Try Refresh or
              report a bug.
            </p>
          ) : null}
          {emailSourceCount > 0 ? (
            <p className="text-sm text-muted-foreground">If you still see this, try switching tabs and back.</p>
          ) : null}
        </div>
      );
    }

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
        <h3 className="text-lg font-semibold text-foreground mb-1 capitalize">
          No {filter === 'all' ? 'updates' : filter + 's'} found
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          You're all caught up! Check back later for new updates.
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
