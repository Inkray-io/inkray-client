'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { HiBell, HiArrowRight } from 'react-icons/hi2';
import { useNotificationsCount } from '@/hooks/useNotificationsCount';
import { useNotificationsFeed } from '@/hooks/useNotificationsFeed';
import { useSeenTracking } from '@/hooks/useSeenTracking';
import { NotificationRow } from '@/components/notifications/NotificationRow';
import { notificationsAPI } from '@/lib/api';
import { Notification } from '@/types/notifications';

export default function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const { count, isLoading: countLoading, mutate: mutateCount } = useNotificationsCount();
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useNotificationsFeed(open);

  const notifications: Notification[] =
    data?.pages.flatMap((p) => p.notifications) ?? [];

  // Smart viewed-tracking rooted in the scroll panel
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const { observeRow, isUnread, setAllSeen } = useSeenTracking({
    enabled: open,
    rootRef: scrollRef,
  });

  // Infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!open || !sentinelRef.current) return;
    const sentinel = sentinelRef.current;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { root: scrollRef.current, rootMargin: '120px' },
    );
    io.observe(sentinel);
    return () => io.disconnect();
  }, [open, hasNextPage, isFetchingNextPage, fetchNextPage, notifications.length]);

  const handleOpen = () => {
    setOpen((prev) => !prev);
    if (!open) refetch();
  };

  // Opening a notification counts as reading it — mark it seen and close
  const handleNavigate = (n: Notification) => {
    setOpen(false);
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

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="size-10 relative"
        onClick={handleOpen}
        aria-label={count > 0 ? `Notifications (${count} unread)` : 'Notifications'}
      >
        <HiBell className="size-6" />
        {count > 0 && !countLoading && (
          <span
            className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold rounded-full px-1 min-w-4 h-4 flex items-center justify-center shadow"
            data-testid="notifications-count"
          >
            {count > 9 ? '9+' : count}
          </span>
        )}
      </Button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />

          {/* Panel */}
          <div className="absolute right-0 top-full mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white border border-gray-200 rounded-2xl shadow-lg z-20 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
              {count > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Scrollable list */}
            <div ref={scrollRef} className="max-h-104 overflow-y-auto overscroll-contain">
              {isLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Skeleton className="size-9 rounded-full shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3.5 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                  <div className="size-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                    <HiBell className="size-6 text-gray-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-700 mb-0.5">No notifications yet</p>
                  <p className="text-xs text-gray-400">
                    Likes, comments, tips, and new followers show up here.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {notifications.map((n) => (
                    <NotificationRow
                      key={n.id}
                      notification={n}
                      unread={isUnread(n)}
                      observeRow={observeRow}
                      size="sm"
                      onNavigate={handleNavigate}
                    />
                  ))}

                  {/* Infinite scroll sentinel + loading tail */}
                  <div ref={sentinelRef} />
                  {isFetchingNextPage && (
                    <div className="flex justify-center py-3">
                      <div className="size-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    </div>
                  )}
                  {!hasNextPage && notifications.length > 6 && (
                    <p className="text-center text-[11px] text-gray-300 py-3">
                      You&apos;re all caught up
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Footer — the door to the big page */}
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 border-t border-gray-100 text-sm font-medium text-primary hover:bg-gray-50 transition-colors"
            >
              View all notifications
              <HiArrowRight className="size-3.5" />
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
