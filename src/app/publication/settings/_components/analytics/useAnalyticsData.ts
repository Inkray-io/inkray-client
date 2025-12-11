import { useQuery } from "@tanstack/react-query";
import {
  subDays,
  subYears,
  format,
  differenceInDays,
  startOfDay,
  parseISO,
} from "date-fns";
import { analyticsAPI } from "@/lib/api";

export type MetricType = "views" | "likes" | "follows" | "tips";
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
  isLoading: boolean;
  error: Error | null;
}

interface UseAnalyticsDataParams {
  publicationId: string;
  metric: MetricType;
  range: TimeRange;
  customStartDate?: Date;
  customEndDate?: Date;
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

function formatDateForRange(
  date: Date,
  range: TimeRange,
  totalDays: number
): string {
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

async function fetchAnalytics(
  publicationId: string,
  metric: MetricType,
  startDate: Date,
  endDate: Date
) {
  const startStr = format(startDate, "yyyy-MM-dd");
  const endStr = format(endDate, "yyyy-MM-dd");

  let response;
  switch (metric) {
    case "views":
      response = await analyticsAPI.getViews(publicationId, startStr, endStr);
      break;
    case "likes":
      response = await analyticsAPI.getLikes(publicationId, startStr, endStr);
      break;
    case "follows":
      response = await analyticsAPI.getFollows(publicationId, startStr, endStr);
      break;
    case "tips":
      response = await analyticsAPI.getTips(publicationId, startStr, endStr);
      break;
  }

  return response.data.data;
}

export function useAnalyticsData({
  publicationId,
  metric,
  range,
  customStartDate,
  customEndDate,
}: UseAnalyticsDataParams): AnalyticsData {
  const { start, end } = getDateRange(range, customStartDate, customEndDate);
  const totalDays = differenceInDays(end, start) + 1;

  const query = useQuery({
    queryKey: [
      "analytics",
      publicationId,
      metric,
      format(start, "yyyy-MM-dd"),
      format(end, "yyyy-MM-dd"),
    ],
    queryFn: () => fetchAnalytics(publicationId, metric, start, end),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!publicationId,
  });

  // Transform API response to chart format with formatted dates
  if (query.data) {
    const apiData = query.data;

    // Transform chart data to include rawDate and formatted date labels
    const chartData: ChartDataPoint[] = apiData.chartData.map(
      (point: { date: string; value: number }) => {
        const rawDate = parseISO(point.date);
        return {
          date: formatDateForRange(rawDate, range, totalDays),
          value: point.value,
          rawDate,
        };
      }
    );

    return {
      chartData,
      total: apiData.total,
      previousTotal: apiData.previousTotal,
      percentChange: apiData.percentChange,
      averagePerDay: apiData.averagePerDay,
      isLoading: false,
      error: null,
    };
  }

  // Return loading/error state or empty data
  return {
    chartData: [],
    total: 0,
    previousTotal: 0,
    percentChange: 0,
    averagePerDay: 0,
    isLoading: query.isLoading,
    error: query.error as Error | null,
  };
}
