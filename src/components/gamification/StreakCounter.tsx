'use client';

import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StreakCounterProps {
  currentStreak: number;
  longestStreak: number;
  showLongest?: boolean;
  size?: 'sm' | 'md';
}

export function StreakCounter({
  currentStreak,
  longestStreak,
  showLongest = false,
  size = 'md',
}: StreakCounterProps) {
  const isActive = currentStreak > 0;

  return (
    <div className={cn('flex items-center', size === 'sm' ? 'gap-1' : 'gap-1.5')}>
      <Flame
        className={cn(
          'flex-shrink-0',
          size === 'sm' ? 'size-4' : 'size-5',
          isActive ? 'text-orange-500' : 'text-gray-300'
        )}
        fill={isActive ? 'currentColor' : 'none'}
      />
      <span
        className={cn(
          'font-bold tabular-nums',
          size === 'sm' ? 'text-sm' : 'text-base',
          isActive ? 'text-orange-600' : 'text-gray-400'
        )}
      >
        {currentStreak}
      </span>
      {showLongest && longestStreak > 0 && (
        <span className="text-xs text-muted-foreground ml-1">
          (best: {longestStreak})
        </span>
      )}
    </div>
  );
}
