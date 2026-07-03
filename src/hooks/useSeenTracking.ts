import { useCallback, useEffect, useRef, useState, RefObject } from 'react';
import { notificationsAPI } from '@/lib/api';
import { useNotificationsCount } from '@/hooks/useNotificationsCount';
import { Notification } from '@/types/notifications';

// A row counts as "viewed" after being ≥60% visible for this long.
const VIEW_DWELL_MS = 700;
// Viewed ids are flushed to the API in batches at most this often.
const FLUSH_INTERVAL_MS = 1200;

/**
 * Smart viewed-tracking for notification lists.
 *
 * A row that stays ≥60% visible for VIEW_DWELL_MS inside the scroll root
 * (a panel, or the viewport when `rootRef` is null) is queued; queued ids
 * are batch-flushed to PATCH /notifications/seen, then the unread badge
 * refreshes. Skimming past rows doesn't count.
 */
export function useSeenTracking(options: {
  enabled: boolean;
  /** Scroll container ref, or null to observe against the viewport */
  rootRef: RefObject<HTMLElement | null> | null;
}) {
  const { enabled, rootRef } = options;
  const { mutate: mutateCount } = useNotificationsCount();

  // Ids marked seen locally this session (optimistic, on top of server readAt)
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());

  const observerRef = useRef<IntersectionObserver | null>(null);
  const dwellTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const pendingSeen = useRef<Set<string>>(new Set());
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushSeen = useCallback(async () => {
    if (flushTimer.current) {
      clearTimeout(flushTimer.current);
      flushTimer.current = null;
    }
    const ids = [...pendingSeen.current];
    if (ids.length === 0) return;
    pendingSeen.current.clear();
    setSeenIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
    try {
      await notificationsAPI.markAsSeen(ids);
      mutateCount();
    } catch {
      // Non-fatal — the ids stay optimistically seen locally; the server
      // count self-corrects on the next poll.
    }
  }, [mutateCount]);

  const scheduleFlush = useCallback(() => {
    if (flushTimer.current) return;
    flushTimer.current = setTimeout(() => void flushSeen(), FLUSH_INTERVAL_MS);
  }, [flushSeen]);

  // (Re)create the observer whenever tracking becomes active
  useEffect(() => {
    if (!enabled) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).dataset.notificationId;
          if (!id) continue;
          if (entry.isIntersecting) {
            if (dwellTimers.current.has(id)) continue;
            dwellTimers.current.set(
              id,
              setTimeout(() => {
                dwellTimers.current.delete(id);
                pendingSeen.current.add(id);
                scheduleFlush();
              }, VIEW_DWELL_MS),
            );
          } else {
            const timer = dwellTimers.current.get(id);
            if (timer) {
              clearTimeout(timer);
              dwellTimers.current.delete(id);
            }
          }
        }
      },
      { root: rootRef?.current ?? null, threshold: 0.6 },
    );
    observerRef.current = observer;
    const timers = dwellTimers.current;
    return () => {
      observer.disconnect();
      observerRef.current = null;
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
      void flushSeen();
    };
  }, [enabled, rootRef, scheduleFlush, flushSeen]);

  // Row ref callback — observe unread rows only
  const observeRow = useCallback(
    (el: HTMLElement | null, notification: Notification) => {
      if (!el || notification.readAt || seenIds.has(notification.id)) return;
      el.dataset.notificationId = notification.id;
      observerRef.current?.observe(el);
    },
    [seenIds],
  );

  /** Locally mark a set of ids as seen (after a mark-all-read call). */
  const setAllSeen = useCallback((ids: string[]) => {
    setSeenIds(new Set(ids));
  }, []);

  const isUnread = useCallback(
    (n: Notification) => !n.readAt && !seenIds.has(n.id),
    [seenIds],
  );

  return { observeRow, isUnread, setAllSeen };
}
