import { useState, useEffect, useCallback, useRef } from 'react';
import { followsAPI } from '@/lib/api';
import { log } from '@/lib/utils/Logger';

type DataType = 'email' | 'wallet';
type DateRange = 'week' | 'month' | 'year' | 'all' | 'custom';

interface UseExportFollowersOptions {
  publicationId: string;
  dataType: DataType;
  dateRange: DateRange;
  customStartDate?: string;
  customEndDate?: string;
}

interface UseExportFollowersReturn {
  // Preview data
  count: number;
  samples: string[];
  isLoadingPreview: boolean;
  previewError: string | null;

  // Export actions
  exportToCsv: () => Promise<void>;
  copyToClipboard: () => Promise<void>;
  isExporting: boolean;
  exportError: string | null;

  // Utility
  clearErrors: () => void;
}

/**
 * Calculate date range from preset
 */
function getDateRangeFromPreset(
  preset: DateRange,
  customStartDate?: string,
  customEndDate?: string
): { fromDate?: string; toDate?: string } {
  if (preset === 'custom') {
    return {
      fromDate: customStartDate || undefined,
      toDate: customEndDate || undefined,
    };
  }

  const now = new Date();
  let fromDate: Date | undefined;

  switch (preset) {
    case 'week':
      fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'year':
      fromDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    case 'all':
      return {};
  }

  return {
    fromDate: fromDate?.toISOString().split('T')[0],
  };
}

/**
 * Hook for exporting publication follower data
 *
 * Provides functionality to:
 * - Fetch preview data (count + masked samples) when filters change
 * - Export full data to CSV
 * - Copy full data to clipboard
 * - Handle loading and error states
 */
export function useExportFollowers({
  publicationId,
  dataType,
  dateRange,
  customStartDate,
  customEndDate,
}: UseExportFollowersOptions): UseExportFollowersReturn {
  // Preview state
  const [count, setCount] = useState(0);
  const [samples, setSamples] = useState<string[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Export state
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Debounce ref
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Fetch preview data from API
   */
  const fetchPreview = useCallback(async () => {
    if (!publicationId) return;

    // For custom range, require both dates
    if (dateRange === 'custom' && (!customStartDate || !customEndDate)) {
      setCount(0);
      setSamples([]);
      return;
    }

    setIsLoadingPreview(true);
    setPreviewError(null);

    try {
      const { fromDate, toDate } = getDateRangeFromPreset(
        dateRange,
        customStartDate,
        customEndDate
      );

      const response = await followsAPI.getExportPreview(publicationId, {
        dataType,
        fromDate,
        toDate,
      });

      if (response.data.success) {
        setCount(response.data.data.count);
        setSamples(response.data.data.samples);
      } else {
        throw new Error(response.data.message || 'Failed to fetch preview');
      }
    } catch (error) {
      log.error('Failed to fetch export preview', error, 'useExportFollowers');

      let errorMessage = 'Failed to fetch preview';
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status: number; data?: { message: string } } };
        if (axiosError.response?.status === 401) {
          errorMessage = 'Please log in to access export features';
        } else if (axiosError.response?.status === 403) {
          errorMessage = 'You must be the publication owner to export data';
        } else if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      setPreviewError(errorMessage);
      setCount(0);
      setSamples([]);
    } finally {
      setIsLoadingPreview(false);
    }
  }, [publicationId, dataType, dateRange, customStartDate, customEndDate]);

  /**
   * Debounced fetch when filters change
   */
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchPreview();
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [fetchPreview]);

  /**
   * Export data to CSV file
   */
  const exportToCsv = useCallback(async () => {
    if (!publicationId || count === 0) return;

    setIsExporting(true);
    setExportError(null);

    try {
      const { fromDate, toDate } = getDateRangeFromPreset(
        dateRange,
        customStartDate,
        customEndDate
      );

      const response = await followsAPI.getExportData(publicationId, {
        dataType,
        fromDate,
        toDate,
      });

      if (response.data.success) {
        const { data: exportData } = response.data.data;

        // Create CSV content
        const header = dataType === 'email' ? 'Email Address' : 'Wallet Address';
        const csvContent = [header, ...exportData].join('\n');

        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `export-${dataType}s-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        log.debug('Successfully exported data', {
          publicationId,
          dataType,
          count: exportData.length,
        }, 'useExportFollowers');
      } else {
        throw new Error(response.data.message || 'Failed to export data');
      }
    } catch (error) {
      log.error('Failed to export data', error, 'useExportFollowers');

      let errorMessage = 'Failed to export data';
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status: number; data?: { message: string } } };
        if (axiosError.response?.status === 401) {
          errorMessage = 'Please log in to export data';
        } else if (axiosError.response?.status === 403) {
          errorMessage = 'You must be the publication owner to export data';
        } else if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      setExportError(errorMessage);
    } finally {
      setIsExporting(false);
    }
  }, [publicationId, count, dataType, dateRange, customStartDate, customEndDate]);

  /**
   * Copy data to clipboard
   */
  const copyToClipboard = useCallback(async () => {
    if (!publicationId || count === 0) return;

    setIsExporting(true);
    setExportError(null);

    try {
      const { fromDate, toDate } = getDateRangeFromPreset(
        dateRange,
        customStartDate,
        customEndDate
      );

      const response = await followsAPI.getExportData(publicationId, {
        dataType,
        fromDate,
        toDate,
      });

      if (response.data.success) {
        const { data: exportData } = response.data.data;

        await navigator.clipboard.writeText(exportData.join('\n'));

        log.debug('Successfully copied data to clipboard', {
          publicationId,
          dataType,
          count: exportData.length,
        }, 'useExportFollowers');
      } else {
        throw new Error(response.data.message || 'Failed to copy data');
      }
    } catch (error) {
      log.error('Failed to copy data to clipboard', error, 'useExportFollowers');

      let errorMessage = 'Failed to copy data';
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status: number; data?: { message: string } } };
        if (axiosError.response?.status === 401) {
          errorMessage = 'Please log in to copy data';
        } else if (axiosError.response?.status === 403) {
          errorMessage = 'You must be the publication owner to copy data';
        } else if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      setExportError(errorMessage);
      throw error; // Re-throw so the component knows it failed
    } finally {
      setIsExporting(false);
    }
  }, [publicationId, count, dataType, dateRange, customStartDate, customEndDate]);

  /**
   * Clear all errors
   */
  const clearErrors = useCallback(() => {
    setPreviewError(null);
    setExportError(null);
  }, []);

  return {
    // Preview data
    count,
    samples,
    isLoadingPreview,
    previewError,

    // Export actions
    exportToCsv,
    copyToClipboard,
    isExporting,
    exportError,

    // Utility
    clearErrors,
  };
}
