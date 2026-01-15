"use client";

import { cn } from "@/lib/utils";
import { HiArrowTrendingUp, HiArrowTrendingDown, HiMinus, HiSparkles } from "react-icons/hi2";
import { NonFollowerData, TimeRange } from "./useAnalyticsData";

interface NonFollowerMetricCardProps {
  data: NonFollowerData;
  range: TimeRange;
  className?: string;
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
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

export function NonFollowerMetricCard({
  data,
  range,
  className,
}: NonFollowerMetricCardProps) {
  const isPositive = data.percentChange > 0;
  const isNeutral = data.percentChange === 0;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl",
        "bg-gradient-to-br from-blue-50 to-indigo-50/50",
        "border border-blue-100/50",
        "p-5 sm:p-6",
        className
      )}
    >
      {/* Decorative sparkle */}
      <div className="absolute top-4 right-4 opacity-10 pointer-events-none">
        <HiSparkles className="w-20 h-20 text-blue-600" />
      </div>

      <div className="relative">
        {/* Label */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">
              Discovery Views
            </span>
            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
              Non-followers
            </span>
          </div>
          <span className="text-xs text-gray-400">{getRangeLabel(range)}</span>
        </div>

        {/* Main number */}
        <div className="flex items-baseline gap-3 mb-3">
          <span
            className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 tabular-nums"
            style={{ fontFeatureSettings: "'tnum' 1" }}
          >
            {formatNumber(data.total)}
          </span>

          {/* Percent change badge */}
          <div
            className={cn(
              "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold",
              isNeutral && "bg-gray-100 text-gray-500",
              isPositive && "bg-emerald-500/10 text-emerald-600",
              !isPositive && !isNeutral && "bg-red-500/10 text-red-600"
            )}
          >
            {isNeutral ? (
              <HiMinus className="size-3" />
            ) : isPositive ? (
              <HiArrowTrendingUp className="size-3" />
            ) : (
              <HiArrowTrendingDown className="size-3" />
            )}
            <span>
              {isNeutral ? "0" : Math.abs(data.percentChange).toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Secondary stats */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <span className="inline-flex items-center gap-1.5 text-gray-500">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>
              <span className="font-medium text-gray-700">
                {data.percentOfTotal.toFixed(1)}%
              </span>{" "}
              of all views
            </span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-gray-500">
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            <span>
              ~{formatNumber(Math.round(data.averagePerDay))} per day
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
