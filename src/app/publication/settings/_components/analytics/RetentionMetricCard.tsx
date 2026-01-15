"use client";

import { cn } from "@/lib/utils";
import { RetentionData } from "./useAnalyticsData";

interface RetentionMetricCardProps {
  data: RetentionData;
  className?: string;
}

const RETENTION_METRICS = [
  { key: "day1" as const, label: "Day 1", description: "Return within 24h" },
  { key: "day7" as const, label: "Day 7", description: "Return within week" },
  { key: "day14" as const, label: "Day 14", description: "Return within 2 weeks" },
  { key: "day30" as const, label: "Day 30", description: "Return within month" },
];

function getRetentionColor(rate: number): string {
  if (rate >= 40) return "text-emerald-600";
  if (rate >= 20) return "text-amber-600";
  return "text-gray-600";
}

function getRetentionBgColor(rate: number): string {
  if (rate >= 40) return "from-emerald-50 to-emerald-100/30";
  if (rate >= 20) return "from-amber-50 to-amber-100/30";
  return "from-gray-50 to-gray-100/50";
}

export function RetentionMetricCard({ data, className }: RetentionMetricCardProps) {
  return (
    <div className={cn("grid grid-cols-2 lg:grid-cols-4 gap-3", className)}>
      {RETENTION_METRICS.map((metric, index) => {
        const rate = data.averageRetention[metric.key];
        const colorClass = getRetentionColor(rate);
        const bgClass = getRetentionBgColor(rate);

        return (
          <div
            key={metric.key}
            className={cn(
              "relative overflow-hidden rounded-xl",
              "bg-gradient-to-br border border-gray-100",
              bgClass,
              "p-4 sm:p-5",
              "transition-all duration-300 hover:shadow-md hover:scale-[1.02]"
            )}
            style={{
              animationDelay: `${index * 75}ms`,
            }}
          >
            {/* Decorative ring */}
            <div className="absolute -top-4 -right-4 w-16 h-16 opacity-[0.08] pointer-events-none">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className={colorClass}
                />
              </svg>
            </div>

            <div className="relative">
              {/* Label */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-gray-500">
                  {metric.label}
                </span>
              </div>

              {/* Main percentage */}
              <div className="flex items-baseline gap-1 mb-1">
                <span
                  className={cn(
                    "text-3xl sm:text-4xl font-bold tracking-tight tabular-nums",
                    colorClass
                  )}
                  style={{ fontFeatureSettings: "'tnum' 1" }}
                >
                  {rate.toFixed(1)}
                </span>
                <span className={cn("text-lg font-semibold", colorClass)}>%</span>
              </div>

              {/* Description */}
              <p className="text-xs text-gray-400">{metric.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
