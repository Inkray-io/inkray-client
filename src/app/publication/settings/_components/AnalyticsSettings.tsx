"use client";

import { useState, useCallback } from "react";
import { SettingsSection } from "./SettingsSection";
import { SettingsCard } from "./SettingsCard";
import {
  AnalyticsSubTabs,
  TimeRangeSelector,
  DateRangePicker,
  MetricCard,
  AnalyticsChart,
  useAnalyticsData,
  MetricType,
  TimeRange,
} from "./analytics";

interface AnalyticsSettingsProps {
  publicationId: string;
}

export function AnalyticsSettings({ publicationId: _publicationId }: AnalyticsSettingsProps) {
  const [activeMetric, setActiveMetric] = useState<MetricType>("views");
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>();
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();

  const handleRangeChange = useCallback(
    (start: Date | undefined, end: Date | undefined) => {
      setCustomStartDate(start);
      setCustomEndDate(end);
    },
    []
  );

  const analyticsData = useAnalyticsData({
    metric: activeMetric,
    range: timeRange,
    customStartDate,
    customEndDate,
  });

  return (
    <SettingsSection
      title="Analytics"
      description="Track your publication's performance and growth over time."
    >
      {/* Metric Sub-tabs */}
      <AnalyticsSubTabs activeTab={activeMetric} onChange={setActiveMetric} />

      <SettingsCard className="space-y-6">
        {/* Time Range Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
          {timeRange === "custom" && (
            <DateRangePicker
              startDate={customStartDate}
              endDate={customEndDate}
              onRangeChange={handleRangeChange}
            />
          )}
        </div>

        {/* Metric Summary Card */}
        <MetricCard
          metric={activeMetric}
          total={analyticsData.total}
          percentChange={analyticsData.percentChange}
          averagePerDay={analyticsData.averagePerDay}
          range={timeRange}
        />

        {/* Chart */}
        <div className="pt-2">
          <AnalyticsChart
            data={analyticsData.chartData}
            metric={activeMetric}
          />
        </div>
      </SettingsCard>
    </SettingsSection>
  );
}
