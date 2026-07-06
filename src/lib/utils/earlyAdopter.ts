/**
 * Early-adopter window logic.
 *
 * An account (user or publication) counts as an "early adopter" when it was
 * created on or before NEXT_PUBLIC_EARLY_ADOPTER_WEEKS after
 * NEXT_PUBLIC_LAUNCH_DATE.
 *
 * Configure via env vars:
 *   NEXT_PUBLIC_LAUNCH_DATE          ISO date, e.g. "2026-07-01"
 *   NEXT_PUBLIC_EARLY_ADOPTER_WEEKS  number of weeks (defaults to 2)
 *
 * If NEXT_PUBLIC_LAUNCH_DATE is unset or invalid the feature is disabled and
 * isEarlyAdopter() always returns false — so no badge renders until it's set.
 */

const DEFAULT_WEEKS = 2;
const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

function resolveCutoff(): number | null {
  const launchRaw = process.env.NEXT_PUBLIC_LAUNCH_DATE;
  if (!launchRaw) return null;

  const launch = new Date(launchRaw);
  if (Number.isNaN(launch.getTime())) return null;

  const weeks = Number(process.env.NEXT_PUBLIC_EARLY_ADOPTER_WEEKS) || DEFAULT_WEEKS;
  return launch.getTime() + weeks * MS_PER_WEEK;
}

// Resolved once — NEXT_PUBLIC_* vars are inlined at build time.
const CUTOFF = resolveCutoff();

/** Whether the early-adopter window is configured (badge feature is on). */
export const earlyAdopterEnabled = CUTOFF !== null;

/**
 * True when `createdAt` falls within the early-adopter window.
 * Safe on any input — returns false for null/invalid dates or when disabled.
 */
export function isEarlyAdopter(createdAt: string | Date | null | undefined): boolean {
  if (CUTOFF === null || !createdAt) return false;
  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) return false;
  return created <= CUTOFF;
}
