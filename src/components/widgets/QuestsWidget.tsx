"use client"

import { useRouter } from 'next/navigation';
import { Zap, Flame } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useStreakStatus } from '@/hooks/useCheckIn';
import { useQuests } from '@/hooks/useQuests';
import { useQuestsOverview } from '@/hooks/useQuestsOverview';
import { Skeleton } from '@/components/ui/skeleton';
import { WidgetHeader } from '@/components/widgets/WidgetHeader';
import { ROUTES } from '@/constants/routes';

export function QuestsWidget() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { data: streak } = useStreakStatus();
  const { data: quests } = useQuests();
  const { data: overview, isLoading } = useQuestsOverview();
  const goToQuests = () => router.push(ROUTES.QUESTS);

  if (!isAuthenticated) {
    return (
      <div className="bg-white rounded-2xl p-4">
        <WidgetHeader title="Quests" onViewAll={goToQuests} />
        <p className="text-xs text-gray-500">
          Earn XP and build a daily streak as you read and write.
        </p>
      </div>
    );
  }

  if (isLoading && !overview) {
    return (
      <div className="bg-white rounded-2xl p-4">
        <WidgetHeader title="Quests" onViewAll={goToQuests} />
        <Skeleton className="h-9 w-full rounded-lg" />
        <div className="mt-2 space-y-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2.5 py-1">
              <Skeleton className="w-5 h-4" />
              <Skeleton className="h-3.5 flex-1" />
              <Skeleton className="h-3 w-8" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Up to 3 pending quests: real active (uncompleted) quests first, then fill
  // with doable base quests (not capped today, preferring create/engage).
  const activeQuests = (quests ?? [])
    .filter((q) => !q.isCompleted)
    .map((q) => ({ key: q.id, title: q.title, xp: q.xpReward }));
  const baseQuests = (overview?.recurring ?? [])
    .filter((q) => !q.capReached)
    .sort((a, b) => {
      const rank = (c: string) => (c === 'create' ? 0 : c === 'engage' ? 1 : 2);
      return rank(a.category) - rank(b.category);
    })
    .map((q) => ({ key: q.key, title: q.title, xp: q.xp }));
  const teasers = [...activeQuests, ...baseQuests].slice(0, 3);

  const streakActive = (streak?.currentStreak ?? 0) > 0;

  return (
    <div className="bg-white rounded-2xl p-4">
      <WidgetHeader title="Quests" onViewAll={goToQuests} />

      {/* Streak — the card's status banner */}
      {streak && (
        <div className="flex items-center gap-2 bg-orange-50 rounded-lg px-2.5 py-2 mb-1">
          <Flame
            className={`size-4 shrink-0 ${streakActive ? 'text-orange-500' : 'text-gray-300'}`}
            fill={streakActive ? 'currentColor' : 'none'}
          />
          <span className="flex-1 min-w-0 text-xs font-medium text-foreground">
            {streakActive
              ? `${streak.currentStreak}-day streak`
              : 'Start a streak today'}
          </span>
          <span className="text-[11px] font-semibold text-orange-600 tabular-nums shrink-0">
            +{streak.dailyBonusXp}/day
          </span>
        </div>
      )}

      {/* Quest teasers — shared row grid: lead · task · reward */}
      {teasers.length > 0 && (
        <div className="space-y-1">
          {teasers.map((quest) => (
            <button
              key={quest.key}
              onClick={goToQuests}
              className="w-full flex items-center gap-2.5 text-left rounded-lg px-1.5 py-1 -mx-1.5 hover:bg-gray-50 transition-colors"
            >
              <div className="w-5 shrink-0 flex justify-center">
                <Zap className="size-3.5 text-gray-400" />
              </div>
              <span className="flex-1 min-w-0 text-sm font-medium text-foreground truncate">
                {quest.title}
              </span>
              <span className="text-amber-600 text-[11px] font-semibold tabular-nums shrink-0">
                +{quest.xp}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
