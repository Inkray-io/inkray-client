"use client";

import { cn } from "@/lib/utils";
import { HiGlobeAlt, HiArrowTopRightOnSquare } from "react-icons/hi2";
import { TopReferrer } from "./useAnalyticsData";

interface ReferrerMetricCardProps {
  topReferrers: TopReferrer[];
  total: number;
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

function getDomainIcon(domain: string): string {
  const lowered = domain.toLowerCase();
  if (lowered.includes("twitter") || lowered.includes("x.com") || lowered.includes("t.co"))
    return "𝕏";
  if (lowered.includes("facebook") || lowered.includes("fb.com")) return "f";
  if (lowered.includes("linkedin")) return "in";
  if (lowered.includes("reddit")) return "r/";
  if (lowered.includes("youtube") || lowered.includes("youtu.be")) return "▶";
  if (lowered.includes("google")) return "G";
  if (lowered.includes("bing")) return "b";
  if (lowered.includes("discord")) return "🎮";
  if (lowered.includes("telegram") || lowered.includes("t.me")) return "✈";
  return "🌐";
}

export function ReferrerMetricCard({
  topReferrers,
  total,
  className,
}: ReferrerMetricCardProps) {
  if (!topReferrers.length) {
    return (
      <div
        className={cn(
          "rounded-xl border border-gray-100 bg-gradient-to-br from-gray-50 to-gray-100/50 p-5",
          className
        )}
      >
        <div className="flex items-center gap-2 mb-4">
          <HiGlobeAlt className="w-5 h-5 text-gray-400" />
          <h3 className="font-semibold text-gray-700">Top Referrers</h3>
        </div>
        <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
          No external referrers yet
        </div>
      </div>
    );
  }

  // Calculate max count for progress bar scaling
  const maxCount = Math.max(...topReferrers.map((r) => r.count));

  return (
    <div
      className={cn(
        "rounded-xl border border-gray-100 bg-gradient-to-br from-gray-50 to-gray-100/50",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <HiGlobeAlt className="w-5 h-5 text-gray-500" />
          <h3 className="font-semibold text-gray-700">Top Referrers</h3>
        </div>
        <span className="text-sm text-gray-400">
          {formatNumber(total)} total visits
        </span>
      </div>

      {/* Referrer list */}
      <div className="divide-y divide-gray-100">
        {topReferrers.slice(0, 8).map((referrer, index) => {
          const progressWidth = (referrer.count / maxCount) * 100;

          return (
            <div
              key={referrer.domain}
              className="relative px-5 py-3 hover:bg-gray-50/80 transition-colors group"
            >
              {/* Progress bar background */}
              <div
                className="absolute inset-y-0 left-0 bg-primary/5 transition-all duration-500 ease-out"
                style={{
                  width: `${progressWidth}%`,
                  transitionDelay: `${index * 50}ms`,
                }}
              />

              <div className="relative flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Rank */}
                  <span className="w-5 h-5 flex items-center justify-center text-xs font-medium text-gray-400 tabular-nums">
                    {index + 1}
                  </span>

                  {/* Domain icon */}
                  <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-xs font-bold text-gray-600 shadow-sm">
                    {getDomainIcon(referrer.domain)}
                  </span>

                  {/* Domain name */}
                  <span className="text-sm font-medium text-gray-700 truncate">
                    {referrer.domain}
                  </span>

                  {/* External link icon on hover */}
                  <HiArrowTopRightOnSquare className="w-3.5 h-3.5 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm tabular-nums text-gray-600">
                    {formatNumber(referrer.count)}
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-gray-900 min-w-[48px] text-right">
                    {referrer.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer if more referrers */}
      {topReferrers.length > 8 && (
        <div className="px-5 py-3 text-center border-t border-gray-100">
          <span className="text-xs text-gray-400">
            +{topReferrers.length - 8} more referrers
          </span>
        </div>
      )}
    </div>
  );
}
