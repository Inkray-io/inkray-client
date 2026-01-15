"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ChartDataPoint, MetricType } from "./useAnalyticsData";

interface AnalyticsChartProps {
  data: ChartDataPoint[];
  metric: MetricType;
  className?: string;
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return num.toString();
}

function getMetricLabel(metric: MetricType): string {
  switch (metric) {
    case "views":
      return "Views";
    case "likes":
      return "Likes";
    case "follows":
      return "Followers";
    case "tips":
      return "SUI";
    case "retention":
      return "Retention";
    case "nonFollowers":
      return "Discovery Views";
    case "referrers":
      return "Referrals";
    default:
      return "Value";
  }
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: ChartDataPoint }>;
  metric: MetricType;
}

function CustomTooltip({ active, payload, metric }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0];
  const formattedDate = format(data.payload.rawDate, "EEEE, MMMM d, yyyy");

  // Format value - show decimals for tips (SUI amounts)
  const formattedValue = metric === "tips"
    ? data.value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
    : data.value.toLocaleString();

  return (
    <div
      className={cn(
        "bg-popover border border-border rounded-lg shadow-lg",
        "px-3 py-2 text-sm"
      )}
    >
      <p className="text-muted-foreground text-xs mb-1">{formattedDate}</p>
      <p className="font-semibold text-foreground">
        {formattedValue} {getMetricLabel(metric)}
      </p>
    </div>
  );
}

export function AnalyticsChart({
  data,
  metric,
  className,
}: AnalyticsChartProps) {
  // Calculate tick interval based on data length
  const tickInterval = useMemo(() => {
    const len = data.length;
    if (len <= 7) return 0; // Show all
    if (len <= 14) return 1; // Every other
    if (len <= 30) return Math.floor(len / 6);
    return Math.floor(len / 8);
  }, [data.length]);

  // Get chart color based on metric
  const chartColor = useMemo(() => {
    switch (metric) {
      case "views":
        return "var(--chart-1)";
      case "likes":
        return "var(--chart-5)";
      case "follows":
        return "var(--chart-2)";
      case "tips":
        return "var(--chart-3)";
      case "retention":
        return "var(--chart-4)";
      case "nonFollowers":
        return "#6366f1";
      case "referrers":
        return "#f59e0b";
      default:
        return "var(--chart-1)";
    }
  }, [metric]);

  const gradientId = `gradient-${metric}`;

  if (!data.length) {
    return (
      <div
        className={cn(
          "flex items-center justify-center h-64 rounded-xl",
          "bg-muted/20 border border-dashed border-border",
          className
        )}
      >
        <p className="text-muted-foreground text-sm">No data available</p>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={chartColor} stopOpacity={0.3} />
              <stop offset="95%" stopColor={chartColor} stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            strokeOpacity={0.5}
            vertical={false}
          />

          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            interval={tickInterval}
            dy={10}
          />

          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            tickFormatter={formatNumber}
            width={45}
            dx={-5}
          />

          <Tooltip
            content={<CustomTooltip metric={metric} />}
            cursor={{
              stroke: "var(--muted-foreground)",
              strokeWidth: 1,
              strokeDasharray: "4 4",
            }}
          />

          <Area
            type="monotone"
            dataKey="value"
            stroke={chartColor}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            animationDuration={750}
            animationEasing="ease-out"
            dot={false}
            activeDot={{
              r: 5,
              fill: chartColor,
              stroke: "var(--background)",
              strokeWidth: 2,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
