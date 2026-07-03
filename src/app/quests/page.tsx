'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { useStreakStatus } from '@/hooks/useCheckIn';
import { useXConnection, useConnectX, useDisconnectX } from '@/hooks/useXConnection';
import { useQuests } from '@/hooks/useQuests';
import { useQuestsOverview } from '@/hooks/useQuestsOverview';
import { useUserPoints } from '@/hooks/useUserPoints';
import { TierBadge } from '@/components/gamification/TierBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Flame,
  Sparkles,
  Check,
  ExternalLink,
  LinkIcon,
  Unlink,
  Target,
  Zap,
  Loader2,
  Heart,
  Repeat2,
  Crown,
  Trophy,
  Lock,
  Award,
} from 'lucide-react';
import { FaXTwitter } from 'react-icons/fa6';
import type {
  QuestResponse,
  RecurringQuestItem,
  AchievementQuestItem,
} from '@/lib/api';

const RECURRING_CATEGORY_LABELS: Record<RecurringQuestItem['category'], string> = {
  create: 'Create',
  engage: 'Engage',
  audience: 'From your audience',
  bonus: 'Bonus rewards',
};

function RecurringQuestRow({ item }: { item: RecurringQuestItem }) {
  const capped = item.dailyCap !== null;
  const done = item.doneToday ?? 0;
  const pct =
    capped && item.dailyCap ? Math.min(100, (done / item.dailyCap) * 100) : 0;

  return (
    <div className="relative border rounded-xl p-4 bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
      <div className="flex items-start gap-3">
        <div className="size-10 rounded-xl flex items-center justify-center shrink-0 bg-primary/10 text-primary">
          <Zap className="size-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-foreground">{item.title}</h3>
          <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
          {capped ? (
            <div className="mt-2 flex items-center gap-2">
              <div className="h-1.5 flex-1 max-w-35 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${item.capReached ? 'bg-green-400' : 'bg-amber-400'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">
                {item.capReached ? 'Done today' : `${done}/${item.dailyCap} today`}
              </span>
            </div>
          ) : (
            <span className="inline-flex items-center gap-1 mt-2 text-[11px] text-muted-foreground">
              <Repeat2 className="size-3" /> Repeatable
            </span>
          )}
        </div>
        <div className="shrink-0">
          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-bold bg-amber-50 text-amber-700">
            <Zap className="size-3.5" />+{item.xp}
          </div>
        </div>
      </div>
    </div>
  );
}

