'use client';

import { cn } from '@/lib/utils';

interface TierBadgeProps {
  tier: number;
  tierName: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  /** 'gradient' = bold gradient badge (default); 'soft' = quiet tinted glyph for dense lists */
  tone?: 'gradient' | 'soft';
}

const tierConfig: Record<
  number,
  { gradient: string; glow: string; icon: string; textColor: string }
> = {
  1: {
    gradient: 'from-gray-300 to-gray-400',
    glow: 'shadow-gray-300/40',
    icon: '✦',
    textColor: 'text-gray-500',
  },
  2: {
    gradient: 'from-orange-400 to-amber-500',
    glow: 'shadow-orange-400/40',
    icon: '🔥',
    textColor: 'text-orange-600',
  },
  3: {
    gradient: 'from-red-500 to-rose-600',
    glow: 'shadow-red-500/40',
    icon: '🔥',
    textColor: 'text-red-600',
  },
  4: {
    gradient: 'from-purple-500 to-violet-600',
    glow: 'shadow-purple-500/40',
    icon: '⚡',
    textColor: 'text-purple-600',
  },
  5: {
    gradient: 'from-blue-500 to-cyan-500',
    glow: 'shadow-blue-500/40',
    icon: '💠',
    textColor: 'text-blue-600',
  },
  6: {
    gradient: 'from-yellow-400 via-amber-400 to-yellow-500',
    glow: 'shadow-yellow-400/50',
    icon: '👑',
    textColor: 'text-amber-600',
  },
};

const sizeClasses = {
  xs: { badge: 'size-5 text-[11px]', label: 'text-[11px]', gap: 'gap-1' },
  sm: { badge: 'size-6 text-xs', label: 'text-xs', gap: 'gap-1' },
  md: { badge: 'size-8 text-sm', label: 'text-sm', gap: 'gap-1.5' },
  lg: { badge: 'size-10 text-base', label: 'text-base', gap: 'gap-2' },
};

/** Quiet tinted backgrounds per tier for the `soft` tone (no gradient/shadow). */
const softBg: Record<number, string> = {
  1: 'bg-gray-100',
  2: 'bg-orange-100',
  3: 'bg-red-100',
  4: 'bg-purple-100',
  5: 'bg-blue-100',
  6: 'bg-amber-100',
};

export function TierBadge({
  tier,
  tierName,
  size = 'md',
  showLabel = true,
  tone = 'gradient',
}: TierBadgeProps) {
  const config = tierConfig[tier] || tierConfig[1];
  const sizes = sizeClasses[size];

  return (
    <div className={cn('flex items-center', sizes.gap)}>
      <div
        className={cn(
          'rounded-full flex items-center justify-center shrink-0',
          tone === 'soft'
            ? softBg[tier] || softBg[1]
            : cn('bg-linear-to-br shadow-md', config.gradient, config.glow),
          sizes.badge
        )}
      >
        <span
          className={cn('leading-none', tone === 'gradient' && 'drop-shadow-sm')}
        >
          {config.icon}
        </span>
      </div>
      {showLabel && (
        <span className={cn('font-semibold', config.textColor, sizes.label)}>
          {tierName}
        </span>
      )}
    </div>
  );
}

export { tierConfig };
