import { IconType } from 'react-icons'
import {
  HiBanknotes,
  HiCube,
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
}

/**
 * Maps category slugs to their icon. Icons render in a single muted tone
 * (see AppSidebar / MobileMenu) so the list stays calm and consistent with
 * the rest of the sidebar — color is reserved for the active state only.
 * Slugs match the backend seed: defi, nft-gaming, technology, tutorials,
 * analysis, news, opinion, development, sui-ecosystem, other.
 */
export const CATEGORY_ICONS: Record<string, CategoryIconConfig> = {
  'defi': { icon: HiBanknotes },
  'nft-gaming': { icon: HiCube },
  'technology': { icon: HiCpuChip },
  'tutorials': { icon: HiAcademicCap },
  'analysis': { icon: HiChartBar },
  'news': { icon: HiNewspaper },
  'opinion': { icon: HiChatBubbleLeftRight },
  'development': { icon: HiCodeBracket },
  'sui-ecosystem': { icon: HiGlobeAlt },
  'other': { icon: HiSquares2X2 },
}

/** Fallback icon when a category slug isn't in the map */
export const DEFAULT_CATEGORY_ICON: CategoryIconConfig = {
  icon: HiSquares2X2,
}

export function getCategoryIcon(slug: string): CategoryIconConfig {
  return CATEGORY_ICONS[slug] || DEFAULT_CATEGORY_ICON
}
