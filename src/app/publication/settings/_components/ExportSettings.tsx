"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HiEnvelope, HiWallet, HiArrowDownTray, HiClipboard, HiCheckCircle } from "react-icons/hi2";
import { cn } from "@/lib/utils";
import { SettingsSection } from "./SettingsSection";
import { SettingsCard } from "./SettingsCard";
import { SegmentedControl } from "./SegmentedControl";

interface ExportSettingsProps {
  publicationId: string;
}

type DataType = "email" | "wallet";
type DateRange = "week" | "month" | "year" | "all" | "custom";

// Mock data for frontend demonstration
const MOCK_DATA = {
  email: {
    week: { count: 12, samples: ["j***@gmail.com", "s***@outlook.com", "m***@yahoo.com"] },
    month: { count: 45, samples: ["j***@gmail.com", "s***@outlook.com", "m***@yahoo.com"] },
    year: { count: 156, samples: ["j***@gmail.com", "s***@outlook.com", "m***@yahoo.com"] },
    all: { count: 234, samples: ["j***@gmail.com", "s***@outlook.com", "m***@yahoo.com"] },
  },
  wallet: {
    week: { count: 8, samples: ["0x1a2b...c3d4", "0x5e6f...g7h8", "0x9i0j...k1l2"] },
    month: { count: 32, samples: ["0x1a2b...c3d4", "0x5e6f...g7h8", "0x9i0j...k1l2"] },
    year: { count: 98, samples: ["0x1a2b...c3d4", "0x5e6f...g7h8", "0x9i0j...k1l2"] },
    all: { count: 187, samples: ["0x1a2b...c3d4", "0x5e6f...g7h8", "0x9i0j...k1l2"] },
  },
};

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

export function ExportSettings({ publicationId: _publicationId }: ExportSettingsProps) {
  const [dataType, setDataType] = useState<DataType>("email");
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Get mock results based on current selection
  const results = useMemo(() => {
    if (dateRange === "custom") {
      // For custom range, show a mock count based on date difference
      if (customStartDate && customEndDate) {
        const start = new Date(customStartDate);
        const end = new Date(customEndDate);
        const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        const count = Math.max(0, Math.floor(daysDiff * 0.5)); // Rough estimate
        return {
          count,
          samples: MOCK_DATA[dataType].all.samples,
        };
      }
      return { count: 0, samples: [] };
    }
    return MOCK_DATA[dataType][dateRange];
  }, [dataType, dateRange, customStartDate, customEndDate]);

  const handleExport = async () => {
    setExporting(true);

    // Simulate export delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Create mock CSV content
    const header = dataType === "email" ? "Email Address" : "Wallet Address";
    const mockItems = dataType === "email"
      ? ["john@example.com", "sarah@example.com", "mike@example.com"]
      : ["0x1a2b3c4d5e6f7g8h9i0j", "0x2b3c4d5e6f7g8h9i0j1a", "0x3c4d5e6f7g8h9i0j1a2b"];

    const csvContent = [header, ...mockItems].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    // Trigger download
    const link = document.createElement("a");
    link.href = url;
    link.download = `export-${dataType}s-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExporting(false);
  };

  const handleCopyToClipboard = async () => {
    // Mock copy action
    const mockItems = dataType === "email"
      ? ["john@example.com", "sarah@example.com", "mike@example.com"]
      : ["0x1a2b3c4d5e6f7g8h9i0j", "0x2b3c4d5e6f7g8h9i0j1a", "0x3c4d5e6f7g8h9i0j1a2b"];

    await navigator.clipboard.writeText(mockItems.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <SettingsSection
      title="Export Data"
      description="Export follower data from your publication for use in external tools."
    >
      <SettingsCard>
        <div className="space-y-6">
          {/* Data Type Selector */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
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
            <label className="block text-sm font-medium text-foreground mb-3">
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
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Custom Date Range Inputs */}
            {dateRange === "custom" && (
              <div className="mt-4 p-4 bg-muted/30 rounded-lg border border-border">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Results Preview */}
          <div className="bg-muted/30 rounded-lg p-4 border border-border">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Results found</span>
              <Badge variant="secondary" className="font-semibold">
                {results.count} {dataType === "email" ? "emails" : "wallets"}
              </Badge>
            </div>

            {results.count > 0 && (
              <div className="space-y-1">
                {results.samples.slice(0, 3).map((item, index) => (
                  <div
                    key={index}
                    className="text-sm text-muted-foreground font-mono truncate"
                  >
                    {item}
                  </div>
                ))}
                {results.count > 3 && (
                  <div className="text-xs text-muted-foreground pt-1">
                    ...and {results.count - 3} more
                  </div>
                )}
              </div>
            )}

            {results.count === 0 && (
              <p className="text-sm text-muted-foreground">
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
              disabled={results.count === 0 || exporting}
              className="bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
            >
              {exporting ? (
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
              disabled={results.count === 0}
              variant="outline"
            >
              {copied ? (
                <>
                  <HiCheckCircle className="size-4 mr-2 text-green-600" />
                  Copied!
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
      <div className="bg-muted/30 rounded-lg p-4 border border-border">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">Privacy Note:</strong> Exported data should be handled in accordance with your privacy policy.
          Only use subscriber data for purposes your subscribers have consented to.
        </p>
      </div>
    </SettingsSection>
  );
}
