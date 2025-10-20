"use client";

import { useState, useEffect } from 'react';
import { subscriptionsAPI } from '@/lib/api';
import { useWalletConnection } from './useWalletConnection';

interface SubscriptionInfo {
  id: string;
  subscriptionPrice: number; // in MIST
  subscriptionPeriod: number; // in days
  publicationName?: string;
}

interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  subscription?: {
    subscriptionId: string;
    publicationId: string;
    subscriber: string;
    amountPaid: string;
    expiresAt: Date;
    isActive: boolean;
    timeRemaining?: number; // milliseconds
    createdAt: Date;
  };
  publicationRequiresSubscription: boolean;
  subscriptionPrice?: string; // in MIST
}

interface UseSubscriptionProps {
  publicationId: string;
  enabled?: boolean;
}

interface UseSubscriptionReturn {
  subscriptionStatus: SubscriptionStatus | null;
  subscriptionInfo: SubscriptionInfo | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isSubscribed: boolean;
  isExpiringSoon: boolean; // expires within 7 days
  formatPrice: (priceInMist: number) => string;
  formatExpiryDate: (date: Date) => string;
}

const MIST_PER_SUI = 1_000_000_000;

export function useSubscription({
  publicationId,
  enabled = true,
}: UseSubscriptionProps): UseSubscriptionReturn {
  const { isConnected, account } = useWalletConnection();
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscriptionStatus = async () => {
    if (!enabled || !publicationId) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await subscriptionsAPI.getSubscriptionStatus(publicationId);
      
      if (response.data) {
        setSubscriptionStatus({
          ...response.data,
          subscription: response.data.subscription ? {
            ...response.data.subscription,
            expiresAt: new Date(response.data.subscription.expiresAt),
            createdAt: new Date(response.data.subscription.createdAt),
          } : undefined,
        });

        // Build subscription info if publication requires subscription
        if (response.data.publicationRequiresSubscription && response.data.subscriptionPrice) {
          setSubscriptionInfo({
            id: publicationId,
            subscriptionPrice: parseInt(response.data.subscriptionPrice),
            subscriptionPeriod: 30, // Default - should come from smart contract
            publicationName: undefined, // Will be filled by parent component
          });
        } else {
          setSubscriptionInfo(null);
        }
      }
    } catch (err) {
      console.error('Failed to fetch subscription status:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch subscription status');
      setSubscriptionStatus(null);
      setSubscriptionInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refetch = async () => {
    await fetchSubscriptionStatus();
  };

  const formatPrice = (priceInMist: number): string => {
    return (priceInMist / MIST_PER_SUI).toFixed(2);
  };

  const formatExpiryDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Computed values
  const isSubscribed = subscriptionStatus?.hasActiveSubscription || false;
  const isExpiringSoon = subscriptionStatus?.subscription?.expiresAt 
    ? subscriptionStatus.subscription.expiresAt.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000
    : false;

  // Fetch subscription status when component mounts or dependencies change
  useEffect(() => {
    fetchSubscriptionStatus();
  }, [publicationId, enabled, isConnected, account?.address]);

  return {
    subscriptionStatus,
    subscriptionInfo,
    isLoading,
    error,
    refetch,
    isSubscribed,
    isExpiringSoon,
    formatPrice,
    formatExpiryDate,
  };
}