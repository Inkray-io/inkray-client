"use client";

import { useState, useCallback, useMemo } from "react";
import { SettingsSection } from "./SettingsSection";
import { SettingsCard } from "./SettingsCard";
import {
  AnalyticsSubTabs,
  TimeRangeSelector,
  DateRangePicker,
  MetricCard,
  AnalyticsChart,
  RetentionMetricCard,
  RetentionChart,
  NonFollowerMetricCard,
  ReferrerChart,
  ReferrerMetricCard,
  useAnalyticsData,
  MetricType,
  TimeRange,
} from "./analytics";

interface AnalyticsSettingsProps {
  publicationId: string;
}

export function AnalyticsSettings({ publicationId }: AnalyticsSettingsProps) {
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
    publicationId,
    metric: activeMetric,
    range: timeRange,
    customStartDate,
    customEndDate,
  });

  // Determine which type of content to render
  const isStandardMetric = useMemo(
    () => ["views", "likes", "follows", "tips"].includes(activeMetric),
    [activeMetric]
  );

  // Render loading skeleton
  const renderLoading = () => (
    <div className="animate-pulse space-y-4">
      <div className="h-32 bg-gray-100 rounded-xl" />
      <div className="h-64 bg-gray-100 rounded-xl" />
    </div>
  );

  // Render standard metrics (views, likes, follows, tips)
  const renderStandardMetric = () => (
    <>
      <MetricCard
        metric={activeMetric}
        total={analyticsData.total}
        percentChange={analyticsData.percentChange}
        averagePerDay={analyticsData.averagePerDay}
        range={timeRange}
      />
      <div className="pt-2">
        <AnalyticsChart data={analyticsData.chartData} metric={activeMetric} />
      </div>
    </>
  );

  // Render retention analytics
  const renderRetention = () => {
    if (!analyticsData.retentionData) {
      return (
        <div className="flex items-center justify-center h-64 rounded-xl bg-gray-50 border border-dashed border-gray-200">
          <p className="text-gray-500 text-sm">No retention data available</p>
        </div>
      );
    }

    return (
      <>
        <RetentionMetricCard data={analyticsData.retentionData} />
        <div className="pt-4">
          <h4 className="text-sm font-medium text-gray-500 mb-3">
            Retention Curve
          </h4>
          <RetentionChart data={analyticsData.retentionData.cohorts} />
        </div>
      </>
    );
  };

  // Render non-follower views analytics
  const renderNonFollowerViews = () => {
    if (!analyticsData.nonFollowerData) {
      return (
        <div className="flex items-center justify-center h-64 rounded-xl bg-gray-50 border border-dashed border-gray-200">
          <p className="text-gray-500 text-sm">No discovery data available</p>
        </div>
      );
    }

    return (
      <>
        <NonFollowerMetricCard
          data={analyticsData.nonFollowerData}
          range={timeRange}
        />
        <div className="pt-4">
          <h4 className="text-sm font-medium text-gray-500 mb-3">
            Discovery Views Over Time
          </h4>
          <AnalyticsChart
            data={analyticsData.nonFollowerData.chartData}
            metric="views"
          />
        </div>
      </>
    );
  };

  // Render referrer analytics
  const renderReferrers = () => {
    if (!analyticsData.referrerData) {
      return (
        <div className="flex items-center justify-center h-64 rounded-xl bg-gray-50 border border-dashed border-gray-200">
          <p className="text-gray-500 text-sm">No referrer data available</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <ReferrerChart data={analyticsData.referrerData.breakdown} />
        <ReferrerMetricCard
          topReferrers={analyticsData.referrerData.topReferrers}
          total={analyticsData.referrerData.total}
        />
      </div>
    );
  };

  // Main content renderer
  const renderContent = () => {
    if (analyticsData.isLoading) {
      return renderLoading();
    }

    if (isStandardMetric) {
      return renderStandardMetric();
    }

    switch (activeMetric) {
      case "retention":
        return renderRetention();
      case "nonFollowers":
        return renderNonFollowerViews();
      case "referrers":
        return renderReferrers();
      default:
        return null;
    }
  };

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

        {/* Dynamic Content based on active metric */}
        {renderContent()}
      </SettingsCard>
    </SettingsSection>
  );
}
