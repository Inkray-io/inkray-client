"use client"

import { useRouter } from 'next/navigation';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useLeaderboard, useMyRank } from '@/hooks/useLeaderboard';
import { useSuiNSBatch } from '@/hooks/useSuiNSBatch';
import { useAuth } from '@/contexts/AuthContext';
import { TierBadge } from '@/components/gamification/TierBadge';
import { RankIndicator } from '@/components/gamification/RankIndicator';
import { Skeleton } from '@/components/ui/skeleton';
import { WidgetHeader } from '@/components/widgets/WidgetHeader';
import { ROUTES } from '@/constants/routes';

function shortAddress(address: string) {
  return address.length > 12
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : address;
}

/** One leaderboard line on the shared row grid: rank · name+tier · XP. */
function Row({
  rank,
  name,
  tier,
  tierName,
  totalXp,
  highlight,
  onClick,
}: {
  rank: number;
  name: string;
  tier: number;
  tierName: string;
  totalXp: number;
  highlight?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 text-left rounded-lg px-1.5 py-1 -mx-1.5 transition-colors ${
        highlight ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-gray-50'
      }`}
    >
      <div className="w-5 shrink-0 flex justify-center">
        <RankIndicator rank={rank} />
      </div>
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        <span
          className={`text-sm font-medium truncate ${highlight ? 'text-primary' : 'text-foreground'}`}
        >
          {name}
        </span>
        <span className="shrink-0" title={tierName}>
          <TierBadge
            tier={tier}
            tierName={tierName}
            size="xs"
            tone="soft"
            showLabel={false}
          />
        </span>
      </div>
      <span className="text-gray-500 text-[11px] tabular-nums shrink-0">
        {totalXp.toLocaleString()} XP
      </span>
    </button>
  );
}

export function LeaderboardWidget() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { data, isLoading, error, refetch } = useLeaderboard({ limit: 3 });
  const { data: myRank } = useMyRank();
  const entries = data?.entries ?? [];
  const goToLeaderboard = () => router.push(ROUTES.LEADERBOARD);

  const addresses = entries.map((e) => e.publicKey);
  const { getName } = useSuiNSBatch(addresses, {
    enabled: addresses.length > 0,
  });

  if (isLoading && entries.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-4">
        <WidgetHeader title="Leaderboard" onViewAll={goToLeaderboard} />
        <div className="space-y-1">
          {[1, 2, 3].map((r) => (
            <div key={r} className="flex items-center gap-2.5 py-1">
              <Skeleton className="w-5 h-3.5" />
              <Skeleton className="h-3.5 w-24 flex-1" />
              <Skeleton className="h-3 w-10" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error && entries.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-4">
        <WidgetHeader title="Leaderboard" onViewAll={goToLeaderboard} />
        <div className="text-center py-3 space-y-2">
          <AlertCircle className="w-5 h-5 text-gray-400 mx-auto" />
          <p className="text-xs text-gray-500">Couldn&apos;t load leaderboard</p>
          <button
            onClick={() => refetch()}
            className="text-primary hover:underline text-xs flex items-center gap-1 mx-auto"
          >
            <RefreshCw className="w-3 h-3" />
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-4">
        <WidgetHeader title="Leaderboard" onViewAll={goToLeaderboard} />
        <p className="text-xs text-gray-500 py-2">No rankings yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-4">
      <WidgetHeader title="Leaderboard" onViewAll={goToLeaderboard} />

      <div className="space-y-1">
        {entries.map((entry) => (
          <Row
            key={entry.accountId}
            rank={entry.rank}
            name={
              entry.username ||
              getName(entry.publicKey) ||
              shortAddress(entry.publicKey)
            }
            tier={entry.tier}
            tierName={entry.tierName}
            totalXp={entry.totalXp}
            onClick={() => router.push(ROUTES.PROFILE_WITH_ID(entry.publicKey))}
          />
        ))}
      </div>

      {/* Your standing — same row grid, highlighted */}
      {isAuthenticated && myRank && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          {myRank.rank ? (
            <Row
              rank={myRank.rank}
              name="You"
              tier={myRank.points.tier.tier}
              tierName={myRank.points.tier.name}
              totalXp={myRank.points.totalXp}
              highlight
              onClick={() => router.push(ROUTES.PROFILE)}
            />
          ) : (
            <p className="text-[11px] text-gray-500 px-1.5">
              You&apos;re not ranked yet — earn XP to join.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
