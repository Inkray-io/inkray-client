'use client';

import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLeaderboard, useMyRank } from '@/hooks/useLeaderboard';
import { TierBadge } from '@/components/gamification/TierBadge';
import { XpDisplay } from '@/components/gamification/XpDisplay';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Crown, Medal, Award, Users, ChevronUp } from 'lucide-react';
import { useSuiNSBatch } from '@/hooks/useSuiNSBatch';
import type { LeaderboardEntry } from '@/lib/api';

function truncateAddress(address: string) {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function getRankIcon(rank: number) {
  if (rank === 1) return <Crown className="size-4 text-yellow-500" />;
  if (rank === 2) return <Medal className="size-4 text-gray-400" />;
  if (rank === 3) return <Medal className="size-4 text-amber-700" />;
  return null;
}

function LeaderboardRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-3 sm:px-4 py-2.5">
      <Skeleton className="h-4 w-6" />
      <Skeleton className="h-3.5 w-24" />
      <div className="flex-1" />
      <Skeleton className="h-4 w-14" />
    </div>
  );
}

function LeaderboardRow({
  entry,
  index,
  isCurrentUser,
  suiNSName,
}: {
  entry: LeaderboardEntry;
  index: number;
  isCurrentUser: boolean;
  suiNSName?: string | null;
}) {
  const rankIcon = getRankIcon(entry.rank);
  const isTopThree = entry.rank <= 3;
  const displayName = entry.username || suiNSName || truncateAddress(entry.publicKey);

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.03 * Math.min(index, 20), duration: 0.25 }}
      className={`flex items-center gap-3 px-3 sm:px-4 py-2.5 transition-colors ${
        isCurrentUser
          ? 'bg-primary/5'
          : isTopThree
          ? entry.rank === 1
            ? 'bg-amber-50/60'
            : entry.rank === 2
            ? 'bg-gray-50/60'
            : 'bg-orange-50/40'
          : 'hover:bg-gray-50/50'
      }`}
    >
      {/* Rank */}
      <div className="w-7 shrink-0 text-center">
        {rankIcon ? (
          rankIcon
        ) : (
          <span className="text-xs font-semibold text-muted-foreground tabular-nums">
            {entry.rank}
          </span>
        )}
      </div>

      {/* Name + tier */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <p
          className={`text-sm font-medium truncate ${
            isCurrentUser ? 'text-primary' : 'text-foreground'
          }`}
        >
          {displayName}
        </p>
        {isCurrentUser && (
          <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full shrink-0">
            You
          </span>
        )}
        <span className="text-gray-300 shrink-0">·</span>
        <TierBadge tier={entry.tier} tierName={entry.tierName} size="sm" />
      </div>

      {/* XP */}
      <div className="shrink-0 flex items-center gap-1">
        <p className="text-sm font-semibold tabular-nums">
          {entry.totalXp.toLocaleString()}
        </p>
        <p className="text-xs text-muted-foreground">XP</p>
      </div>
    </motion.div>
  );
}

export default function LeaderboardPage() {
  const { isAuthenticated, account } = useAuth();
  const { data: leaderboard, isLoading: lbLoading } = useLeaderboard({
    limit: 50,
  });
  const { data: myRank, isLoading: rankLoading } = useMyRank();

  // Resolve SuiNS names for all leaderboard addresses
  const addresses = leaderboard?.entries
    .filter((e) => !e.username)
    .map((e) => e.publicKey) ?? [];
  const { getName } = useSuiNSBatch(addresses, { enabled: addresses.length > 0 });

  const isLoading = lbLoading || (isAuthenticated && rankLoading);

  return (
    <AppLayout currentPage="leaderboard">
      <div className="max-w-3xl pt-2 pb-6 sm:pb-8">
        {/* Header */}
        <motion.div
          className="mb-5 sm:mb-6"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-1">
            <div className="size-9 rounded-xl bg-linear-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md shadow-orange-400/20">
              <Trophy className="size-4.5 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Leaderboard</h1>
              <p className="text-xs text-muted-foreground">
                Top contributors on Inkray
              </p>
            </div>
          </div>
        </motion.div>

        {/* Current User's Rank Card */}
        {isAuthenticated && (
          <motion.div
            className="mb-5"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {rankLoading ? (
              <div className="bg-card border rounded-xl p-4 space-y-2.5">
                <Skeleton className="h-4 w-20" />
                <div className="flex items-center gap-3">
                  <Skeleton className="size-10 rounded-xl" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-28" />
                    <Skeleton className="h-2.5 w-full rounded-full" />
                  </div>
                </div>
              </div>
            ) : myRank ? (
              <div className="bg-card border rounded-xl p-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-linear-to-r from-primary/3 to-transparent pointer-events-none" />
                <div className="relative">
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <ChevronUp className="size-3.5 text-primary" />
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                      Your Position
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center size-10 rounded-xl bg-primary/10 border border-primary/10">
                      <span className="text-lg font-bold text-primary tabular-nums">
                        {myRank.rank ? `#${myRank.rank}` : '—'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <XpDisplay
                        totalXp={myRank.points.totalXp}
                        tier={myRank.points.tier}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </motion.div>
        )}

        {/* Leaderboard Stats */}
        {leaderboard && (
          <motion.div
            className="flex items-center gap-1.5 mb-3 px-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            <Users className="size-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {leaderboard.totalCount.toLocaleString()} participants
            </span>
          </motion.div>
        )}

        {/* Leaderboard List */}
        {isLoading ? (
          <div className="bg-card border rounded-xl overflow-hidden divide-y divide-gray-100">
            {Array.from({ length: 10 }).map((_, i) => (
              <LeaderboardRowSkeleton key={i} />
            ))}
          </div>
        ) : leaderboard?.entries && leaderboard.entries.length > 0 ? (
          <div className="bg-card border rounded-xl overflow-hidden divide-y divide-gray-100">
            {leaderboard.entries.map((entry, index) => (
              <LeaderboardRow
                key={entry.accountId}
                entry={entry}
                index={index}
                isCurrentUser={
                  isAuthenticated && account?.id === entry.accountId
                }
                suiNSName={getName(entry.publicKey)}
              />
            ))}
          </div>
        ) : (
          <motion.div
            className="bg-card border rounded-xl p-10 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="size-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <Award className="size-6 text-gray-400" />
            </div>
            <p className="text-sm text-muted-foreground font-medium mb-1">
              No rankings yet
            </p>
            <p className="text-xs text-muted-foreground">
              Start engaging with content to earn XP and climb the ranks
            </p>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
