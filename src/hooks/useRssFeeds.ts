import { useState, useEffect, useCallback } from 'react';
import {
  rssFeedsAPI,
  RssFeed,
  RssFeedSyncHistory,
  RssFeedValidationResult,
} from '@/lib/api';

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
  }) => Promise<RssFeed | null>;
  updateFeed: (
    feedId: string,
    data: { name?: string; autoPublish?: boolean; status?: 'active' | 'paused' }
  ) => Promise<RssFeed | null>;
  deleteFeed: (feedId: string) => Promise<boolean>;
  triggerSync: (feedId: string) => Promise<boolean>;
  validateFeed: (url: string) => Promise<RssFeedValidationResult | null>;
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
    [publicationId]
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
    try {
      setIsSyncing(feedId);
      setError(null);
      await rssFeedsAPI.triggerSync(feedId);
      // Refetch to get updated lastSyncAt
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
    isAddingFeed,
    isSyncing,
  };
}