function AchievementRow({ item }: { item: AchievementQuestItem }) {
  return (
    <div
      className={`relative border rounded-xl p-4 transition-all ${
        item.earned
          ? 'bg-green-50/40 border-green-100'
          : 'bg-white border-gray-100'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${
            item.earned ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
          }`}
        >
          {item.earned ? <Check className="size-4" /> : <Lock className="size-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
            {item.title}
            {item.earned && (
              <span className="text-[10px] font-medium text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full">
                Earned
              </span>
            )}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
        </div>
        <div className="shrink-0">
          <div
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-bold ${
              item.earned ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
            }`}
          >
            <Zap className="size-3.5" />+{item.xp}
          </div>
        </div>
      </div>
    </div>
  );
}

function RecurringQuestsSection() {
  const { data, isLoading } = useQuestsOverview();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-card border rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="size-10 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-56" />
              </div>
              <Skeleton className="h-7 w-12 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const recurring = data?.recurring ?? [];
  if (recurring.length === 0) return null;

  const categories: RecurringQuestItem['category'][] = [
    'create',
    'engage',
    'audience',
    'bonus',
  ];

  return (
    <div className="space-y-5">
      {categories.map((cat) => {
        const items = recurring.filter((r) => r.category === cat);
        if (items.length === 0) return null;
        return (
          <div key={cat} className="space-y-2">
            <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium px-1">
              {RECURRING_CATEGORY_LABELS[cat]}
            </h3>
            <div className="space-y-2.5">
              {items.map((item) => (
                <RecurringQuestRow key={item.key} item={item} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AchievementsSection() {
  const { data, isLoading } = useQuestsOverview();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const achievements = data?.achievements ?? [];
  if (achievements.length === 0) {
    return (
      <div className="bg-card border rounded-xl p-8 text-center">
        <p className="text-sm text-muted-foreground">No achievements available yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {achievements.map((item) => (
        <AchievementRow key={item.key} item={item} />
      ))}
    </div>
  );
}

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

function getDayLabel(date: string) {
  return ['S', 'M', 'T', 'W', 'T', 'F', 'S'][new Date(date + 'T12:00:00').getDay()];
}

function DailyStreakSection() {
  const { data: streak, isLoading } = useStreakStatus();

  if (isLoading) {
    return (
      <div className="bg-card border rounded-xl px-3 sm:px-4 py-3 space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-20" />
        </div>
        <div className="flex gap-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="size-8 sm:size-9 rounded-full flex-1" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-14 rounded-lg" />
          <Skeleton className="h-14 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!streak) return null;

  const isActive = streak.currentStreak > 0;
  const last7 = streak.recentDays.slice(0, 7).reverse();
  const nextMilestone = streak.milestones.find((m) => !m.reached);
  const daysToMilestone = nextMilestone
    ? nextMilestone.days - streak.currentStreak
    : 0;

  return (
    <div className="bg-card border rounded-xl px-3 sm:px-4 py-3 space-y-3">
      {/* Hero: Streak count + Daily bonus */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame
            className={`size-5 shrink-0 ${isActive ? 'text-orange-500' : 'text-gray-300'}`}
            fill={isActive ? 'currentColor' : 'none'}
          />
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-xl font-bold tabular-nums leading-none ${
                isActive ? 'text-orange-600' : 'text-gray-400'
              }`}
            >
              {streak.currentStreak}
            </span>
            <span className="text-sm text-muted-foreground leading-none">
              day{streak.currentStreak !== 1 ? 's' : ''} streak
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground leading-none">
            Daily Bonus
          </div>
          <div className="text-sm font-bold text-orange-600 tabular-nums leading-snug">
            +{streak.dailyBonusXp} XP
          </div>
        </div>
      </div>

      {/* 7-day activity dots with XP */}
      <div className="flex items-center gap-1">
        {last7.map((day, i) => {
          const isToday = i === last7.length - 1;
          return (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`size-8 sm:size-9 rounded-full transition-all flex items-center justify-center ${
                  day.active
                    ? isToday
                      ? 'bg-orange-400 ring-2 ring-orange-200/70'
                      : 'bg-orange-400'
                    : isToday
                      ? 'bg-gray-100 ring-2 ring-gray-200'
                      : 'bg-gray-100'
                }`}
              >
                {day.active && (
                  <span className="text-[10px] font-bold text-white leading-none">
                    +{day.bonusAwarded || streak.currentTier.dailyBonus}
                  </span>
                )}
              </div>
              <span
                className={`text-[9px] leading-none ${
                  isToday ? 'font-semibold text-foreground' : 'text-muted-foreground'
                }`}
              >
                {isToday ? 'Today' : getDayLabel(day.date)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Info grid: Next Tier + Next Milestone */}
      <div className="grid grid-cols-2 gap-2">
        {/* Next Tier */}
        {streak.nextTier ? (
          <div className="bg-orange-50/70 rounded-lg px-2.5 py-2">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground leading-none mb-1">
              Next Tier
            </div>
            <div className="text-xs font-semibold text-foreground leading-tight">
              {streak.nextTier.name}
            </div>
            <div className="text-[11px] text-orange-600 leading-snug mt-0.5">
              +{streak.nextTier.dailyBonus} XP/day · {streak.daysUntilNextTier}d left
            </div>
          </div>
        ) : (
          <div className="bg-amber-50/70 rounded-lg px-2.5 py-2">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground leading-none mb-1">
              Current Tier
            </div>
            <div className="text-xs font-semibold text-foreground leading-tight flex items-center gap-1">
              <Crown className="size-3 text-amber-500" />
              {streak.currentTier.name}
            </div>
            <div className="text-[11px] text-amber-600 leading-snug mt-0.5">
              Max tier reached
            </div>
          </div>
        )}

        {/* Next Milestone */}
        {nextMilestone ? (
          <div className="bg-amber-50/70 rounded-lg px-2.5 py-2">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground leading-none mb-1">
              Next Milestone
            </div>
            <div className="text-xs font-semibold text-foreground leading-tight">
              {nextMilestone.label}
            </div>
            <div className="text-[11px] text-amber-600 leading-snug mt-0.5">
              +{nextMilestone.bonusXp} XP one-time · {daysToMilestone}d left
            </div>
          </div>
        ) : (
          <div className="bg-amber-50/70 rounded-lg px-2.5 py-2">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground leading-none mb-1">
              Milestones
            </div>
            <div className="text-xs font-semibold text-foreground leading-tight flex items-center gap-1">
              <Trophy className="size-3 text-amber-500" />
              All complete
            </div>
            <div className="text-[11px] text-amber-600 leading-snug mt-0.5">
              Every milestone claimed
            </div>
          </div>
        )}
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

type QuestTab = 'active' | 'recurring' | 'achievements' | 'completed';

export default function QuestsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { data: quests, isLoading: questsLoading } = useQuests();
  const { data: overview } = useQuestsOverview();
  const [tab, setTab] = useState<QuestTab>('active');

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

  const achievements = overview?.achievements ?? [];
  const earnedAchievements = achievements.filter((a) => a.earned).length;

  const tabs: {
    id: QuestTab;
    label: string;
    icon: typeof Target;
    badge: string | null;
  }[] = [
    {
      id: 'active',
      label: 'Active',
      icon: Target,
      badge: activeQuests.length > 0 ? String(activeQuests.length) : null,
    },
    { id: 'recurring', label: 'Recurring', icon: Repeat2, badge: null },
    {
      id: 'achievements',
      label: 'Achievements',
      icon: Award,
      badge: achievements.length > 0 ? `${earnedAchievements}/${achievements.length}` : null,
    },
    {
      id: 'completed',
      label: 'Completed',
      icon: Check,
      badge: completedQuests.length > 0 ? String(completedQuests.length) : null,
    },
  ];

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

        <div className="space-y-5">
          {/* Status dashboard — always visible */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <XpSummarySection />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <DailyStreakSection />
          </motion.div>

          {/* Tabs — one list at a time instead of a long scroll */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="flex border-b border-gray-200 overflow-x-auto">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    'relative flex items-center gap-1.5 px-3.5 sm:px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors',
                    tab === t.id
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <t.icon
                    className={cn('size-4', tab === t.id && 'text-primary')}
                  />
                  {t.label}
                  {t.badge && (
                    <span
                      className={cn(
                        'rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums',
                        tab === t.id
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {t.badge}
                    </span>
                  )}
                  {tab === t.id && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-primary" />
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="pt-4"
            >
              {tab === 'active' && (
                <div className="space-y-4">
                  {/* X connection is the prerequisite for X quests — lives with them */}
                  <XConnectionSection />

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
                          transition={{ delay: 0.05 + i * 0.05 }}
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
                        Check the Recurring tab for everyday ways to earn XP
                      </p>
                    </div>
                  )}
                </div>
              )}

              {tab === 'recurring' && <RecurringQuestsSection />}

              {tab === 'achievements' && <AchievementsSection />}

              {tab === 'completed' &&
                (completedQuests.length > 0 ? (
                  <div className="bg-card border rounded-xl overflow-hidden divide-y divide-gray-100">
                    {completedQuests.map((quest, i) => (
                      <motion.div
                        key={quest.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.05 + i * 0.03 }}
                      >
                        <CompletedQuestRow quest={quest} />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-card border rounded-xl p-8 text-center">
                    <div className="size-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                      <Check className="size-7 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Nothing completed yet
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Finish a quest and it lands here
                    </p>
                  </div>
                ))}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
}
