"use client";

import { cn } from "@/lib/utils";
import { HiCalendarDays } from "react-icons/hi2";
import { TimeRange } from "./useAnalyticsData";

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (value: TimeRange) => void;
  className?: string;
}

const RANGES: { id: TimeRange; label: string; shortLabel: string }[] = [
  { id: "7d", label: "7 Days", shortLabel: "7D" },
  { id: "1m", label: "1 Month", shortLabel: "1M" },
  { id: "1y", label: "1 Year", shortLabel: "1Y" },
  { id: "all", label: "All Time", shortLabel: "All" },
  { id: "custom", label: "Custom", shortLabel: "Custom" },
];

export function TimeRangeSelector({
  value,
  onChange,
  className,
}: TimeRangeSelectorProps) {
  return (
    <div className={cn("flex items-center gap-1 flex-wrap", className)}>
      {RANGES.map((range) => {
        const isActive = range.id === value;
        const isCustom = range.id === "custom";

        return (
          <button
            key={range.id}
            onClick={() => onChange(range.id)}
            className={cn(
              "relative px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2",
              isActive
                ? "bg-gray-900 text-white"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            )}
          >
            <span className="flex items-center gap-1.5">
              {isCustom && <HiCalendarDays className="size-3.5" />}
              <span className="hidden sm:inline">{range.label}</span>
              <span className="sm:hidden">{range.shortLabel}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
