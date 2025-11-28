import { useState, useCallback } from 'react';
import { useSuiClient, useCurrentAccount } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { followsAPI } from '@/lib/api';
import { log } from '@/lib/utils/Logger';
import { useEnhancedTransaction } from './useEnhancedTransaction';
import { DateRange, getDateRangeFromPreset } from '@/lib/followerFilters';
import { parseAmountToSmallestUnit } from './useWalletBalances';

export type AirdropStep = 1 | 2 | 3;

export type AirdropStatus = 'idle' | 'loading' | 'success' | 'error';

export interface AirdropState {
  step: AirdropStep;
  // Step 1: Token selection
  selectedCoinType: string | null;
  totalAmount: string;
  // Step 2: Recipient filters
  dateRange: DateRange;
  customStartDate: string;
  customEndDate: string;
  // Recipients data
  recipients: string[];
  recipientCount: number;
  isLoadingRecipients: boolean;
  // Transaction state
  status: AirdropStatus;
  error: string | null;
  txDigest: string | null;
}

interface UseAirdropOptions {
  publicationId: string;
}

const initialState: Omit<AirdropState, 'step'> = {
  selectedCoinType: null,
  totalAmount: '',
  dateRange: 'all',
  customStartDate: '',
  customEndDate: '',
  recipients: [],
  recipientCount: 0,
  isLoadingRecipients: false,
  status: 'idle',
  error: null,
  txDigest: null,
};

/**
 * Hook for managing token airdrops to publication followers
 *
 * Handles:
 * - Multi-step form state management
 * - Recipient wallet fetching based on filters
 * - PTB construction for coin merge, split, and transfer
 * - Transaction execution
 */
