import { useState, useCallback } from 'react';
import { Transaction } from '@mysten/sui/transactions';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useEnhancedTransaction } from '@/hooks/useEnhancedTransaction';
import { suiToMist } from '@/hooks/useSubscriptionSettings';
import { INKRAY_CONFIG } from '@/lib/sui-clients';
import { log } from '@/lib/utils/Logger';

interface WithdrawalState {
  isWithdrawing: boolean;
  error: string | null;
  success: boolean;
}

interface UseSubscriptionWithdrawalParams {
  publicationId: string;
  ownerCapId?: string;
  currentBalance: number; // Current balance in MIST
  onSuccess?: () => void;
}

/**
 * Hook for withdrawing subscription balance from a publication
 *
 * Provides functionality to:
 * - Withdraw subscription balance via smart contract
 * - Handle PTB (Programmable Transaction Block) construction
 * - Transfer withdrawn SUI tokens to sender
 * - Manage withdrawal states and error handling
 */
export const useSubscriptionWithdrawal = ({
  publicationId,
  ownerCapId,
  currentBalance,
  onSuccess,
}: UseSubscriptionWithdrawalParams) => {
  const currentAccount = useCurrentAccount();
  const { signAndExecuteTransaction } = useEnhancedTransaction();

  const [state, setState] = useState<WithdrawalState>({
    isWithdrawing: false,
    error: null,
    success: false,
  });

  /**
   * Withdraw subscription balance
   * @param amountInSui - Amount to withdraw in SUI (use full balance if not specified)
   */
  const withdrawBalance = useCallback(async (amountInSui?: number) => {
    if (!publicationId) {
      throw new Error('Publication ID is required');
    }

    if (!ownerCapId) {
      throw new Error('Owner capability ID is required. Only publication owners can withdraw subscription balance.');
    }

    if (currentBalance <= 0) {
      throw new Error('No balance available to withdraw');
    }

    setState(prev => ({
      ...prev,
      isWithdrawing: true,
      error: null,
      success: false,
    }));

    try {
      // Calculate amount to withdraw in MIST
      // If no amount specified, withdraw full balance
      const amountInMist = amountInSui
        ? suiToMist(amountInSui)
        : currentBalance;

      // Validate amount
      if (amountInMist <= 0) {
        throw new Error('Withdrawal amount must be greater than 0');
      }

      if (amountInMist > currentBalance) {
        throw new Error('Withdrawal amount exceeds available balance');
      }

      log.info('Withdrawing subscription balance', {
        publicationId,
        ownerCapId,
        amountInSui: amountInSui || (currentBalance / 1_000_000_000),
        amountInMist,
        currentBalance,
      }, 'useSubscriptionWithdrawal');

      // Build transaction
      const tx = new Transaction();

      // Call withdraw_subscription_balance - returns Coin<SUI>
      const [withdrawnCoin] = tx.moveCall({
        target: `${INKRAY_CONFIG.PACKAGE_ID}::publication::withdraw_subscription_balance`,
        arguments: [
          tx.object(ownerCapId),      // PublicationOwnerCap
          tx.object(publicationId),   // &mut Publication
          tx.pure.u64(amountInMist),  // amount in MIST
        ],
      });

      // Transfer the withdrawn coin to the sender
      // The moveCall returns a Coin<SUI> which we need to transfer
      if (!currentAccount?.address) {
        throw new Error('No wallet connected');
      }
      tx.transferObjects([withdrawnCoin], currentAccount.address);

      // Execute transaction
      const result = await signAndExecuteTransaction({
        transaction: tx,
      });

      log.info('Subscription balance withdrawn successfully', {
        digest: result?.digest,
        publicationId,
        amountInMist,
      }, 'useSubscriptionWithdrawal');

      setState(prev => ({
        ...prev,
        isWithdrawing: false,
        success: true,
      }));

      // Call success callback if provided
      onSuccess?.();

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to withdraw subscription balance';

      log.error('Failed to withdraw subscription balance', {
        error,
        publicationId,
        amountInSui,
      }, 'useSubscriptionWithdrawal');

      setState(prev => ({
        ...prev,
        isWithdrawing: false,
        error: errorMessage,
      }));

      throw error;
    }
  }, [publicationId, ownerCapId, currentBalance, signAndExecuteTransaction, onSuccess]);

  /**
   * Withdraw full available balance
   */
  const withdrawFullBalance = useCallback(async () => {
    return withdrawBalance(); // No amount = withdraw full balance
  }, [withdrawBalance]);

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
    canWithdraw: !!ownerCapId && !!publicationId && currentBalance > 0,

    // Actions
    withdrawBalance,
    withdrawFullBalance,
    clearError,
    clearSuccess,
  };
};
