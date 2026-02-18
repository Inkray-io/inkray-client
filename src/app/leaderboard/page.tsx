'use client';

import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLeaderboard, useMyRank } from '@/hooks/useLeaderboard';
import { TierBadge } from '@/components/gamification/TierBadge';
import { XpDisplay } from '@/components/gamification/XpDisplay';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Crown, Medal, Award, Users, ChevronUp } from 'lucide-react';
import type { LeaderboardEntry } from '@/lib/api';

function truncateAddress(address: string) {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function getRankIcon(rank: number) {
  if (rank === 1) return <Crown className="size-5 text-yellow-500" />;
  if (rank === 2) return <Medal className="size-5 text-gray-400" />;
  if (rank === 3) return <Medal className="size-5 text-amber-700" />;
  return null;
}

function getRankStyle(rank: number) {
  if (rank === 1)
    return 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200/60';
  if (rank === 2)
    return 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200/60';
  if (rank === 3)
    return 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200/60';
  return 'bg-white border-gray-100';
}

function LeaderboardRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-gray-50 last:border-0">
      <Skeleton className="h-6 w-8" />
      <Skeleton className="size-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-5 w-16" />
    </div>
  );
}

function LeaderboardRow({
  entry,
  index,
  isCurrentUser,
}: {
  entry: LeaderboardEntry;
  index: number;
  isCurrentUser: boolean;
}) {
  const rankIcon = getRankIcon(entry.rank);
  const isTopThree = entry.rank <= 3;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.05 * Math.min(index, 20), duration: 0.3 }}
      className={`flex items-center gap-3 sm:gap-4 px-3 sm:px-5 py-3 sm:py-4 border rounded-xl transition-all ${
        isCurrentUser
          ? 'bg-primary/5 border-primary/20 ring-1 ring-primary/10'
          : isTopThree
          ? getRankStyle(entry.rank)
          : 'bg-white border-gray-100 hover:border-gray-200'
      }`}
    >
      {/* Rank */}
      <div className="w-8 sm:w-10 flex-shrink-0 text-center">
        {rankIcon ? (
          rankIcon
        ) : (
          <span className="text-sm font-semibold text-muted-foreground tabular-nums">
            {entry.rank}
          </span>
        )}
      </div>

      {/* Avatar */}
      <div className="flex-shrink-0">
        {entry.avatar ? (
          <img
            src={entry.avatar}
            alt=""
            className={`rounded-full object-cover ${
              isTopThree ? 'size-10 sm:size-12 ring-2 ring-offset-1' : 'size-9 sm:size-10'
            } ${
              entry.rank === 1
                ? 'ring-yellow-400'
                : entry.rank === 2
                ? 'ring-gray-300'
                : entry.rank === 3
                ? 'ring-amber-600'
                : ''
            }`}
          />
        ) : (
          <div
            className={`rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center ${
              isTopThree ? 'size-10 sm:size-12' : 'size-9 sm:size-10'
            }`}
          >
            <span className="font-semibold text-primary text-sm">
              {entry.username?.[0]?.toUpperCase() || '?'}
            </span>
          </div>
        )}
      </div>

      {/* User info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p
            className={`font-semibold truncate ${
              isTopThree ? 'text-base' : 'text-sm'
            } ${isCurrentUser ? 'text-primary' : 'text-foreground'}`}
          >
            {entry.username || truncateAddress(entry.publicKey)}
          </p>
          {isCurrentUser && (
            <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full flex-shrink-0">
              You
            </span>
          )}
        </div>
        <div className="mt-0.5">
          <TierBadge tier={entry.tier} tierName={entry.tierName} size="sm" />
        </div>
      </div>

      {/* XP */}
      <div className="text-right flex-shrink-0">
        <p
          className={`font-bold tabular-nums ${
            isTopThree ? 'text-base' : 'text-sm'
          }`}
        >
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

  const isLoading = lbLoading || (isAuthenticated && rankLoading);

  return (
    <AppLayout currentPage="leaderboard">
      <div className="max-w-3xl pt-2 pb-6 sm:pb-8">
        {/* Header */}
        <motion.div
          className="mb-6 sm:mb-8"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="size-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-400/20">
              <Trophy className="size-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Leaderboard</h1>
              <p className="text-sm text-muted-foreground">
                Top contributors on Inkray
              </p>
            </div>
          </div>
        </motion.div>

        {/* Current User's Rank Card */}
        {isAuthenticated && (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {rankLoading ? (
              <div className="bg-card border rounded-2xl p-5 space-y-3">
                <Skeleton className="h-5 w-24" />
                <div className="flex items-center gap-4">
                  <Skeleton className="size-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
            ) : myRank ? (
              <div className="bg-card border rounded-2xl p-5 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/3 to-transparent pointer-events-none" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <ChevronUp className="size-4 text-primary" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Your Position
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center size-14 rounded-2xl bg-primary/10 border border-primary/10">
                      <span className="text-2xl font-bold text-primary tabular-nums">
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
            className="flex items-center gap-2 mb-4 px-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            <Users className="size-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {leaderboard.totalCount.toLocaleString()} participants
            </span>
          </motion.div>
        )}

        {/* Leaderboard List */}
        <div className="space-y-2">
          {isLoading ? (
            <div className="bg-card border rounded-2xl overflow-hidden divide-y divide-gray-50">
              {Array.from({ length: 10 }).map((_, i) => (
                <LeaderboardRowSkeleton key={i} />
              ))}
            </div>
          ) : leaderboard?.entries && leaderboard.entries.length > 0 ? (
            leaderboard.entries.map((entry, index) => (
              <LeaderboardRow
                key={entry.accountId}
                entry={entry}
                index={index}
                isCurrentUser={
                  isAuthenticated && account?.id === entry.accountId
                }
              />
            ))
          ) : (
            <motion.div
              className="bg-card border rounded-2xl p-12 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="size-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Award className="size-8 text-gray-400" />
              </div>
              <p className="text-muted-foreground font-medium mb-1">
                No rankings yet
              </p>
              <p className="text-sm text-muted-foreground">
                Start engaging with content to earn XP and climb the ranks
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
