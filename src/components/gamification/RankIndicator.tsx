import { Crown, Medal } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Shared leaderboard rank indicator: crown for #1, medals for #2/#3, and a
 * plain number otherwise. Used by both the sidebar widget and the full
 * leaderboard page so ranks read the same everywhere.
 */
export function RankIndicator({
  rank,
  className,
}: {
  rank: number;
  className?: string;
}) {
  if (rank === 1) return <Crown className={cn('size-4 text-yellow-500', className)} />;
  if (rank === 2) return <Medal className={cn('size-4 text-gray-400', className)} />;
  if (rank === 3) return <Medal className={cn('size-4 text-amber-700', className)} />;
  return (
    <span
      className={cn(
        'text-xs font-semibold text-muted-foreground tabular-nums',
        className,
      )}
    >
      {rank}
    </span>
  );
}
