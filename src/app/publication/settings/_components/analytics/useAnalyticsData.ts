import { useMemo } from "react";
import {
  subDays,
  subYears,
  format,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  differenceInDays,
  startOfDay,
} from "date-fns";

export type MetricType = "views" | "likes" | "follows";
export type TimeRange = "7d" | "1m" | "1y" | "all" | "custom";

export interface ChartDataPoint {
  date: string;
  value: number;
  rawDate: Date;
}

export interface AnalyticsData {
  chartData: ChartDataPoint[];
  total: number;
  previousTotal: number;
  percentChange: number;
  averagePerDay: number;
}

interface UseAnalyticsDataParams {
  metric: MetricType;
  range: TimeRange;
  customStartDate?: Date;
  customEndDate?: Date;
}

// Seed-based random for consistent mock data
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function generateMockValue(
  date: Date,
  metric: MetricType,
  baseValue: number
): number {
  const seed = date.getTime() + metric.charCodeAt(0);
  const random = seededRandom(seed);

  // Add day-of-week pattern (weekends slightly lower)
  const dayOfWeek = date.getDay();
  const weekendFactor = dayOfWeek === 0 || dayOfWeek === 6 ? 0.7 : 1;

  // Add growth trend over time
  const daysSinceEpoch = Math.floor(date.getTime() / (1000 * 60 * 60 * 24));
  const growthFactor = 1 + (daysSinceEpoch % 365) * 0.001;

  // Combine factors with randomness
  const value = Math.floor(
    baseValue * weekendFactor * growthFactor * (0.5 + random)
  );

  return Math.max(1, value);
}

function getBaseValue(metric: MetricType): number {
  switch (metric) {
    case "views":
      return 150;
    case "likes":
      return 25;
    case "follows":
      return 8;
  }
}

function getDateRange(
  range: TimeRange,
  customStartDate?: Date,
  customEndDate?: Date
): { start: Date; end: Date } {
  const end = startOfDay(new Date());

  switch (range) {
    case "7d":
      return { start: subDays(end, 6), end };
    case "1m":
      return { start: subDays(end, 29), end };
    case "1y":
      return { start: subYears(end, 1), end };
    case "all":
      return { start: subYears(end, 2), end };
    case "custom":
      return {
        start: customStartDate || subDays(end, 29),
        end: customEndDate || end,
      };
  }
}

function formatDateForRange(date: Date, range: TimeRange, totalDays: number): string {
  if (range === "7d") {
    return format(date, "EEE");
  }
  if (range === "1m" || (range === "custom" && totalDays <= 60)) {
    return format(date, "MMM d");
  }
  if (range === "1y" || (range === "custom" && totalDays <= 400)) {
    return format(date, "MMM");
  }
  return format(date, "MMM yyyy");
}

export function useAnalyticsData({
  metric,
  range,
  customStartDate,
  customEndDate,
}: UseAnalyticsDataParams): AnalyticsData {
  return useMemo(() => {
    const { start, end } = getDateRange(range, customStartDate, customEndDate);
    const totalDays = differenceInDays(end, start) + 1;
    const baseValue = getBaseValue(metric);

    let intervals: Date[];
    let aggregationType: "day" | "week" | "month" = "day";

    // Determine aggregation based on range
    if (totalDays <= 31) {
      intervals = eachDayOfInterval({ start, end });
      aggregationType = "day";
    } else if (totalDays <= 120) {
      intervals = eachWeekOfInterval({ start, end });
      aggregationType = "week";
    } else {
      intervals = eachMonthOfInterval({ start, end });
      aggregationType = "month";
    }

    // Generate chart data
    const chartData: ChartDataPoint[] = intervals.map((date) => {
      let value: number;

      if (aggregationType === "day") {
        value = generateMockValue(date, metric, baseValue);
      } else if (aggregationType === "week") {
        // Sum 7 days for weekly aggregation
        value = eachDayOfInterval({
          start: date,
          end: subDays(new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000), 1),
        }).reduce((sum, d) => sum + generateMockValue(d, metric, baseValue), 0);
      } else {
        // Sum days in month for monthly aggregation
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        value = eachDayOfInterval({ start: date, end: monthEnd }).reduce(
          (sum, d) => sum + generateMockValue(d, metric, baseValue),
          0
        );
      }

      return {
        date: formatDateForRange(date, range, totalDays),
        value,
        rawDate: date,
      };
    });

    // Calculate totals
    const allDays = eachDayOfInterval({ start, end });
    const total = allDays.reduce(
      (sum, d) => sum + generateMockValue(d, metric, baseValue),
      0
    );

    // Calculate previous period for comparison
    const previousStart = subDays(start, totalDays);
    const previousEnd = subDays(end, totalDays);
    const previousDays = eachDayOfInterval({
      start: previousStart,
      end: previousEnd,
    });
    const previousTotal = previousDays.reduce(
      (sum, d) => sum + generateMockValue(d, metric, baseValue),
      0
    );

    const percentChange =
      previousTotal === 0
        ? 100
        : ((total - previousTotal) / previousTotal) * 100;

    const averagePerDay = total / totalDays;

    return {
      chartData,
      total,
      previousTotal,
      percentChange,
      averagePerDay,
    };
  }, [metric, range, customStartDate, customEndDate]);
}
