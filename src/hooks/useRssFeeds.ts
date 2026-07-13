import { useState, useEffect, useCallback } from 'react';
import {
  rssFeedsAPI,
  RssFeed,
  RssFeedValidationResult,
  RssFeedPreviewResult,
  FieldMappings,
} from '@/lib/api';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Poll a feed's sync history until the run triggered at `triggeredAt` reaches a
 * terminal status (success/partial/failed) — or a safety timeout. Triggering a
 * sync only ENQUEUES the job and returns in ~0.5s, so without this the UI would
 * clear the "Syncing…" state almost immediately while the job runs on for many
 * seconds — the gap that let users click Sync repeatedly and spawn concurrent
 * syncs. Keeping the promise pending here holds the disabled/spinner state for
 * the real job duration.
 */
async function waitForSyncToSettle(
  feedId: string,
  triggeredAt: number,
): Promise<void> {
  const POLL_MS = 2500;
  const MAX_MS = 120_000;
  const deadline = triggeredAt + MAX_MS;
  while (Date.now() < deadline) {
    await sleep(POLL_MS);
    let history: { status: string; startedAt: string }[] | undefined;
    try {
      const res = await rssFeedsAPI.getFeedDetail(feedId);
      history = res.data?.data?.recentSyncHistory;
    } catch {
      continue; // transient error — keep waiting
    }
    if (!history?.length) continue;
    // Latest run by start time (don't assume ordering); ignore runs that started
    // clearly before our trigger (a small skew allowance for clock/enqueue lag).
    const latest = [...history].sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
    )[0];
    if (new Date(latest.startedAt).getTime() < triggeredAt - 5000) continue;
    if (latest.status !== 'in_progress') return; // settled
  }
}

interface UseRssFeedsOptions {
  publicationId: string;
  enabled?: boolean;
}

interface UseRssFeedsReturn {
  feeds: RssFeed[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  addFeed: (data: {
    url: string;
    name?: string;
    autoPublish?: boolean;
    fieldMappings?: FieldMappings;
  }) => Promise<RssFeed | null>;
  updateFeed: (
    feedId: string,
    data: { name?: string; autoPublish?: boolean; status?: 'active' | 'paused' }
  ) => Promise<RssFeed | null>;
  deleteFeed: (feedId: string) => Promise<boolean>;
  triggerSync: (feedId: string) => Promise<boolean>;
  validateFeed: (url: string) => Promise<RssFeedValidationResult | null>;
  previewFeed: (url: string) => Promise<RssFeedPreviewResult | null>;
  isAddingFeed: boolean;
  isSyncing: string | null; // feedId being synced, or null
}

export function useRssFeeds({
  publicationId,
  enabled = true,
}: UseRssFeedsOptions): UseRssFeedsReturn {
  const [feeds, setFeeds] = useState<RssFeed[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingFeed, setIsAddingFeed] = useState(false);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);

  const fetchFeeds = useCallback(async () => {
    if (!publicationId || !enabled) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const response = await rssFeedsAPI.getFeedsByPublication(publicationId);
      if (response.data?.data) {
        setFeeds(response.data.data);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch RSS feeds';
      setError(errorMessage);
      console.error('Failed to fetch RSS feeds:', err);
    } finally {
      setIsLoading(false);
    }
  }, [publicationId, enabled]);

  useEffect(() => {
    fetchFeeds();
  }, [fetchFeeds]);

