"use client";

import { useState, useEffect } from 'react';
import { subscriptionsAPI } from '@/lib/api';
import { useWalletConnection } from './useWalletConnection';

/**
 * Publication Subscription Management Hook
 * 
 * This hook manages publication-specific subscriptions (NOT general platform subscriptions).
 * Users can subscribe to individual publications to access their premium content.
 * 
 * Features:
 * - Check if user has an active subscription to a specific publication
 * - Get publication subscription pricing and requirements
 * - Track subscription expiry and renewal needs
 * - Format pricing and dates for display
 * 
 * Smart Contract Integration:
 * - Connects to `publication_subscription.move` contract
 * - Validates `PublicationSubscription` objects on-chain
 * - Supports time-based subscription expiry using Sui Clock
 * 
 * @param publicationId - The publication ID to check subscription for
 * @param enabled - Whether to actively fetch subscription data
 * @returns Publication subscription status and management functions
 * 
 * @example
 * ```tsx
 * const { 
 *   subscriptionStatus, 
 *   isSubscribed, 
 *   isExpiringSoon 
 * } = useSubscription({ 
 *   publicationId: 'pub_123',
 *   enabled: !!publicationId 
 * });
 * 
 * if (subscriptionStatus?.publicationRequiresSubscription && !isSubscribed) {
 *   // Show publication subscription paywall
 * }
 * ```
 */

interface PublicationSubscriptionInfo {
  id: string;
  subscriptionPrice: number; // in MIST
  subscriptionPeriod: number; // in days
  publicationName?: string;
}

interface PublicationSubscriptionStatus {
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

interface UsePublicationSubscriptionProps {
  publicationId: string;
  enabled?: boolean;
}

interface UsePublicationSubscriptionReturn {
  subscriptionStatus: PublicationSubscriptionStatus | null;
  subscriptionInfo: PublicationSubscriptionInfo | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isSubscribed: boolean;
  isExpiringSoon: boolean; // expires within 7 days
  formatPrice: (priceInMist: number) => string;
  formatExpiryDate: (date: Date) => string;
}

const MIST_PER_SUI = 1_000_000_000;

/**
 * Publication Subscription Hook Implementation
 * 
 * NOTE: This hook is specifically for publication subscriptions, not general platform subscriptions.
 * It manages subscriptions to individual publications for accessing their premium content.
 */
export function useSubscription({
  publicationId,
  enabled = true,
}: UsePublicationSubscriptionProps): UsePublicationSubscriptionReturn {
  const { isConnected, account } = useWalletConnection();
  const [subscriptionStatus, setSubscriptionStatus] = useState<PublicationSubscriptionStatus | null>(null);
  const [subscriptionInfo, setSubscriptionInfo] = useState<PublicationSubscriptionInfo | null>(null);
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
      
      console.log('📊 SUBSCRIPTION API RESPONSE:', {
        publicationId,
        rawResponse: response.data,
        success: response.data?.success,
        subscriptionPrice: response.data?.data?.subscriptionPrice,
        subscriptionPriceType: typeof response.data?.data?.subscriptionPrice,
        hasActiveSubscription: response.data?.data?.hasActiveSubscription,
        publicationRequiresSubscription: response.data?.data?.publicationRequiresSubscription,
      });
      
      // Handle wrapped API response: { success: true, data: {...} }
      if (!response.data || !response.data.success) {
        throw new Error('API returned unsuccessful response');
      }

      const subscriptionData = response.data.data;
      if (subscriptionData) {
        setSubscriptionStatus({
          ...subscriptionData,
          subscription: subscriptionData.subscription ? {
            ...subscriptionData.subscription,
            expiresAt: new Date(subscriptionData.subscription.expiresAt),
            createdAt: new Date(subscriptionData.subscription.createdAt),
          } : undefined,
        });

        // Build subscription info if publication requires subscription
        if (subscriptionData.publicationRequiresSubscription && subscriptionData.subscriptionPrice) {
          // Use Number() for better conversion than parseInt() - handles edge cases better
          const parsedPrice = Number(subscriptionData.subscriptionPrice);
          
          console.log('💰 BUILDING SUBSCRIPTION INFO:', {
            originalPrice: subscriptionData.subscriptionPrice,
            originalType: typeof subscriptionData.subscriptionPrice,
            parsedPrice: parsedPrice,
            parseSuccessful: !isNaN(parsedPrice) && isFinite(parsedPrice),
            priceInSUI: parsedPrice / 1_000_000_000,
          });
          
          // Validate the parsed price is a valid positive number
          if (isNaN(parsedPrice) || !isFinite(parsedPrice) || parsedPrice < 0) {
            console.error('❌ Invalid subscription price:', subscriptionData.subscriptionPrice);
            setSubscriptionInfo(null);
            return;
          }
          
          setSubscriptionInfo({
            id: publicationId,
            subscriptionPrice: parsedPrice,
            subscriptionPeriod: 30, // Default - should come from smart contract
            publicationName: undefined, // Will be filled by parent component
          });
        } else {
          console.log('❌ NOT BUILDING SUBSCRIPTION INFO:', {
            publicationRequiresSubscription: subscriptionData.publicationRequiresSubscription,
            subscriptionPrice: subscriptionData.subscriptionPrice,
            hasSubscriptionPrice: !!subscriptionData.subscriptionPrice,
          });
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