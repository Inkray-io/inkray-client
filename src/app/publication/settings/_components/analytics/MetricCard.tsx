"use client";

import { cn } from "@/lib/utils";
import { HiArrowTrendingUp, HiArrowTrendingDown, HiMinus } from "react-icons/hi2";
import { MetricType, TimeRange } from "./useAnalyticsData";

interface MetricCardProps {
  metric: MetricType;
  total: number;
  percentChange: number;
  averagePerDay: number;
  range: TimeRange;
  className?: string;
}

function formatNumber(num: number, isTips: boolean = false): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  // For tips, show up to 2 decimal places for fractional SUI amounts
  if (isTips && num > 0 && num < 100) {
    return num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }
  return num.toLocaleString();
}

function getRangeLabel(range: TimeRange): string {
  switch (range) {
    case "7d":
      return "Last 7 days";
    case "1m":
      return "Last 30 days";
    case "1y":
      return "Last year";
    case "all":
      return "All time";
    case "custom":
      return "Custom range";
  }
}

function getMetricLabel(metric: MetricType): string {
  switch (metric) {
    case "views":
      return "Total Views";
    case "likes":
      return "Total Likes";
    case "follows":
      return "New Followers";
    case "tips":
      return "Total Tips (SUI)";
  }
}

export function MetricCard({
  metric,
  total,
  percentChange,
  averagePerDay,
  range,
  className,
}: MetricCardProps) {
  const isPositive = percentChange > 0;
  const isNeutral = percentChange === 0;
  const isTips = metric === "tips";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl",
        "bg-gradient-to-br from-muted/30 to-muted/10",
        "border border-border/50",
        "p-5 sm:p-6",
        className
      )}
    >
      {/* Decorative element */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.03] pointer-events-none">
        <svg viewBox="0 0 100 100" className="w-full h-full fill-foreground">
          <circle cx="80" cy="20" r="60" />
        </svg>
      </div>

      <div className="relative">
        {/* Label */}
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-muted-foreground">
            {getMetricLabel(metric)}
          </span>
          <span className="text-xs text-muted-foreground/70">
            {getRangeLabel(range)}
          </span>
        </div>

        {/* Main number */}
        <div className="flex items-baseline gap-3 mb-3">
          <span
            className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground tabular-nums"
            style={{ fontFeatureSettings: "'tnum' 1" }}
          >
            {formatNumber(total, isTips)}
          </span>

          {/* Percent change badge */}
          <div
            className={cn(
              "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold",
              isNeutral && "bg-muted text-muted-foreground",
              isPositive && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
              !isPositive && !isNeutral && "bg-red-500/10 text-red-600 dark:text-red-400"
            )}
          >
            {isNeutral ? (
              <HiMinus className="size-3" />
            ) : isPositive ? (
              <HiArrowTrendingUp className="size-3" />
            ) : (
              <HiArrowTrendingDown className="size-3" />
            )}
            <span>{isNeutral ? "0" : Math.abs(percentChange).toFixed(1)}%</span>
          </div>
        </div>

        {/* Secondary stat */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-chart-1" />
            <span>
              ~{formatNumber(isTips ? averagePerDay : Math.round(averagePerDay), isTips)} per day avg
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
