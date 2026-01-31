"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Update } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Mail,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Check,
  ExternalLink,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

interface UpdateCardProps {
  update: Update;
  onMarkRead: (id: string) => void;
}

const sourceConfig = {
  canvas: {
    icon: BookOpen,
    label: "Canvas",
    className: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30",
  },
  email: {
    icon: Mail,
    label: "Email",
    className: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
  },
  piazza: {
    icon: MessageSquare,
    label: "Piazza",
    className: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
  },
};

export function UpdateCard({ update, onMarkRead }: UpdateCardProps) {
  const [expanded, setExpanded] = useState(false);
  const config = sourceConfig[update.source];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "group relative rounded-xl border bg-card p-4 transition-all duration-200 hover:shadow-md",
        update.unread
          ? "border-border/80 shadow-sm"
          : "border-border/50 opacity-75"
      )}
    >
      {/* Unread indicator */}
      {update.unread && (
        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-primary" />
      )}

      <div className="flex items-start gap-4">
        {/* Source Icon */}
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            config.className
          )}
        >
          <Icon className="h-5 w-5" />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <Badge variant="outline" className={cn("text-xs", config.className)}>
              {config.label}
            </Badge>
            {update.priority === "urgent" && (
              <Badge
                variant="destructive"
                className="flex items-center gap-1 text-xs"
              >
                <AlertTriangle className="h-3 w-3" />
                Urgent
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(update.timestamp, { addSuffix: true })}
            </span>
          </div>

          <h3
            className={cn(
              "text-sm font-semibold text-foreground mb-1",
              !update.unread && "font-medium"
            )}
          >
            {update.title}
          </h3>

          {(update.course || update.dueDate) && (
            <div className="flex flex-wrap items-center gap-3 mb-1 text-xs text-muted-foreground">
              {update.course && (
                <span className="font-medium">{update.course}</span>
              )}
              {update.dueDate && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Due {format(update.dueDate, "MMM d, h:mm a")}
                </span>
              )}
            </div>
          )}

          <p
            className={cn(
              "text-sm text-muted-foreground transition-all",
              expanded ? "" : "line-clamp-2"
            )}
          >
            {update.snippet}
          </p>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1">
          {update.unread && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMarkRead(update.id)}
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <Check className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Mark Read</span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            asChild
          >
            <a href={update.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              <span className="sr-only">Open link</span>
            </a>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setExpanded(!expanded)}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            <span className="sr-only">
              {expanded ? "Collapse" : "Expand"}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}