  const addFeed = useCallback(
    async (data: {
      url: string;
      name?: string;
      autoPublish?: boolean;
      fieldMappings?: FieldMappings;
    }): Promise<RssFeed | null> => {
      if (!publicationId) return null;

      try {
        setIsAddingFeed(true);
        setError(null);
        const response = await rssFeedsAPI.createFeed({
          ...data,
          publicationId,
        });
        if (response.data?.data) {
          const newFeed = response.data.data;
          setFeeds((prev) => [newFeed, ...prev]);
          // Creating a feed kicks off an immediate background sync
          // (feed_created). Reflect that so the Sync button shows "Syncing…"
          // right away instead of inviting a manual click on top of the running
          // auto-sync. Runs in the background so add() still returns promptly.
          const createdAt = Date.now();
          setIsSyncing(newFeed.id);
          void (async () => {
            try {
              await waitForSyncToSettle(newFeed.id, createdAt);
              await fetchFeeds();
            } finally {
              setIsSyncing((cur) => (cur === newFeed.id ? null : cur));
            }
          })();
          return newFeed;
        }
        return null;
      } catch (err: any) {
        const errorMessage =
          err?.response?.data?.message ||
          err?.message ||
          'Failed to add RSS feed';
        setError(errorMessage);
        console.error('Failed to add RSS feed:', err);
        throw new Error(errorMessage);
      } finally {
        setIsAddingFeed(false);
      }
    },
    [publicationId, fetchFeeds]
  );

  const updateFeed = useCallback(
    async (
      feedId: string,
      data: { name?: string; autoPublish?: boolean; status?: 'active' | 'paused' }
    ): Promise<RssFeed | null> => {
      try {
        setError(null);
        const response = await rssFeedsAPI.updateFeed(feedId, data);
        if (response.data?.data) {
          const updatedFeed = response.data.data;
          setFeeds((prev) =>
            prev.map((f) => (f.id === feedId ? updatedFeed : f))
          );
          return updatedFeed;
        }
        return null;
      } catch (err: any) {
        const errorMessage =
          err?.response?.data?.message ||
          err?.message ||
          'Failed to update RSS feed';
        setError(errorMessage);
        console.error('Failed to update RSS feed:', err);
        throw new Error(errorMessage);
      }
    },
    []
  );

  const deleteFeed = useCallback(async (feedId: string): Promise<boolean> => {
    try {
      setError(null);
      await rssFeedsAPI.deleteFeed(feedId);
      setFeeds((prev) => prev.filter((f) => f.id !== feedId));
      return true;
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to delete RSS feed';
      setError(errorMessage);
      console.error('Failed to delete RSS feed:', err);
      throw new Error(errorMessage);
    }
  }, []);

  const triggerSync = useCallback(async (feedId: string): Promise<boolean> => {
    const triggeredAt = Date.now();
    try {
      setIsSyncing(feedId);
      setError(null);
      await rssFeedsAPI.triggerSync(feedId);
      // The enqueue returns immediately; keep "Syncing…" until the job actually
      // finishes so the button stays disabled for the real duration (prevents the
      // repeat-click that used to spawn concurrent syncs).
      await waitForSyncToSettle(feedId, triggeredAt);
      // Refetch to get updated lastSyncAt / itemCount / error
      await fetchFeeds();
      return true;
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to trigger sync';
      setError(errorMessage);
      console.error('Failed to trigger sync:', err);
      throw new Error(errorMessage);
    } finally {
      setIsSyncing(null);
    }
  }, [fetchFeeds]);

  const validateFeed = useCallback(
    async (url: string): Promise<RssFeedValidationResult | null> => {
      try {
        setError(null);
        const response = await rssFeedsAPI.validateFeed(url);
        return response.data?.data || null;
      } catch (err: any) {
        const errorMessage =
          err?.response?.data?.message ||
          err?.message ||
          'Failed to validate RSS feed';
        setError(errorMessage);
        console.error('Failed to validate RSS feed:', err);
        return { valid: false, error: errorMessage };
      }
    },
    []
  );

  const previewFeed = useCallback(
    async (url: string): Promise<RssFeedPreviewResult | null> => {
      try {
        setError(null);
        const response = await rssFeedsAPI.previewFeed(url);
        return response.data?.data || null;
      } catch (err: any) {
        const errorMessage =
          err?.response?.data?.message ||
          err?.message ||
          'Failed to preview RSS feed';
        setError(errorMessage);
        console.error('Failed to preview RSS feed:', err);
        return { valid: false, error: errorMessage };
      }
    },
    []
  );

  return {
    feeds,
    isLoading,
    error,
    refetch: fetchFeeds,
    addFeed,
    updateFeed,
    deleteFeed,
    triggerSync,
    validateFeed,
    previewFeed,
    isAddingFeed,
    isSyncing,
  };
}
