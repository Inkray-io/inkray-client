'use client';

import { useMemo } from 'react';
import { useXpHistory } from '@/hooks/useXpHistory';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import type { XpEventEntry } from '@/lib/api';
import {
  Zap,
  PenSquare,
  Heart,
  Bookmark,
  MessageCircle,
  UserPlus,
  Users,
  Flame,
  Trophy,
  Target,
  Coins,
  Ticket,
  Sparkles,
  BadgeCheck,
  Loader2,
  History,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface ActionDisplay {
  label: (e: XpEventEntry) => string;
  icon: LucideIcon;
  tint: string; // tailwind classes for the icon chip
}

const ACTION_DISPLAY: Record<string, ActionDisplay> = {
  article_published: {
    label: () => 'Published an article',
    icon: PenSquare,
    tint: 'bg-primary/10 text-primary',
  },
  article_published_long: {
    label: () => 'Published a long article',
    icon: PenSquare,
    tint: 'bg-primary/10 text-primary',
  },
  first_article: {
    label: () => 'Achievement — first article',
    icon: Trophy,
    tint: 'bg-amber-50 text-amber-600',
  },
  article_10_likes: {
    label: () => 'Your article reached 10 likes',
    icon: Heart,
    tint: 'bg-rose-50 text-rose-500',
  },
  article_50_likes: {
    label: () => 'Your article reached 50 likes',
    icon: Heart,
    tint: 'bg-rose-50 text-rose-500',
  },
  comment_written: {
    label: () => 'Wrote a comment',
    icon: MessageCircle,
    tint: 'bg-sky-50 text-sky-600',
  },
  comment_received: {
    label: () => 'Received a comment',
    icon: MessageCircle,
    tint: 'bg-sky-50 text-sky-600',
  },
  followed_publication: {
    label: () => 'Followed a publication',
    icon: UserPlus,
    tint: 'bg-violet-50 text-violet-600',
  },
  received_follower: {
    label: () => 'Gained a follower',
    icon: Users,
    tint: 'bg-violet-50 text-violet-600',
  },
  liked_article: {
    label: () => 'Liked an article',
    icon: Heart,
    tint: 'bg-rose-50 text-rose-500',
  },
  received_like: {
    label: () => 'Received a like',
    icon: Heart,
    tint: 'bg-rose-50 text-rose-500',
  },
  bookmarked_article: {
    label: () => 'Bookmarked an article',
    icon: Bookmark,
    tint: 'bg-amber-50 text-amber-600',
  },
  daily_streak_bonus: {
    label: (e) =>
      e.metadata?.streakDay
        ? `Daily streak bonus — day ${e.metadata.streakDay}`
        : 'Daily streak bonus',
    icon: Flame,
    tint: 'bg-orange-50 text-orange-500',
  },
  streak_bonus: {
    label: (e) =>
      e.metadata?.milestone
        ? `Streak milestone — ${e.metadata.milestone}`
        : 'Streak milestone',
    icon: Flame,
    tint: 'bg-orange-50 text-orange-500',
  },
  profile_complete: {
    label: () => 'Achievement — profile completed',
    icon: BadgeCheck,
    tint: 'bg-green-50 text-green-600',
  },
  x_connected: {
    label: () => 'Achievement — X account connected',
    icon: BadgeCheck,
    tint: 'bg-gray-100 text-gray-700',
  },
  quest_completed: {
    label: (e) =>
      e.metadata?.questTitle
        ? `Quest — ${e.metadata.questTitle}`
        : 'Quest completed',
    icon: Target,
    tint: 'bg-purple-50 text-purple-600',
  },
  invite_accepted: {
    label: () => 'Someone joined with your invite',
    icon: Ticket,
    tint: 'bg-teal-50 text-teal-600',
  },
  referred_user_first_article: {
    label: () => 'Your invitee published their first article',
    icon: Ticket,
    tint: 'bg-teal-50 text-teal-600',
  },
  admin_grant: {
    label: () => 'Bonus grant',
    icon: Sparkles,
    tint: 'bg-amber-50 text-amber-600',
  },
  first_like: {
    label: () => 'Achievement — first like',
    icon: Trophy,
    tint: 'bg-amber-50 text-amber-600',
  },
  first_comment: {
    label: () => 'Achievement — first comment',
    icon: Trophy,
    tint: 'bg-amber-50 text-amber-600',
  },
  first_follow: {
    label: () => 'Achievement — first follow',
    icon: Trophy,
    tint: 'bg-amber-50 text-amber-600',
  },
  first_tip: {
    label: () => 'Achievement — first tip',
    icon: Coins,
    tint: 'bg-amber-50 text-amber-600',
  },
  first_invite_redeemed: {
    label: () => 'Achievement — brought a friend',
    icon: Trophy,
    tint: 'bg-amber-50 text-amber-600',
  },
  articles_milestone: {
    label: (e) =>
      e.metadata?.milestone
        ? `Milestone — published ${e.metadata.milestone} articles`
        : 'Article milestone',
    icon: Trophy,
    tint: 'bg-amber-50 text-amber-600',
  },
  followers_milestone: {
    label: (e) =>
      e.metadata?.milestone
        ? `Milestone — reached ${e.metadata.milestone} followers`
        : 'Follower milestone',
    icon: Trophy,
    tint: 'bg-amber-50 text-amber-600',
  },
};

const FALLBACK_DISPLAY: ActionDisplay = {
  label: (e) => e.action.replace(/_/g, ' '),
  icon: Zap,
  tint: 'bg-gray-100 text-gray-600',
};

function dayLabel(date: string): string {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const yesterday = new Date(today.getTime() - 24 * 3600 * 1000)
    .toISOString()
    .slice(0, 10);
  if (date === todayStr) return 'Today';
  if (date === yesterday) return 'Yesterday';
  return new Date(date + 'T12:00:00').toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year:
      date.slice(0, 4) !== todayStr.slice(0, 4) ? 'numeric' : undefined,
  });
}

