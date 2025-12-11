/**
 * Shared follower filter utilities
 * Used by both Export and Airdrop features to keep filtering logic in sync
 */

export type DateRange = 'week' | 'month' | 'year' | 'all' | 'custom';

export const DATE_PRESETS: { id: DateRange; label: string }[] = [
  { id: 'week', label: 'Last Week' },
  { id: 'month', label: 'Last Month' },
  { id: 'year', label: 'Last Year' },
  { id: 'all', label: 'All Time' },
  { id: 'custom', label: 'Custom' },
];

/**
 * Calculate date range from preset
 */
export function getDateRangeFromPreset(
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
