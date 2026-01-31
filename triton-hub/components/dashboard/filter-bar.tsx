"use client";

import { cn } from "@/lib/utils";
import type { FilterType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2 } from "lucide-react";

interface FilterBarProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  isLoading: boolean;
  onRefresh: () => void;
}

const filters: { value: FilterType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "canvas", label: "Canvas" },
  { value: "email", label: "Email" },
  { value: "piazza", label: "Piazza" },
  { value: "urgent", label: "Urgent" },
];

export function FilterBar({
  activeFilter,
  onFilterChange,
  isLoading,
  onRefresh,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
      {/* Filter Chips */}
      <div className="flex flex-wrap items-center gap-2">
        {filters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => onFilterChange(filter.value)}
            className={cn(
              "inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              activeFilter === filter.value
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Refresh Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        disabled={isLoading}
        className="gap-2 bg-transparent"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
        {isLoading ? "Syncing..." : "Refresh"}
      </Button>
    </div>
  );
}
