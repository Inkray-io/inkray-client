"use client";

import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { cn } from "@/lib/utils";
import { ReferrerBreakdown } from "./useAnalyticsData";

interface ReferrerChartProps {
  data: ReferrerBreakdown[];
  className?: string;
}

const COLORS: Record<string, { fill: string; label: string }> = {
  direct: { fill: "#6366f1", label: "Direct" },
  social: { fill: "#f43f5e", label: "Social" },
  search: { fill: "#10b981", label: "Search" },
  external: { fill: "#f59e0b", label: "External" },
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: ReferrerBreakdown & { fill: string };
  }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;

  return (
    <div
      className={cn(
        "bg-popover border border-border rounded-lg shadow-lg",
        "px-3 py-2 text-sm"
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        <span
          className="w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: data.fill }}
        />
        <span className="font-medium text-foreground">{data.label}</span>
      </div>
      <p className="text-muted-foreground">
        {data.count.toLocaleString()} visits ({data.percentage.toFixed(1)}%)
      </p>
    </div>
  );
}

export function ReferrerChart({ data, className }: ReferrerChartProps) {
  const chartData = useMemo(() => {
    return data.map((item) => ({
      ...item,
      fill: COLORS[item.type]?.fill || "#94a3b8",
    }));
  }, [data]);

  const total = useMemo(
    () => data.reduce((sum, item) => sum + item.count, 0),
    [data]
  );

  if (!chartData.length || total === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center h-64 rounded-xl",
          "bg-gradient-to-br from-gray-50 to-gray-100/50",
          "border border-dashed border-gray-200",
          className
        )}
      >
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
          <svg
            className="w-6 h-6 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
        </div>
        <p className="text-gray-500 text-sm font-medium">No referrer data</p>
        <p className="text-gray-400 text-xs mt-1">Tracking will start with new visits</p>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <div className="flex flex-col lg:flex-row items-center gap-6">
        {/* Donut Chart */}
        <div className="relative w-full lg:w-1/2 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="count"
                animationDuration={750}
                animationEasing="ease-out"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.fill}
                    stroke="white"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Center label */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <span className="block text-2xl font-bold text-gray-900 tabular-nums">
                {total.toLocaleString()}
              </span>
              <span className="text-xs text-gray-500">Total visits</span>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="w-full lg:w-1/2 space-y-3">
          {chartData.map((item) => (
            <div
              key={item.type}
              className="flex items-center justify-between p-3 rounded-lg bg-gray-50/80 hover:bg-gray-100/80 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.fill }}
                />
                <span className="font-medium text-gray-700">{item.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm tabular-nums text-gray-600">
                  {item.count.toLocaleString()}
                </span>
                <span className="text-sm font-semibold tabular-nums text-gray-900 min-w-[50px] text-right">
                  {item.percentage.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
