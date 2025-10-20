import { useState, useCallback } from 'react';
import { Transaction } from '@mysten/sui/transactions';
import { useEnhancedTransaction } from '@/hooks/useEnhancedTransaction';
import { useUserPublications } from '@/hooks/useUserPublications';
import { INKRAY_CONFIG } from '@/lib/sui-clients';
import { log } from '@/lib/utils/Logger';

// Constants for price conversion
export const MIST_PER_SUI = 1_000_000_000; // 1 SUI = 10^9 MIST

// Convert SUI to MIST for smart contract
export const suiToMist = (suiAmount: number): number => {
  return Math.floor(suiAmount * MIST_PER_SUI);
};

// Convert MIST to SUI for display
export const mistToSui = (mistAmount: number): number => {
  return mistAmount / MIST_PER_SUI;
};

interface SubscriptionSettingsState {
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  success: boolean;
}

interface UseSubscriptionSettingsParams {
  publicationId: string;
  ownerCapId?: string;
  currentPrice?: number; // Current price in MIST
  onSuccess?: () => void;
}

/**
 * Hook for managing publication subscription settings
 * 
 * Provides functionality to:
 * - Update subscription pricing via smart contract
 * - Handle price conversions between SUI and MIST
 * - Manage loading states and error handling
 * - Integrate with publication owner capabilities
 */
export const useSubscriptionSettings = ({
  publicationId,
  ownerCapId,
  currentPrice = 0,
  onSuccess
}: UseSubscriptionSettingsParams) => {
  const { signAndExecuteTransaction } = useEnhancedTransaction();
  const { refresh: refreshUserPublications } = useUserPublications();
  
  const [state, setState] = useState<SubscriptionSettingsState>({
    isLoading: false,
    isSaving: false,
    error: null,
    success: false,
  });

  /**
   * Update subscription price via smart contract
   * @param priceInSui - New subscription price in SUI (0 to disable)
   */
  const updateSubscriptionPrice = useCallback(async (priceInSui: number) => {
    if (!publicationId) {
      throw new Error('Publication ID is required');
    }

    if (!ownerCapId) {
      throw new Error('Owner capability ID is required. Only publication owners can update subscription settings.');
    }

    if (priceInSui < 0) {
      throw new Error('Subscription price cannot be negative');
    }

    setState(prev => ({
      ...prev,
      isSaving: true,
      error: null,
      success: false,
    }));

    try {
      // Convert SUI to MIST for smart contract
      const priceInMist = priceInSui > 0 ? suiToMist(priceInSui) : 0;

      log.info('Updating subscription price', {
        publicationId,
        ownerCapId,
        priceInSui,
        priceInMist,
      }, 'useSubscriptionSettings');

      // Build transaction
      const tx = new Transaction();
      
      tx.moveCall({
        target: `${INKRAY_CONFIG.PACKAGE_ID}::publication::set_subscription_price`,
        arguments: [
          tx.object(ownerCapId),      // PublicationOwnerCap
          tx.object(publicationId),   // Publication object
          tx.pure.u64(priceInMist),   // Price in MIST
        ],
      });

      // Execute transaction
      const result = await signAndExecuteTransaction({
        transaction: tx,
      });

      log.info('Subscription price updated successfully', {
        digest: result.digest,
        publicationId,
        newPrice: priceInSui,
      }, 'useSubscriptionSettings');

      setState(prev => ({
        ...prev,
        isSaving: false,
        success: true,
      }));

      // Refresh user publications to get updated data
      refreshUserPublications();
      
      // Call success callback if provided
      onSuccess?.();

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update subscription price';
      
      log.error('Failed to update subscription price', {
        error,
        publicationId,
        priceInSui,
      }, 'useSubscriptionSettings');

      setState(prev => ({
        ...prev,
        isSaving: false,
        error: errorMessage,
      }));

      throw error;
    }
  }, [publicationId, ownerCapId, signAndExecuteTransaction, refreshUserPublications, onSuccess]);

  /**
   * Enable subscription with specified price
   */
  const enableSubscription = useCallback(async (priceInSui: number) => {
    if (priceInSui <= 0) {
      throw new Error('Subscription price must be greater than 0');
    }
    return updateSubscriptionPrice(priceInSui);
  }, [updateSubscriptionPrice]);

  /**
   * Disable subscription (set price to 0)
   */
  const disableSubscription = useCallback(async () => {
    return updateSubscriptionPrice(0);
  }, [updateSubscriptionPrice]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  /**
   * Clear success state
   */
  const clearSuccess = useCallback(() => {
    setState(prev => ({ ...prev, success: false }));
  }, []);

  return {
    // State
    ...state,

    // Computed properties
    isSubscriptionEnabled: currentPrice > 0,
    currentPriceInSui: mistToSui(currentPrice),
    canUpdate: !!ownerCapId && !!publicationId,

    // Actions
    updateSubscriptionPrice,
    enableSubscription,
    disableSubscription,
    clearError,
    clearSuccess,

    // Utilities
    suiToMist,
    mistToSui,
  };
};