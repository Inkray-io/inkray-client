"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { cn } from "@/lib/utils";
import { RetentionDataPoint } from "./useAnalyticsData";

interface RetentionChartProps {
  data: RetentionDataPoint[];
  className?: string;
}

interface AggregatedDataPoint {
  day: number;
  avgRetention: number;
  minRetention: number;
  maxRetention: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: AggregatedDataPoint }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0];

  return (
    <div
      className={cn(
        "bg-popover border border-border rounded-lg shadow-lg",
        "px-3 py-2 text-sm"
      )}
    >
      <p className="text-muted-foreground text-xs mb-1">Day {data.payload.day}</p>
      <p className="font-semibold text-foreground">
        {data.value.toFixed(1)}% retention
      </p>
      {data.payload.minRetention !== data.payload.maxRetention && (
        <p className="text-xs text-muted-foreground mt-1">
          Range: {data.payload.minRetention.toFixed(1)}% - {data.payload.maxRetention.toFixed(1)}%
        </p>
      )}
    </div>
  );
}

export function RetentionChart({ data, className }: RetentionChartProps) {
  // Aggregate cohort data into average retention by day
  const chartData = useMemo(() => {
    const byDay = new Map<number, number[]>();

    data.forEach((d) => {
      const existing = byDay.get(d.day) || [];
      existing.push(d.retentionRate);
      byDay.set(d.day, existing);
    });

    const aggregated: AggregatedDataPoint[] = [];

    // Include days 1-30, even if no data
    for (let day = 1; day <= 30; day++) {
      const rates = byDay.get(day) || [];
      if (rates.length > 0) {
        aggregated.push({
          day,
          avgRetention: rates.reduce((a, b) => a + b, 0) / rates.length,
          minRetention: Math.min(...rates),
          maxRetention: Math.max(...rates),
        });
      }
    }

    return aggregated.sort((a, b) => a.day - b.day);
  }, [data]);

  if (!chartData.length) {
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
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </div>
        <p className="text-gray-500 text-sm font-medium">Not enough data</p>
        <p className="text-gray-400 text-xs mt-1">Need more returning visitors</p>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
        >
          <defs>
            <linearGradient id="retention-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-4)" stopOpacity={0.2} />
              <stop offset="100%" stopColor="var(--chart-4)" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            strokeOpacity={0.5}
            vertical={false}
          />

          {/* Reference lines for key days */}
          <ReferenceLine
            x={7}
            stroke="var(--muted-foreground)"
            strokeDasharray="3 3"
            strokeOpacity={0.3}
          />
          <ReferenceLine
            x={14}
            stroke="var(--muted-foreground)"
            strokeDasharray="3 3"
            strokeOpacity={0.3}
          />
          <ReferenceLine
            x={30}
            stroke="var(--muted-foreground)"
            strokeDasharray="3 3"
            strokeOpacity={0.3}
          />

          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            tickFormatter={(value) => `D${value}`}
            interval={6}
            dy={10}
          />

          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            tickFormatter={(value) => `${value}%`}
            domain={[0, 100]}
            width={45}
            dx={-5}
          />

          <Tooltip
            content={<CustomTooltip />}
            cursor={{
              stroke: "var(--muted-foreground)",
              strokeWidth: 1,
              strokeDasharray: "4 4",
            }}
          />

          <Line
            type="monotone"
            dataKey="avgRetention"
            stroke="var(--chart-4)"
            strokeWidth={2.5}
            dot={{
              fill: "var(--chart-4)",
              stroke: "var(--background)",
              strokeWidth: 2,
              r: 4,
            }}
            activeDot={{
              r: 6,
              fill: "var(--chart-4)",
              stroke: "var(--background)",
              strokeWidth: 2,
            }}
            animationDuration={1000}
            animationEasing="ease-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
