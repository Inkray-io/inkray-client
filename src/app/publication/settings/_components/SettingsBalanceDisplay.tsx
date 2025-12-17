"use client";

import { cn } from "@/lib/utils";

interface BalanceStat {
  label: string;
  value: string | number;
}

interface SettingsBalanceDisplayProps {
  balance: string;
  currency?: string;
  subtitle?: string;
  isLoading?: boolean;
  error?: string | null;
  stats?: BalanceStat[];
  className?: string;
}

export function SettingsBalanceDisplay({
  balance,
  currency = "SUI",
  subtitle = "Available to withdraw",
  isLoading = false,
  error = null,
  stats,
  className,
}: SettingsBalanceDisplayProps) {
  if (isLoading) {
    return (
      <div className={cn("bg-gray-50 rounded-xl p-5", className)}>
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-primary" />
          <span className="text-gray-500 text-sm">Loading balance...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("bg-red-50 rounded-xl p-5 border border-red-100", className)}>
        <p className="text-red-800 font-medium text-sm">Failed to load balance</p>
        <p className="text-red-600 text-sm mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className={cn("bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-5 border border-gray-100", className)}>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-gray-900 tabular-nums tracking-tight">
          {balance}
        </span>
        <span className="text-lg font-medium text-gray-500">
          {currency}
        </span>
      </div>
      {subtitle && (
        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
      )}

      {stats && stats.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200/60 grid grid-cols-2 gap-4">
          {stats.map((stat, index) => (
            <div key={index}>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                {stat.label}
              </p>
              <p className="text-lg font-semibold text-gray-900 mt-0.5 tabular-nums">
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
