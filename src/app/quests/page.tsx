'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { useCheckInStatus, useCheckIn } from '@/hooks/useCheckIn';
import { useXConnection, useConnectX, useDisconnectX } from '@/hooks/useXConnection';
import { useQuests } from '@/hooks/useQuests';
import { useUserPoints } from '@/hooks/useUserPoints';
import { TierBadge } from '@/components/gamification/TierBadge';
import { StreakCounter } from '@/components/gamification/StreakCounter';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { CONFIG } from '@/lib/config';
import {
  Flame,
  Sparkles,
  Check,
  ExternalLink,
  LinkIcon,
  Unlink,
  Gift,
  Target,
  Zap,
  Loader2,
  Heart,
  Repeat2,
} from 'lucide-react';
import { FaXTwitter } from 'react-icons/fa6';
import type { QuestResponse } from '@/lib/api';

function getQuestIcon(type: string) {
  switch (type) {
    case 'x_like':
      return <Heart className="size-4" />;
    case 'x_retweet':
      return <Repeat2 className="size-4" />;
    default:
      return <Target className="size-4" />;
  }
}

function QuestCard({ quest }: { quest: QuestResponse }) {
  const isXQuest = quest.type.startsWith('x_');
  const postUrl = quest.metadata?.postUrl;

  return (
    <div className="relative border rounded-xl p-4 transition-all bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm">
      <div className="flex items-start gap-3">
        {/* Quest icon */}
        <div
          className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${
            isXQuest ? 'bg-black text-white' : 'bg-primary/10 text-primary'
          }`}
        >
          {getQuestIcon(quest.type)}
        </div>

        {/* Quest info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
            {quest.title}
            {isXQuest && (
              <>
                <span className="text-gray-300">·</span>
                <FaXTwitter className="size-3 text-muted-foreground shrink-0" />
              </>
            )}
          </h3>
          {quest.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {quest.description}
            </p>
          )}

          {/* Action link for X quests */}
          {isXQuest && postUrl && (
            <a
              href={postUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mt-2 font-medium"
            >
              <FaXTwitter className="size-3" />
              Open on X
              <ExternalLink className="size-3" />
            </a>
          )}
        </div>

        {/* XP reward */}
        <div className="shrink-0">
          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-bold bg-amber-50 text-amber-700">
            <Zap className="size-3.5" />
            {quest.xpReward}
          </div>
        </div>
      </div>
    </div>
  );
}

function CompletedQuestRow({ quest }: { quest: QuestResponse }) {
  const isXQuest = quest.type.startsWith('x_');

  return (
    <div className="flex items-center gap-2.5 px-3 sm:px-4 py-2">
      <Check className="size-3.5 text-green-500 shrink-0" />
      <p className="text-sm text-muted-foreground truncate">{quest.title}</p>
      {isXQuest && (
        <>
          <span className="text-gray-300 shrink-0">·</span>
          <FaXTwitter className="size-3 text-muted-foreground shrink-0" />
        </>
      )}
      <div className="flex-1" />
      <span className="text-xs text-muted-foreground tabular-nums shrink-0">
        +{quest.xpReward} XP
      </span>
    </div>
  );
}

function CheckInSection() {
  const { data: status, isLoading } = useCheckInStatus();
  const checkIn = useCheckIn();
  const { toast } = useToast();
  const [justClaimed, setJustClaimed] = useState(false);

  const handleCheckIn = async () => {
    try {
      const result = await checkIn.mutateAsync();
      setJustClaimed(true);
      toast({
        title: 'Points claimed!',
        description: `You earned ${result.totalClaimed} XP${result.streakBonus > 0 ? ` (includes ${result.streakBonus} streak bonus!)` : ''
          }`,
      });
      setTimeout(() => setJustClaimed(false), 3000);
    } catch {
      toast({
        title: 'Check-in failed',
        description: 'Please try again later',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="bg-card border rounded-2xl p-5 space-y-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-4 w-24" />
      </div>
    );
  }

  if (!status) return null;

  return (
    <div className="bg-card border rounded-2xl p-5 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-orange-400/5 to-transparent pointer-events-none rounded-bl-full" />

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Flame className="size-5 text-orange-500" fill="currentColor" />
            <h3 className="font-semibold text-foreground">Daily XP Claim</h3>
          </div>
          <StreakCounter
            currentStreak={status.currentStreak}
            longestStreak={status.longestStreak}
            showLongest
            size="sm"
          />
        </div>

        {status.canClaim ? (
          <>
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/40 rounded-xl p-4 mb-4">
              <p className="text-sm text-amber-800 mb-1">
                Yesterday you earned
              </p>
              <p className="text-2xl font-bold text-amber-700 tabular-nums">
                {status.unclaimedXp} XP
              </p>
              <p className="text-xs text-amber-600 mt-1">
                Claim to add it to your total + get a check-in bonus
              </p>
            </div>

            <AnimatePresence mode="wait">
              {justClaimed ? (
                <motion.div
                  key="success"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="flex items-center justify-center gap-2 py-3 bg-green-100 text-green-700 rounded-xl font-semibold"
                >
                  <Sparkles className="size-5" />
                  Claimed!
                </motion.div>
              ) : (
                <motion.div key="button" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Button
                    onClick={handleCheckIn}
                    disabled={checkIn.isPending}
                    className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-400/20 h-12 text-base font-semibold"
                  >
                    {checkIn.isPending ? (
                      <Loader2 className="size-5 animate-spin" />
                    ) : (
                      <>
                        <Gift className="size-5 mr-2" />
                        Claim Points
                      </>
                    )}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (() => {
          const claimedToday = status.lastCheckIn &&
            new Date(status.lastCheckIn).toDateString() === new Date().toDateString();
          return (
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-center">
              {claimedToday ? (
                <>
                  <Check className="size-6 text-green-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-muted-foreground">
                    Already claimed today
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Come back tomorrow to claim your next reward
                  </p>
                </>
              ) : (
                <>
                  <Flame className="size-6 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-muted-foreground">
                    No activity yesterday
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Earn XP today by engaging with content, then claim it tomorrow
                  </p>
                </>
              )}
            </div>
          );
        })()}

        <p className="text-[11px] text-muted-foreground mt-4">
          Claim daily to earn +5 bonus XP. Build a streak for milestone rewards: 7 days = +20 XP, 30 days = +100 XP.
        </p>
      </div>
    </div>
  );
}

function XConnectionSection() {
  const { data: xStatus, isLoading } = useXConnection();
  const { connect } = useConnectX();
  const disconnectX = useDisconnectX();
  const { toast } = useToast();

  const handleDisconnect = async () => {
    try {
      await disconnectX.mutateAsync();
      toast({ title: 'X account disconnected' });
    } catch {
      toast({
        title: 'Failed to disconnect',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="bg-card border rounded-xl px-3 sm:px-4 py-3 flex items-center gap-3">
        <Skeleton className="h-4 w-24" />
        <div className="flex-1" />
        <Skeleton className="h-7 w-20 rounded-lg" />
      </div>
    );
  }

  if (!xStatus) return null;

  return (
    <div className="bg-card border rounded-xl px-3 sm:px-4 py-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FaXTwitter className="size-5" />
          <h3 className="font-semibold text-foreground">Account</h3>
        </div>
        {xStatus.connected ? (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
              @{xStatus.xUsername}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDisconnect}
              disabled={disconnectX.isPending}
              className="text-muted-foreground hover:text-red-600 gap-1 h-7 px-2 text-xs"
            >
              <Unlink className="size-3" />
              Disconnect
            </Button>
          </div>
        ) : (
          <Button
            onClick={connect}
            size="sm"
            className="bg-gray-900 text-white hover:bg-gray-800 gap-1.5 h-7 px-3 text-xs font-semibold"
          >
            <LinkIcon className="size-3" />
            Connect
          </Button>
        )}
      </div>
      <p className="text-[11px] text-muted-foreground">
        Connect your X account to verify and complete social quests (likes, reposts, follows).
      </p>
    </div>
  );
}

function XpSummarySection() {
  const { data: points, isLoading } = useUserPoints();

  if (isLoading) {
    return (
      <div className="bg-card border rounded-xl px-3 sm:px-4 py-3 flex items-center gap-3">
        <Skeleton className="h-4 w-24" />
        <div className="flex-1" />
        <Skeleton className="h-4 w-16" />
      </div>
    );
  }

  if (!points) return null;

  const progress = points.tier.nextTierXp ? points.tier.progress : 100;

  return (
    <div className="bg-card border rounded-xl px-3 sm:px-4 py-3 space-y-3.5">
      <div className="flex items-center gap-2">
        <Zap className="size-5 text-amber-500" />
        <h3 className="font-semibold text-foreground">Your Progress</h3>
      </div>
      <div className="flex items-center gap-3">
        <TierBadge tier={points.tier.tier} tierName={points.tier.name} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-amber-400"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
        </div>
        <span className="text-sm font-semibold tabular-nums shrink-0">
          {points.totalXp.toLocaleString()}
          <span className="text-xs text-muted-foreground ml-0.5">XP</span>
        </span>
      </div>
    </div>
  );
}

export default function QuestsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { data: quests, isLoading: questsLoading } = useQuests();

  // Auth guard
  if (!authLoading && !isAuthenticated) {
    router.push('/auth');
    return null;
  }

  if (authLoading) {
    return (
      <AppLayout currentPage="quests">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const completedQuests = quests?.filter((q) => q.isCompleted) || [];
  const activeQuests = quests?.filter((q) => !q.isCompleted) || [];

  return (
    <AppLayout currentPage="quests">
      <div className="max-w-3xl pt-2 pb-6 sm:pb-8">
        {/* Header */}
        <motion.div
          className="mb-6 sm:mb-8"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="size-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Target className="size-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Quests</h1>
              <p className="text-sm text-muted-foreground">
                Complete tasks to earn XP and climb the ranks
              </p>
            </div>
          </div>
        </motion.div>

        <div className="space-y-6">
          {/* XP Summary */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <XpSummarySection />
          </motion.div>

          {/* Daily Check-In */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <CheckInSection />
          </motion.div>

          {/* X Connection */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <XConnectionSection />
          </motion.div>

          {/* Active Quests */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Target className="size-4 text-primary" />
              <h2 className="font-semibold text-foreground">
                Active Quests
                {activeQuests.length > 0 && (
                  <span className="text-muted-foreground font-normal ml-1">
                    ({activeQuests.length})
                  </span>
                )}
              </h2>
            </div>

            {questsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-card border rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <Skeleton className="size-10 rounded-xl" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <Skeleton className="h-7 w-14 rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activeQuests.length > 0 ? (
              <div className="space-y-3">
                {activeQuests.map((quest, i) => (
                  <motion.div
                    key={quest.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + i * 0.05 }}
                  >
                    <QuestCard quest={quest} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-card border rounded-xl p-8 text-center">
                <div className="size-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="size-7 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  No active quests right now
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Check back later for new quests
                </p>
              </div>
            )}
          </motion.div>

          {/* Completed Quests */}
          {completedQuests.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Check className="size-4 text-green-500" />
                <h2 className="font-semibold text-foreground">
                  Completed
                  <span className="text-muted-foreground font-normal ml-1">
                    ({completedQuests.length})
                  </span>
                </h2>
              </div>

              <div className="bg-card border rounded-xl overflow-hidden divide-y divide-gray-100">
                {completedQuests.map((quest, i) => (
                  <motion.div
                    key={quest.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.35 + i * 0.03 }}
                  >
                    <CompletedQuestRow quest={quest} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
