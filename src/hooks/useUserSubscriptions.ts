"use client";

import { useState, useEffect, useCallback } from 'react';
import { subscriptionsAPI } from '@/lib/api';
import { useWalletConnection } from './useWalletConnection';

interface UserSubscription {
  subscriptionId: string;
  publicationId: string;
  publicationName?: string;
  subscriber: string;
  amountPaid: string;
  expiresAt: Date;
  isActive: boolean;
  timeRemaining?: number; // milliseconds
  createdAt: Date;
}

interface UseUserSubscriptionsProps {
  enabled?: boolean;
  limit?: number;
}

interface UseUserSubscriptionsReturn {
  subscriptions: UserSubscription[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refetch: () => Promise<void>;
  refresh: () => Promise<void>;
  activeSubscriptions: UserSubscription[];
  expiredSubscriptions: UserSubscription[];
  expiringSoonSubscriptions: UserSubscription[]; // expires within 7 days
}

export function useUserSubscriptions({
  enabled = true,
  limit = 20,
}: UseUserSubscriptionsProps = {}): UseUserSubscriptionsReturn {
  const { isConnected, account } = useWalletConnection();
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<string | undefined>(undefined);

  const fetchSubscriptions = useCallback(async (reset = false) => {
    if (!enabled || !isConnected || !account?.address) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const currentCursor = reset ? undefined : cursor;
      const response = await subscriptionsAPI.getMySubscriptions({
        limit,
        cursor: currentCursor,
      });

      if (response.data) {
        const newSubscriptions = response.data.data.map((sub: UserSubscription & { expiresAt: string; createdAt: string }) => ({
          ...sub,
          expiresAt: new Date(sub.expiresAt),
          createdAt: new Date(sub.createdAt),
        }));

        if (reset) {
          setSubscriptions(newSubscriptions);
        } else {
          setSubscriptions(prev => [...prev, ...newSubscriptions]);
        }

        setHasMore(response.data.meta.hasMore);
        setCursor(response.data.meta.nextCursor);
      }
    } catch (err) {
      console.error('Failed to fetch user subscriptions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch subscriptions');
    } finally {
      setIsLoading(false);
    }
  }, [enabled, isConnected, account?.address, limit, cursor]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) {
      return;
    }
    await fetchSubscriptions(false);
  }, [hasMore, isLoading, fetchSubscriptions]);

  const refetch = useCallback(async () => {
    setCursor(undefined);
    await fetchSubscriptions(true);
  }, [fetchSubscriptions]);

  const refresh = refetch; // Alias for consistency

  // Computed values
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const activeSubscriptions = subscriptions.filter(sub => sub.isActive && sub.expiresAt > now);
  const expiredSubscriptions = subscriptions.filter(sub => !sub.isActive || sub.expiresAt <= now);
  const expiringSoonSubscriptions = activeSubscriptions.filter(
    sub => sub.expiresAt <= sevenDaysFromNow
  );

  // Fetch subscriptions when component mounts or dependencies change
  useEffect(() => {
    if (enabled && isConnected && account?.address) {
      refetch();
    } else {
      // Clear data when user disconnects
      setSubscriptions([]);
      setHasMore(false);
      setCursor(undefined);
      setError(null);
    }
  }, [enabled, isConnected, account?.address, refetch]);

  return {
    subscriptions,
    isLoading,
    error,
    hasMore,
    loadMore,
    refetch,
    refresh,
    activeSubscriptions,
    expiredSubscriptions,
    expiringSoonSubscriptions,
  };
}