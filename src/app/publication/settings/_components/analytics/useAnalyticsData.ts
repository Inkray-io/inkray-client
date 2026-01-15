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

export type MetricType = "views" | "likes" | "follows" | "tips" | "retention" | "nonFollowers" | "referrers";
export type TimeRange = "7d" | "1m" | "1y" | "all" | "custom";

export interface ChartDataPoint {
  date: string;
  value: number;
  rawDate: Date;
}

// Retention analytics types
export interface RetentionDataPoint {
  cohortDate: string;
  day: number;
  retentionRate: number;
  usersReturned: number;
  cohortSize: number;
}

export interface RetentionData {
  cohorts: RetentionDataPoint[];
  averageRetention: {
    day1: number;
    day7: number;
    day14: number;
    day30: number;
  };
}

// Non-follower views types
export interface NonFollowerData {
  chartData: ChartDataPoint[];
  total: number;
  percentOfTotal: number;
  previousTotal: number;
  percentChange: number;
  averagePerDay: number;
}

// Referrer analytics types
export interface ReferrerBreakdown {
  type: string;
  label: string;
  count: number;
  percentage: number;
}

export interface TopReferrer {
  domain: string;
  count: number;
  percentage: number;
}

export interface ReferrerData {
  breakdown: ReferrerBreakdown[];
  chartData: ChartDataPoint[];
  topReferrers: TopReferrer[];
  total: number;
}

export interface AnalyticsData {
  chartData: ChartDataPoint[];
  total: number;
  previousTotal: number;
  percentChange: number;
  averagePerDay: number;
  isLoading: boolean;
  error: Error | null;
  // Extended data for new analytics types
  retentionData?: RetentionData;
  nonFollowerData?: NonFollowerData;
  referrerData?: ReferrerData;
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
    case "retention":
      response = await analyticsAPI.getRetention(publicationId, startStr, endStr);
      break;
    case "nonFollowers":
      response = await analyticsAPI.getNonFollowerViews(publicationId, startStr, endStr);
      break;
    case "referrers":
      response = await analyticsAPI.getReferrers(publicationId, startStr, endStr);
      break;
  }

  return { data: response.data.data, metric };
}

// Helper to transform chart data
function transformChartData(
  apiChartData: Array<{ date: string; value: number }>,
  range: TimeRange,
  totalDays: number
): ChartDataPoint[] {
  return apiChartData.map((point) => {
    const rawDate = parseISO(point.date);
    return {
      date: formatDateForRange(rawDate, range, totalDays),
      value: point.value,
      rawDate,
    };
  });
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

  // Transform API response based on metric type
  if (query.data) {
    const { data: apiData, metric: responseMetric } = query.data;

    // Handle standard metrics (views, likes, follows, tips)
    if (["views", "likes", "follows", "tips"].includes(responseMetric)) {
      const chartData = transformChartData(apiData.chartData, range, totalDays);

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

    // Handle retention analytics
    if (responseMetric === "retention") {
      return {
        chartData: [],
        total: 0,
        previousTotal: 0,
        percentChange: 0,
        averagePerDay: 0,
        isLoading: false,
        error: null,
        retentionData: {
          cohorts: apiData.cohorts,
          averageRetention: apiData.averageRetention,
        },
      };
    }

    // Handle non-follower views analytics
    if (responseMetric === "nonFollowers") {
      const chartData = transformChartData(apiData.chartData, range, totalDays);

      return {
        chartData: [],
        total: 0,
        previousTotal: 0,
        percentChange: 0,
        averagePerDay: 0,
        isLoading: false,
        error: null,
        nonFollowerData: {
          chartData,
          total: apiData.total,
          percentOfTotal: apiData.percentOfTotal,
          previousTotal: apiData.previousTotal,
          percentChange: apiData.percentChange,
          averagePerDay: apiData.averagePerDay,
        },
      };
    }

    // Handle referrer analytics
    if (responseMetric === "referrers") {
      const chartData = transformChartData(apiData.chartData, range, totalDays);

      return {
        chartData: [],
        total: 0,
        previousTotal: 0,
        percentChange: 0,
        averagePerDay: 0,
        isLoading: false,
        error: null,
        referrerData: {
          breakdown: apiData.breakdown,
          chartData,
          topReferrers: apiData.topReferrers,
          total: apiData.total,
        },
      };
    }
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
