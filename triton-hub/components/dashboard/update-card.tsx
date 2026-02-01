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
  GraduationCap,
  Megaphone,
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

const categoryConfig = {
  assignment: {
    className: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30",
  },
  announcement: {
    className: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
  },
  grade: {
    className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  },
  exam: {
    className: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
  },
  event: {
    className: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
  },
};

// Helper to check if a date is valid
function isValidDate(date: Date | undefined | null): date is Date {
  return date instanceof Date && !isNaN(date.getTime());
}

export function UpdateCard({ update, onMarkRead }: UpdateCardProps) {
  const [expanded, setExpanded] = useState(false);
  const config = sourceConfig[update.source];
  const catConfig = categoryConfig[update.category as keyof typeof categoryConfig];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "group relative rounded-xl border bg-card p-4 transition-all duration-200 hover:shadow-md",
        update.unread && !update.isCompleted
          ? "border-border/80 shadow-sm"
          : "border-border/50 opacity-75"
      )}
    >
      {/* Unread indicator */}
      {update.unread && !update.isCompleted && (
        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-primary" />
      )}

      <div className="flex items-start gap-4">
        {/* Source Icon */}
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            update.isCompleted ? "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30" : (catConfig?.className || config.className)
          )}
        >
          {update.isCompleted ? (
            <Check className="h-5 w-5" />
          ) : update.category === "grade" ? (
            <GraduationCap className="h-5 w-5" />
          ) : update.category === "announcement" ? (
            <Megaphone className="h-5 w-5" />
          ) : (
            <Icon className="h-5 w-5" />
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <Badge variant="outline" className={cn("text-xs font-bold", update.isCompleted ? "bg-green-500/15 text-green-600 border-green-500/30" : config.className)}>
              {config.label}
            </Badge>
            {update.subCategory && !update.isCompleted && (
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] font-bold uppercase tracking-wider",
                  update.subCategory === "Exam" ? "bg-red-500/15 text-red-600 border-red-500/30" :
                    update.subCategory === "Quiz" ? "bg-amber-500/15 text-amber-600 border-amber-500/30" :
                      update.subCategory === "Project" ? "bg-purple-500/15 text-purple-600 border-purple-500/30" :
                        update.subCategory === "Lab" ? "bg-cyan-500/15 text-cyan-600 border-cyan-500/30" :
                          "bg-slate-500/15 text-slate-600 border-slate-500/30"
                )}
              >
                {update.subCategory}
              </Badge>
            )}
            {update.isCompleted && (
              <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 flex items-center gap-1 text-[10px] font-bold">
                <Check className="h-3 w-3" /> COMPLETED
              </Badge>
            )}
            {update.priority === "urgent" && !update.isCompleted && (
              <Badge
                variant="destructive"
                className="flex items-center gap-1 text-[10px] uppercase font-black tracking-tighter"
              >
                <AlertTriangle className="h-3 w-3" />
                Urgent
              </Badge>
            )}
            <span className="text-[10px] font-medium text-muted-foreground uppercase">
              {update.category === "assignment" && !update.dueDate
                ? "No Due Date"
                : isValidDate(update.timestamp)
                  ? formatDistanceToNow(update.timestamp, { addSuffix: true })
                  : "Unknown"}
            </span>
          </div>

          <h3
            className={cn(
              "text-sm font-semibold text-foreground mb-1",
              (!update.unread || update.isCompleted) && "font-medium"
            )}
          >
            {update.title}
          </h3>

          {(update.course || update.dueDate) && (
            <div className="flex flex-wrap items-center gap-3 mb-1 text-xs text-muted-foreground">
              {update.course && (
                <span className="font-medium">{update.course}</span>
              )}
              {isValidDate(update.dueDate) && (
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
          {update.unread && !update.isCompleted && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMarkRead(update.id)}
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <Check className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">
                {update.category === "assignment" ? "Complete" : "Mark Read"}
              </span>
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