function timeOf(createdAt: string): string {
  return new Date(createdAt).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function HistoryRow({ event }: { event: XpEventEntry }) {
  const display = ACTION_DISPLAY[event.action] ?? FALLBACK_DISPLAY;
  const Icon = display.icon;

  return (
    <div className="flex items-center gap-3 px-3 sm:px-4 py-2.5">
      <div
        className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${display.tint}`}
      >
        <Icon className="size-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground truncate">
          {display.label(event)}
        </p>
      </div>
      <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">
        {timeOf(event.createdAt)}
      </span>
      <span className="text-sm font-semibold text-amber-600 tabular-nums shrink-0 w-12 text-right">
        +{event.xpAmount}
      </span>
    </div>
  );
}

/**
 * "History" tab — chronological, day-grouped list of every XP event, so
 * users can see exactly where their points came from.
 */
export function XpHistorySection() {
  const {
    data,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useXpHistory();

  const events = useMemo(
    () => data?.pages.flatMap((p) => p.events) ?? [],
    [data],
  );

  // Group by the XP day (events are already newest-first)
  const groups = useMemo(() => {
    const byDay: { date: string; events: XpEventEntry[] }[] = [];
    for (const event of events) {
      const last = byDay[byDay.length - 1];
      if (last && last.date === event.date) {
        last.events.push(event);
      } else {
        byDay.push({ date: event.date, events: [event] });
      }
    }
    return byDay;
  }, [events]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-card border rounded-xl p-3 flex items-center gap-3">
            <Skeleton className="size-8 rounded-lg" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-10" />
          </div>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="bg-card border rounded-xl p-8 text-center">
        <div className="size-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
          <History className="size-7 text-gray-400" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">
          No XP earned yet
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Complete quests and every point you earn will show up here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => {
        const dayTotal = group.events.reduce((sum, e) => sum + e.xpAmount, 0);
        return (
          <div key={group.date} className="space-y-1.5">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                {dayLabel(group.date)}
              </h3>
              <span className="text-[11px] font-semibold text-amber-600 tabular-nums">
                +{dayTotal} XP
              </span>
            </div>
            <div className="bg-card border rounded-xl overflow-hidden divide-y divide-gray-50">
              {group.events.map((event) => (
                <HistoryRow key={event.id} event={event} />
              ))}
            </div>
          </div>
        );
      })}

      {hasNextPage && (
        <div className="flex justify-center pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="gap-2 text-xs"
          >
            {isFetchingNextPage && <Loader2 className="size-3 animate-spin" />}
            Load older activity
          </Button>
        </div>
      )}
    </div>
  );
}