export function useAirdrop({ publicationId }: UseAirdropOptions) {
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const { signAndExecuteTransaction } = useEnhancedTransaction();

  const [state, setState] = useState<AirdropState>({
    step: 1,
    ...initialState,
  });

  // Step navigation
  const goToStep = useCallback((step: AirdropStep) => {
    setState(prev => ({ ...prev, step }));
  }, []);

  const nextStep = useCallback(() => {
    setState(prev => ({
      ...prev,
      step: Math.min(prev.step + 1, 3) as AirdropStep,
    }));
  }, []);

  const prevStep = useCallback(() => {
    setState(prev => ({
      ...prev,
      step: Math.max(prev.step - 1, 1) as AirdropStep,
    }));
  }, []);

  // Step 1: Token selection
  const setSelectedCoinType = useCallback((coinType: string | null) => {
    setState(prev => ({
      ...prev,
      selectedCoinType: coinType,
      totalAmount: '', // Reset amount when changing token
    }));
  }, []);

  const setTotalAmount = useCallback((amount: string) => {
    setState(prev => ({ ...prev, totalAmount: amount }));
  }, []);

  // Step 2: Recipient filters
  const setDateRange = useCallback((dateRange: DateRange) => {
    setState(prev => ({ ...prev, dateRange }));
  }, []);

  const setCustomStartDate = useCallback((date: string) => {
    setState(prev => ({ ...prev, customStartDate: date }));
  }, []);

  const setCustomEndDate = useCallback((date: string) => {
    setState(prev => ({ ...prev, customEndDate: date }));
  }, []);

  // Fetch recipients based on current filters
  const fetchRecipients = useCallback(async () => {
    if (!publicationId) return;

    // For custom range, require both dates
    if (state.dateRange === 'custom' && (!state.customStartDate || !state.customEndDate)) {
      setState(prev => ({
        ...prev,
        recipients: [],
        recipientCount: 0,
      }));
      return;
    }

    setState(prev => ({ ...prev, isLoadingRecipients: true }));

    try {
      const { fromDate, toDate } = getDateRangeFromPreset(
        state.dateRange,
        state.customStartDate,
        state.customEndDate
      );

      const response = await followsAPI.getExportData(publicationId, {
        dataType: 'wallet',
        fromDate,
        toDate,
      });

      if (response.data.success) {
        const wallets = response.data.data.data as string[];
        setState(prev => ({
          ...prev,
          recipients: wallets,
          recipientCount: wallets.length,
          isLoadingRecipients: false,
        }));
      } else {
        throw new Error(response.data.message || 'Failed to fetch recipients');
      }
    } catch (error) {
      log.error('Failed to fetch recipients', error, 'useAirdrop');
      setState(prev => ({
        ...prev,
        recipients: [],
        recipientCount: 0,
        isLoadingRecipients: false,
        error: error instanceof Error ? error.message : 'Failed to fetch recipients',
      }));
    }
  }, [publicationId, state.dateRange, state.customStartDate, state.customEndDate]);

  // Execute airdrop transaction
  const executeAirdrop = useCallback(async (decimals: number = 9) => {
    if (!currentAccount?.address) {
      setState(prev => ({ ...prev, error: 'Wallet not connected', status: 'error' }));
      return;
    }

    if (!state.selectedCoinType) {
      setState(prev => ({ ...prev, error: 'No token selected', status: 'error' }));
      return;
    }

    if (state.recipients.length === 0) {
      setState(prev => ({ ...prev, error: 'No recipients selected', status: 'error' }));
      return;
    }

    const totalAmountInSmallestUnit = parseAmountToSmallestUnit(state.totalAmount, decimals);
    if (totalAmountInSmallestUnit <= 0n) {
      setState(prev => ({ ...prev, error: 'Invalid amount', status: 'error' }));
      return;
    }

    setState(prev => ({ ...prev, status: 'loading', error: null }));

    try {
      log.info('Starting airdrop transaction', {
        coinType: state.selectedCoinType,
        totalAmount: state.totalAmount,
        recipientCount: state.recipients.length,
      }, 'useAirdrop');

      // Fetch all coin objects of the selected type
      const coins = await suiClient.getCoins({
        owner: currentAccount.address,
        coinType: state.selectedCoinType,
      });

      if (coins.data.length === 0) {
        throw new Error('No coins found of the selected type');
      }

      const tx = new Transaction();

      // Reference the primary coin
      let primaryCoin = tx.object(coins.data[0].coinObjectId);

      // Merge all coins into one if there are multiple
      if (coins.data.length > 1) {
        const coinsToMerge = coins.data.slice(1).map(c => tx.object(c.coinObjectId));
        tx.mergeCoins(primaryCoin, coinsToMerge);
      }

      // Calculate amount per recipient (equal distribution)
      const recipientCount = BigInt(state.recipients.length);
      const amountPerRecipient = totalAmountInSmallestUnit / recipientCount;

      // Handle any remainder by giving it to the last recipient
      const remainder = totalAmountInSmallestUnit % recipientCount;

      // Create split amounts array
      const splitAmounts: bigint[] = state.recipients.map((_, index) => {
        // Last recipient gets the remainder
        if (index === state.recipients.length - 1) {
          return amountPerRecipient + remainder;
        }
        return amountPerRecipient;
      });

      // Split coins for all recipients
      const splitCoins = tx.splitCoins(
        primaryCoin,
        splitAmounts.map(amount => tx.pure.u64(amount))
      );

      // Transfer each split coin to the corresponding recipient
      state.recipients.forEach((recipientAddress, index) => {
        tx.transferObjects([splitCoins[index]], tx.pure.address(recipientAddress));
      });

      // Sign and execute the transaction
      const result = await signAndExecuteTransaction({ transaction: tx });

      log.info('Airdrop transaction successful', {
        digest: result.digest,
        recipientCount: state.recipients.length,
      }, 'useAirdrop');

      setState(prev => ({
        ...prev,
        status: 'success',
        txDigest: result.digest,
        error: null,
      }));

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Airdrop transaction failed';
      log.error('Airdrop transaction failed', error, 'useAirdrop');

      setState(prev => ({
        ...prev,
        status: 'error',
        error: errorMessage,
      }));

      throw error;
    }
  }, [currentAccount, state.selectedCoinType, state.totalAmount, state.recipients, suiClient, signAndExecuteTransaction]);

  // Reset state
  const reset = useCallback(() => {
    setState({
      step: 1,
      ...initialState,
    });
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null, status: 'idle' }));
  }, []);

  // Calculate amount per recipient for display
  const amountPerRecipient = state.recipientCount > 0 && state.totalAmount
    ? parseFloat(state.totalAmount) / state.recipientCount
    : 0;

  return {
    // State
    ...state,
    amountPerRecipient,

    // Navigation
    goToStep,
    nextStep,
    prevStep,

    // Step 1 actions
    setSelectedCoinType,
    setTotalAmount,

    // Step 2 actions
    setDateRange,
    setCustomStartDate,
    setCustomEndDate,
    fetchRecipients,

    // Step 3 actions
    executeAirdrop,

    // Utility
    reset,
    clearError,
  };
}
