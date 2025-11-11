import { useState, useEffect, useCallback } from 'react';
import { useSuiClient } from '@mysten/dapp-kit';
import { mistToSui } from '@/hooks/useSubscriptionSettings';
import { log } from '@/lib/utils/Logger';

interface TipBalanceState {
  balance: number; // Balance in MIST
  balanceInSui: number; // Balance in SUI for display
  totalTipsReceived: number; // Total number of tips
  totalAmountReceived: number; // Total amount received in MIST (lifetime)
  totalAmountReceivedInSui: number; // Total amount in SUI for display
  isLoading: boolean;
  error: string | null;
}

interface UseTipBalanceParams {
  publicationId: string;
  enabled?: boolean; // Allow disabling fetching
}

/**
 * Hook for fetching publication tip balance from blockchain
 *
 * Fetches the Publication object from the Sui blockchain and extracts
 * the tip_balance field value along with treasury statistics.
 * The balance is returned in both MIST (native) and SUI (display) denominations.
 */
export const useTipBalance = ({
  publicationId,
  enabled = true,
}: UseTipBalanceParams) => {
  const suiClient = useSuiClient();

  const [state, setState] = useState<TipBalanceState>({
    balance: 0,
    balanceInSui: 0,
    totalTipsReceived: 0,
    totalAmountReceived: 0,
    totalAmountReceivedInSui: 0,
    isLoading: true,
    error: null,
  });

  /**
   * Fetch tip balance and statistics from blockchain
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
      log.info('Fetching tip balance from blockchain', {
        publicationId,
      }, 'useTipBalance');

      // Fetch publication object from blockchain
      const publicationObject = await suiClient.getObject({
        id: publicationId,
        options: {
          showContent: true,
        },
      });

      // Validate object exists and has content
      if (!publicationObject.data) {
        throw new Error('Publication not found on blockchain');
      }

      if (publicationObject.data.content?.dataType !== 'moveObject') {
        throw new Error('Invalid publication object type');
      }

      // Extract tip_balance and statistics from content fields
      const content = publicationObject.data.content;
      const fields = content.fields as Record<string, unknown>;

      if (!fields || typeof fields.tip_balance === 'undefined') {
        throw new Error('Tip balance field not found in publication object');
      }

      // The balance is stored as a Balance<SUI> struct, which has a 'value' field
      let balanceInMist = 0;

      if (typeof fields.tip_balance === 'object' && fields.tip_balance !== null) {
        // Balance struct has a 'value' field
        const balanceObj = fields.tip_balance as Record<string, unknown>;
        balanceInMist = Number(balanceObj.value || 0);
      } else if (typeof fields.tip_balance === 'string' || typeof fields.tip_balance === 'number') {
        // Direct value
        balanceInMist = Number(fields.tip_balance);
      }

      const balanceInSui = mistToSui(balanceInMist);

      // Extract treasury statistics
      const totalTipsReceived = Number(fields.total_tips_received || 0);
      const totalAmountReceived = Number(fields.total_amount_received || 0);
      const totalAmountReceivedInSui = mistToSui(totalAmountReceived);

      log.info('Tip balance fetched successfully', {
        publicationId,
        balanceInMist,
        balanceInSui,
        totalTipsReceived,
        totalAmountReceived,
      }, 'useTipBalance');

      setState({
        balance: balanceInMist,
        balanceInSui,
        totalTipsReceived,
        totalAmountReceived,
        totalAmountReceivedInSui,
        isLoading: false,
        error: null,
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch tip balance';

      log.error('Failed to fetch tip balance', {
        error,
        publicationId,
      }, 'useTipBalance');

      setState({
        balance: 0,
        balanceInSui: 0,
        totalTipsReceived: 0,
        totalAmountReceived: 0,
        totalAmountReceivedInSui: 0,
        isLoading: false,
        error: errorMessage,
      });
    }
  }, [publicationId, enabled, suiClient]);

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
