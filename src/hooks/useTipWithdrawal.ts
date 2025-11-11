import { useState, useCallback } from 'react';
import { Transaction } from '@mysten/sui/transactions';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useEnhancedTransaction } from '@/hooks/useEnhancedTransaction';
import { INKRAY_CONFIG } from '@/lib/sui-clients';
import { log } from '@/lib/utils/Logger';

interface WithdrawalState {
  isWithdrawing: boolean;
  error: string | null;
  success: boolean;
}

interface UseTipWithdrawalParams {
  publicationId: string;
  ownerCapId?: string;
  currentBalance: number; // Current balance in MIST
  onSuccess?: () => void;
}

/**
 * Hook for withdrawing all tips from a publication
 *
 * Provides functionality to:
 * - Withdraw all accumulated tips via smart contract
 * - Handle PTB (Programmable Transaction Block) construction
 * - Transfer withdrawn SUI tokens to sender
 * - Manage withdrawal states and error handling
 */
export const useTipWithdrawal = ({
  publicationId,
  ownerCapId,
  currentBalance,
  onSuccess,
}: UseTipWithdrawalParams) => {
  const currentAccount = useCurrentAccount();
  const { signAndExecuteTransaction } = useEnhancedTransaction();

  const [state, setState] = useState<WithdrawalState>({
    isWithdrawing: false,
    error: null,
    success: false,
  });

  /**
   * Withdraw all tips from the publication
   * This function withdraws the entire tip balance
   */
  const withdrawAllTips = useCallback(async () => {
    if (!publicationId) {
      throw new Error('Publication ID is required');
    }

    if (!ownerCapId) {
      throw new Error('Owner capability ID is required. Only publication owners can withdraw tips.');
    }

    if (currentBalance <= 0) {
      throw new Error('No tips available to withdraw');
    }

    setState(prev => ({
      ...prev,
      isWithdrawing: true,
      error: null,
      success: false,
    }));

    try {
      log.info('Withdrawing all tips', {
        publicationId,
        ownerCapId,
        currentBalance,
      }, 'useTipWithdrawal');

      // Build transaction
      const tx = new Transaction();

      // Call withdraw_all_tips - returns Coin<SUI>
      const [withdrawnCoin] = tx.moveCall({
        target: `${INKRAY_CONFIG.PACKAGE_ID}::platform_economics::withdraw_all_tips`,
        arguments: [
          tx.object(ownerCapId),      // PublicationOwnerCap
          tx.object(publicationId),   // &mut Publication
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

      log.info('Tips withdrawn successfully', {
        digest: result?.digest,
        publicationId,
        currentBalance,
      }, 'useTipWithdrawal');

      setState(prev => ({
        ...prev,
        isWithdrawing: false,
        success: true,
      }));

      // Call success callback if provided
      onSuccess?.();

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to withdraw tips';

      log.error('Failed to withdraw tips', {
        error,
        publicationId,
      }, 'useTipWithdrawal');

      setState(prev => ({
        ...prev,
        isWithdrawing: false,
        error: errorMessage,
      }));

      throw error;
    }
  }, [publicationId, ownerCapId, currentBalance, signAndExecuteTransaction, currentAccount?.address, onSuccess]);

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
    withdrawAllTips,
    clearError,
    clearSuccess,
  };
};
