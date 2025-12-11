import { useState, useCallback, useEffect } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { followsAPI, publicationsAPI } from '@/lib/api';
import { log } from '@/lib/utils/Logger';
import { useEnhancedTransaction } from './useEnhancedTransaction';
import { DateRange, getDateRangeFromPreset } from '@/lib/followerFilters';
import { INKRAY_CONFIG } from '@/lib/sui-clients';
import { PublicationArticle } from '@/types/article';

export type NftAirdropStep = 1 | 2 | 3;

export type NftAirdropStatus = 'idle' | 'loading' | 'success' | 'error';

export interface NftAirdropState {
  step: NftAirdropStep;
  // Step 1: Article selection
  selectedArticle: PublicationArticle | null;
  articles: PublicationArticle[];
  isLoadingArticles: boolean;
  // Step 2: Recipient filters
  dateRange: DateRange;
  customStartDate: string;
  customEndDate: string;
  // Recipients data
  recipients: string[];
  recipientCount: number;
  isLoadingRecipients: boolean;
  // Transaction state
  status: NftAirdropStatus;
  error: string | null;
  txDigest: string | null;
}

interface UseNftAirdropOptions {
  publicationId: string;
}

const initialState: Omit<NftAirdropState, 'step'> = {
  selectedArticle: null,
  articles: [],
  isLoadingArticles: false,
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
 * Hook for managing NFT airdrops to publication followers
 *
 * Handles:
 * - Multi-step form state management
 * - Article fetching for selection
 * - Recipient wallet fetching based on filters
 * - PTB construction for batch NFT minting
 * - Transaction execution
 */
export function useNftAirdrop({ publicationId }: UseNftAirdropOptions) {
  const currentAccount = useCurrentAccount();
  const { signAndExecuteTransaction } = useEnhancedTransaction();

  const [state, setState] = useState<NftAirdropState>({
    step: 1,
    ...initialState,
  });

  // Fetch articles on mount
  const fetchArticles = useCallback(async () => {
    if (!publicationId) return;

    setState(prev => ({ ...prev, isLoadingArticles: true }));

    try {
      const response = await publicationsAPI.getPublicationArticles(publicationId, {
        limit: 50, // API max limit is 50
      });

      if (response.data.success) {
        const articles = response.data.data.articles as PublicationArticle[];
        setState(prev => ({
          ...prev,
          articles,
          isLoadingArticles: false,
        }));
      } else {
        throw new Error(response.data.message || 'Failed to fetch articles');
      }
    } catch (error) {
      log.error('Failed to fetch articles', error, 'useNftAirdrop');
      setState(prev => ({
        ...prev,
        articles: [],
        isLoadingArticles: false,
        error: error instanceof Error ? error.message : 'Failed to fetch articles',
      }));
    }
  }, [publicationId]);

  // Fetch articles on mount
  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  // Step navigation
  const goToStep = useCallback((step: NftAirdropStep) => {
    setState(prev => ({ ...prev, step }));
  }, []);

  const nextStep = useCallback(() => {
    setState(prev => ({
      ...prev,
      step: Math.min(prev.step + 1, 3) as NftAirdropStep,
    }));
  }, []);

  const prevStep = useCallback(() => {
    setState(prev => ({
      ...prev,
      step: Math.max(prev.step - 1, 1) as NftAirdropStep,
    }));
  }, []);

  // Step 1: Article selection
  const setSelectedArticle = useCallback((article: PublicationArticle | null) => {
    setState(prev => ({
      ...prev,
      selectedArticle: article,
    }));
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
      log.error('Failed to fetch recipients', error, 'useNftAirdrop');
      setState(prev => ({
        ...prev,
        recipients: [],
        recipientCount: 0,
        isLoadingRecipients: false,
        error: error instanceof Error ? error.message : 'Failed to fetch recipients',
      }));
    }
  }, [publicationId, state.dateRange, state.customStartDate, state.customEndDate]);

  // Execute NFT airdrop transaction
  const executeNftAirdrop = useCallback(async (): Promise<void> => {
    if (!currentAccount?.address) {
      setState(prev => ({ ...prev, error: 'Wallet not connected', status: 'error' }));
      return;
    }

    if (!state.selectedArticle) {
      setState(prev => ({ ...prev, error: 'No article selected', status: 'error' }));
      return;
    }

    if (state.recipients.length === 0) {
      setState(prev => ({ ...prev, error: 'No recipients selected', status: 'error' }));
      return;
    }

    setState(prev => ({ ...prev, status: 'loading', error: null }));

    try {
      log.info('Starting NFT airdrop transaction', {
        articleId: state.selectedArticle.id,
        articleTitle: state.selectedArticle.title,
        recipientCount: state.recipients.length,
      }, 'useNftAirdrop');

      const tx = new Transaction();
      const mintConfig = tx.object(INKRAY_CONFIG.NFT_MINT_CONFIG_ID);

      // Split all zero-payment coins at once (one per recipient)
      const coins = tx.splitCoins(tx.gas, state.recipients.map(() => 0));

      // Mint and transfer NFT for each recipient
      for (let i = 0; i < state.recipients.length; i++) {
        const [nft] = tx.moveCall({
          target: `${INKRAY_CONFIG.PACKAGE_ID}::nft::mint`,
          arguments: [
            tx.pure.address(state.recipients[i]),
            tx.pure.id(state.selectedArticle.id),
            mintConfig,
            coins[i],
          ],
        });
        tx.transferObjects([nft], tx.pure.address(state.recipients[i]));
      }

      // Sign and execute the transaction
      const result = await signAndExecuteTransaction({ transaction: tx });

      // Handle the result
      if (result && 'digest' in result) {
        log.info('NFT airdrop transaction successful', {
          digest: result.digest,
          recipientCount: state.recipients.length,
        }, 'useNftAirdrop');

        setState(prev => ({
          ...prev,
          status: 'success',
          txDigest: result.digest,
          error: null,
        }));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'NFT airdrop transaction failed';
      log.error('NFT airdrop transaction failed', error, 'useNftAirdrop');

      setState(prev => ({
        ...prev,
        status: 'error',
        error: errorMessage,
      }));
    }
  }, [currentAccount, state.selectedArticle, state.recipients, signAndExecuteTransaction]);

  // Reset state
  const reset = useCallback(() => {
    setState(prev => ({
      step: 1,
      ...initialState,
      // Keep articles loaded
      articles: prev.articles,
      isLoadingArticles: false,
    }));
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null, status: 'idle' }));
  }, []);

  return {
    // State
    ...state,

    // Navigation
    goToStep,
    nextStep,
    prevStep,

    // Step 1 actions
    setSelectedArticle,
    fetchArticles,

    // Step 2 actions
    setDateRange,
    setCustomStartDate,
    setCustomEndDate,
    fetchRecipients,

    // Step 3 actions
    executeNftAirdrop,

    // Utility
    reset,
    clearError,
  };
}
