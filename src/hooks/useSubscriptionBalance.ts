import { useState, useEffect, useCallback } from 'react';
import { useCurrentClient } from '@mysten/dapp-kit-react';
import { mistToSui } from '@/hooks/useSubscriptionSettings';
import { log } from '@/lib/utils/Logger';

interface SubscriptionBalanceState {
  balance: number; // Balance in MIST
  balanceInSui: number; // Balance in SUI for display
  isLoading: boolean;
  error: string | null;
}

interface UseSubscriptionBalanceParams {
  publicationId: string;
  enabled?: boolean; // Allow disabling fetching
}

/**
 * Hook for fetching publication subscription balance from blockchain
 *
 * Fetches the Publication object from the Sui blockchain and extracts
 * the subscription_balance field value. The balance is returned in both
 * MIST (native) and SUI (display) denominations.
 */
export const useSubscriptionBalance = ({
  publicationId,
  enabled = true,
}: UseSubscriptionBalanceParams) => {
  const client = useCurrentClient();

  const [state, setState] = useState<SubscriptionBalanceState>({
    balance: 0,
    balanceInSui: 0,
    isLoading: true,
    error: null,
  });

  /**
   * Fetch subscription balance from blockchain
   */
  const fetchBalance = useCallback(async () => {
    if (!publicationId || !enabled) {
      return;
    }

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      log.info('Fetching subscription balance from blockchain', {
        publicationId,
      }, 'useSubscriptionBalance');

      // Fetch publication object from blockchain
      let publicationObject;
      try {
        publicationObject = await client.core.getObject({
          objectId: publicationId,
          include: {
            json: true,
          },
        });
      } catch {
        // core.getObject throws when the object does not exist
        throw new Error('Publication not found on blockchain');
      }

      // Extract subscription_balance from content fields
      const fields = publicationObject.object.json as Record<string, unknown>;

      if (!fields || typeof fields.subscription_balance === 'undefined') {
        throw new Error('Subscription balance field not found in publication object');
      }

      // The balance is stored as a Balance<SUI> struct, which has a 'value' field
      let balanceInMist = 0;

      if (typeof fields.subscription_balance === 'object' && fields.subscription_balance !== null) {
        // Balance struct has a 'value' field
        const balanceObj = fields.subscription_balance as Record<string, unknown>;
        balanceInMist = Number(balanceObj.value || 0);
      } else if (typeof fields.subscription_balance === 'string' || typeof fields.subscription_balance === 'number') {
        // Direct value
        balanceInMist = Number(fields.subscription_balance);
      }

      const balanceInSui = mistToSui(balanceInMist);

      log.info('Subscription balance fetched successfully', {
        publicationId,
        balanceInMist,
        balanceInSui,
      }, 'useSubscriptionBalance');

      setState({
        balance: balanceInMist,
        balanceInSui,
        isLoading: false,
        error: null,
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch subscription balance';

      log.error('Failed to fetch subscription balance', {
        error,
        publicationId,
      }, 'useSubscriptionBalance');

      setState({
        balance: 0,
        balanceInSui: 0,
        isLoading: false,
        error: errorMessage,
      });
    }
  }, [publicationId, enabled, client]);

  /**
   * Refresh balance data
   */
  const refresh = useCallback(() => {
    fetchBalance();
  }, [fetchBalance]);

  // Fetch balance on mount and when dependencies change
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return {
    ...state,
    refresh,
    hasBalance: state.balance > 0,
  };
};
