'use client';

import { motion } from 'framer-motion';
import { TierBadge, tierConfig } from './TierBadge';
import type { TierInfo } from '@/lib/api';
import { cn } from '@/lib/utils';

interface XpDisplayProps {
  totalXp: number;
  tier: TierInfo;
  compact?: boolean;
}

export function XpDisplay({ totalXp, tier, compact = false }: XpDisplayProps) {
  const config = tierConfig[tier.tier] || tierConfig[1];
  const progress = tier.nextTierXp ? tier.progress : 100;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <TierBadge tier={tier.tier} tierName={tier.name} size="sm" showLabel={false} />
        <span className="text-sm font-bold tabular-nums">
          {totalXp.toLocaleString()} XP
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <TierBadge tier={tier.tier} tierName={tier.name} size="md" />
        <span className="text-lg font-bold tabular-nums tracking-tight">
          {totalXp.toLocaleString()} <span className="text-muted-foreground text-sm font-medium">XP</span>
        </span>
      </div>

      {/* Progress bar to next tier */}
      <div className="space-y-1.5">
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className={cn(
              'h-full rounded-full bg-gradient-to-r',
              config.gradient
            )}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{tier.currentXp.toLocaleString()} XP</span>
          {tier.nextTierXp ? (
            <span>{tier.nextTierXp.toLocaleString()} XP</span>
          ) : (
            <span className="text-amber-600 font-medium">Max tier</span>
          )}
        </div>
      </div>
    </div>
  );
}
