"use client";

import { BookOpen, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DataOrigin } from "@/lib/notification-origin";

const ORIGIN_META: Record<
  DataOrigin,
  { icon: typeof BookOpen; label: string; title: string; className: string }
> = {
  canvas: {
    icon: BookOpen,
    label: "Canvas",
    title: "Pulled live from Canvas using your connected token",
    className: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30",
  },
  email: {
    icon: Mail,
    label: "Email",
    title: "From your synced inbox / notifications (Gmail pipeline or saved in your account)",
    className: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
  },
};

type DataOriginBadgeProps = {
  origin: DataOrigin;
  size?: "sm" | "default";
  className?: string;
};

export function DataOriginBadge({ origin, size = "default", className }: DataOriginBadgeProps) {
  const meta = ORIGIN_META[origin];
  const Icon = meta.icon;
  return (
    <Badge
      variant="outline"
      title={meta.title}
      className={cn(
        "font-bold gap-1 border",
        size === "sm" ? "text-[10px] px-1.5 py-0 h-5" : "text-xs",
        meta.className,
        className
      )}
    >
      <Icon className={cn(size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")} aria-hidden />
      {meta.label}
    </Badge>
  );
}
