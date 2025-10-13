/**
 * Constants for the tipping system
 */

/** Conversion constant: 1 SUI = 1,000,000,000 MIST */
export const MIST_PER_SUI = 1000000000;

/** Preset tip amounts in MIST (for UI display) */
export const TIP_AMOUNTS = [
  { label: "0.1 SUI", value: 100000000, display: "0.1" },
  { label: "0.5 SUI", value: 500000000, display: "0.5" },
  { label: "1 SUI", value: 1000000000, display: "1" },
  { label: "5 SUI", value: 5000000000, display: "5" },
] as const;

/** Minimum tip amount in MIST (0.01 SUI) */
export const MIN_TIP_AMOUNT = 10000000;

/** Maximum tip amount in MIST (1000 SUI) */
export const MAX_TIP_AMOUNT = 1000000000000;