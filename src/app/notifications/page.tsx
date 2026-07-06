'use client';

import React, { useEffect, useRef } from 'react';
import { isToday, isYesterday, differenceInCalendarDays } from 'date-fns';
import { HiBell, HiCheck } from 'react-icons/hi2';
import { AppLayout } from '@/components/layout';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useNotificationsFeed } from '@/hooks/useNotificationsFeed';
import { useNotificationsCount } from '@/hooks/useNotificationsCount';
import { useSeenTracking } from '@/hooks/useSeenTracking';
import { NotificationRow } from '@/components/notifications/NotificationRow';
import { notificationsAPI } from '@/lib/api';
import { Notification } from '@/types/notifications';

/** Bucket a notification's date into a display group. */
function groupOf(date: Date): string {
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  if (differenceInCalendarDays(new Date(), date) < 7) return 'This week';
  return 'Earlier';
}

const GROUP_ORDER = ['Today', 'Yesterday', 'This week', 'Earlier'];

function NotificationsPageContent() {
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useNotificationsFeed(true);
  const { count, mutate: mutateCount } = useNotificationsCount();

  const notifications: Notification[] =
    data?.pages.flatMap((p) => p.notifications) ?? [];

  // Smart viewed-tracking against the viewport — rows you actually scroll
  // past (and dwell on) get marked seen; the rest stay unread.
  const { observeRow, isUnread, setAllSeen } = useSeenTracking({
    enabled: true,
    rootRef: null,
  });

  // Infinite scroll sentinel (viewport-rooted)
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!sentinelRef.current) return;
    const sentinel = sentinelRef.current;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '300px' },
    );
    io.observe(sentinel);
    return () => io.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, notifications.length]);

  // Opening a notification counts as reading it
  const handleNavigate = (n: Notification) => {
    if (!n.readAt) {
      notificationsAPI
        .markAsSeen([n.id])
        .then(() => mutateCount())
        .catch(() => {});
    }
  };

  const handleMarkAllRead = async () => {
    await notificationsAPI.markAllAsRead();
    setAllSeen(notifications.map((n) => n.id));
    mutateCount();
  };

  // Group rows by recency bucket, preserving feed order within groups
  const grouped = new Map<string, Notification[]>();
  for (const n of notifications) {
    const g = groupOf(new Date(n.sentAt ?? n.createdAt));
    if (!grouped.has(g)) grouped.set(g, []);
    grouped.get(g)!.push(n);
  }

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10">
            <HiBell className="size-4.5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">
              Notifications
            </h1>
            <p className="text-xs text-muted-foreground">
              {count > 0
                ? `${count} unread`
                : 'You’re all caught up'}
            </p>
          </div>
        </div>
        {count > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            className="gap-1.5 h-8 px-3 text-xs rounded-lg"
          >
            <HiCheck className="size-3.5" />
            Mark all read
          </Button>
        )}
      </div>

      {/* Body */}
      {isLoading ? (
        <div className="bg-white rounded-2xl p-5 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="size-10 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-white rounded-2xl py-16 px-6 text-center">
          <p className="text-sm font-medium text-gray-700 mb-1">
            Couldn&apos;t load notifications
          </p>
          <p className="text-xs text-gray-400">Check your connection and try again.</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-2xl py-20 px-6 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-gray-50">
            <HiBell className="size-7 text-gray-300" />
          </div>
          <p className="text-base font-medium text-gray-800 mb-1">
            No notifications yet
          </p>
          <p className="text-sm text-gray-400 max-w-xs mx-auto">
            When readers like, comment on, or tip your work — or someone joins
            with your invite — it shows up here.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {GROUP_ORDER.filter((g) => grouped.has(g)).map((group) => (
            <section key={group}>
              <h2 className="px-1 mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                {group}
              </h2>
              <div className="bg-white rounded-2xl overflow-hidden divide-y divide-gray-50">
                {grouped.get(group)!.map((n) => (
                  <NotificationRow
                    key={n.id}
                    notification={n}
                    unread={isUnread(n)}
                    observeRow={observeRow}
                    size="md"
                    onNavigate={handleNavigate}
                  />
                ))}
              </div>
            </section>
          ))}

          {/* Infinite scroll tail */}
          <div ref={sentinelRef} />
          {isFetchingNextPage && (
            <div className="flex justify-center py-4">
              <div className="size-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          )}
          {!hasNextPage && notifications.length > 5 && (
            <p className="text-center text-xs text-gray-300 py-2">
              You&apos;re all caught up
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <RequireAuth>
      <AppLayout currentPage="notifications">
        <NotificationsPageContent />
      </AppLayout>
    </RequireAuth>
  );
}
