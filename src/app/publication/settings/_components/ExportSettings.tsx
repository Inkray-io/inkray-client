"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HiEnvelope, HiWallet, HiArrowDownTray, HiClipboard, HiCheckCircle, HiExclamationCircle } from "react-icons/hi2";
import { cn } from "@/lib/utils";
import { SettingsSection } from "./SettingsSection";
import { SettingsCard } from "./SettingsCard";
import { SegmentedControl } from "./SegmentedControl";
import { useExportFollowers } from "@/hooks/useExportFollowers";

interface ExportSettingsProps {
  publicationId: string;
}

type DataType = "email" | "wallet";
type DateRange = "week" | "month" | "year" | "all" | "custom";

const DATE_PRESETS: { id: DateRange; label: string }[] = [
  { id: "week", label: "Last Week" },
  { id: "month", label: "Last Month" },
  { id: "year", label: "Last Year" },
  { id: "all", label: "All Time" },
  { id: "custom", label: "Custom" },
];

const DATA_TYPE_OPTIONS = [
  { id: "email", label: "Email Addresses", icon: HiEnvelope },
  { id: "wallet", label: "Wallet Addresses", icon: HiWallet },
];

export function ExportSettings({ publicationId }: ExportSettingsProps) {
  const [dataType, setDataType] = useState<DataType>("email");
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [copied, setCopied] = useState(false);

  // Use the export hook for real API data
  const {
    count,
    samples,
    isLoadingPreview,
    previewError,
    exportToCsv,
    copyToClipboard,
    isExporting,
    exportError,
  } = useExportFollowers({
    publicationId,
    dataType,
    dateRange,
    customStartDate,
    customEndDate,
  });

  const handleExport = async () => {
    await exportToCsv();
  };

  const handleCopyToClipboard = async () => {
    try {
      await copyToClipboard();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Error is handled by the hook
    }
  };

  const error = previewError || exportError;

  return (
    <SettingsSection
      title="Export Data"
      description="Export follower data from your publication for use in external tools."
    >
      <SettingsCard>
        <div className="space-y-6">
          {/* Data Type Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">
              Data Type
            </label>
            <SegmentedControl
              options={DATA_TYPE_OPTIONS}
              value={dataType}
              onChange={(value) => setDataType(value as DataType)}
              className="w-full sm:w-auto"
            />
          </div>

          {/* Date Range Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">
              Subscribed Within
            </label>
            <div className="flex flex-wrap gap-2">
              {DATE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setDateRange(preset.id)}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-full transition-all",
                    dateRange === preset.id
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-500 hover:text-gray-900 hover:bg-gray-200"
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Custom Date Range Inputs */}
            {dateRange === "custom" && (
              <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <HiExclamationCircle className="size-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">Error</p>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Results Preview */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">Results found</span>
              {isLoadingPreview ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                  <span className="text-sm text-gray-500">Loading...</span>
                </div>
              ) : (
                <Badge variant="secondary" className="font-semibold">
                  {count} {dataType === "email" ? "emails" : "wallets"}
                </Badge>
              )}
            </div>

            {!isLoadingPreview && count > 0 && (
              <div className="space-y-1">
                {samples.slice(0, 3).map((item, index) => (
                  <div
                    key={index}
                    className="text-sm text-gray-500 font-mono truncate"
                  >
                    {item}
                  </div>
                ))}
                {count > 3 && (
                  <div className="text-xs text-gray-500 pt-1">
                    ...and {count - 3} more
                  </div>
                )}
              </div>
            )}

            {!isLoadingPreview && count === 0 && !error && (
              <p className="text-sm text-gray-500">
                {dateRange === "custom" && (!customStartDate || !customEndDate)
                  ? "Select a date range to see results"
                  : "No results found for the selected criteria"
                }
              </p>
            )}
          </div>

          {/* Export Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              onClick={handleExport}
              disabled={count === 0 || isExporting || isLoadingPreview}
              className="bg-primary hover:bg-primary/90 text-white disabled:opacity-50"
            >
              {isExporting && !copied ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  Exporting...
                </>
              ) : (
                <>
                  <HiArrowDownTray className="size-4 mr-2" />
                  Export as CSV
                </>
              )}
            </Button>
            <Button
              onClick={handleCopyToClipboard}
              disabled={count === 0 || isExporting || isLoadingPreview}
              variant="outline"
            >
              {copied ? (
                <>
                  <HiCheckCircle className="size-4 mr-2 text-green-600" />
                  Copied!
                </>
              ) : isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  Copying...
                </>
              ) : (
                <>
                  <HiClipboard className="size-4 mr-2" />
                  Copy to Clipboard
                </>
              )}
            </Button>
          </div>
        </div>
      </SettingsCard>

      {/* Privacy Note */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
        <p className="text-sm text-gray-500">
          <strong className="text-gray-900">Privacy Note:</strong> Exported data should be handled in accordance with your privacy policy.
          Only use subscriber data for purposes your subscribers have consented to.
        </p>
      </div>
    </SettingsSection>
  );
}
