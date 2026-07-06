import { format } from 'date-fns';

/**
 * Format an ISO string / Date as a month + year, e.g. "March 2026".
 * Returns '' for null/undefined/invalid input.
 */
export function formatMonthYear(value: string | Date | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return format(date, 'MMMM yyyy');
}
