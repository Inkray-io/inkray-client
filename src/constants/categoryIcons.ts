import { IconType } from 'react-icons'
import {
  HiBanknotes,
  HiPuzzlePiece,
  HiCpuChip,
  HiAcademicCap,
  HiChartBar,
  HiNewspaper,
  HiChatBubbleLeftRight,
  HiCodeBracket,
  HiGlobeAlt,
  HiSquares2X2,
} from 'react-icons/hi2'

export interface CategoryIconConfig {
  icon: IconType
  /** Tailwind text color class for the icon */
  color: string
}

/**
 * Maps category slugs to their icon and color.
 * Slugs match the backend seed: defi, nft-gaming, technology, tutorials,
 * analysis, news, opinion, development, sui-ecosystem, other.
 */
export const CATEGORY_ICONS: Record<string, CategoryIconConfig> = {
  'defi': { icon: HiBanknotes, color: 'text-emerald-500' },
  'nft-gaming': { icon: HiPuzzlePiece, color: 'text-purple-500' },
  'technology': { icon: HiCpuChip, color: 'text-sky-500' },
  'tutorials': { icon: HiAcademicCap, color: 'text-blue-500' },
  'analysis': { icon: HiChartBar, color: 'text-amber-500' },
  'news': { icon: HiNewspaper, color: 'text-slate-500' },
  'opinion': { icon: HiChatBubbleLeftRight, color: 'text-rose-500' },
  'development': { icon: HiCodeBracket, color: 'text-indigo-500' },
  'sui-ecosystem': { icon: HiGlobeAlt, color: 'text-cyan-500' },
  'other': { icon: HiSquares2X2, color: 'text-gray-400' },
}

/** Fallback icon/color when a category slug isn't in the map */
export const DEFAULT_CATEGORY_ICON: CategoryIconConfig = {
  icon: HiSquares2X2,
  color: 'text-gray-400',
}

export function getCategoryIcon(slug: string): CategoryIconConfig {
  return CATEGORY_ICONS[slug] || DEFAULT_CATEGORY_ICON
}
