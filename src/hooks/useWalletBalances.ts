import { useState, useEffect, useCallback } from 'react';
import { useSuiClient } from '@mysten/dapp-kit';
import { CoinBalance, CoinMetadata } from '@mysten/sui/client';
import { log } from '@/lib/utils/Logger';

export interface TokenBalance {
  coinType: string;
  symbol: string;
  name: string;
  totalBalance: bigint;
  decimals: number;
  iconUrl?: string;
}

interface UseWalletBalancesState {
  balances: TokenBalance[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Extract token symbol from coin type (fallback when metadata unavailable)
 * e.g., "0x2::sui::SUI" -> "SUI"
 */
function extractSymbolFromCoinType(coinType: string): string {
  const parts = coinType.split('::');
  return parts[parts.length - 1] || 'Unknown';
}

/**
 * Extract readable name from coin type (fallback when metadata unavailable)
 * e.g., "0x2::sui::SUI" -> "SUI"
 * e.g., "0xabc123::my_token::MY_TOKEN" -> "MY TOKEN"
 */
function extractNameFromCoinType(coinType: string): string {
  const symbol = extractSymbolFromCoinType(coinType);
  // Convert snake_case or SCREAMING_CASE to Title Case
  return symbol.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Hook for fetching all token balances in a user's wallet
 *
 * Uses suiClient.getAllBalances() to retrieve all coin balances,
 * then fetches metadata for each coin type using getCoinMetadata()
 * for accurate decimals, names, symbols, and icons.
 */
export function useWalletBalances(address: string | undefined) {
  const suiClient = useSuiClient();

  const [state, setState] = useState<UseWalletBalancesState>({
    balances: [],
    isLoading: false,
    error: null,
  });

  const fetchBalances = useCallback(async () => {
    if (!address) {
      setState({
        balances: [],
        isLoading: false,
        error: null,
      });
      return;
    }

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      log.debug('Fetching wallet balances', { address }, 'useWalletBalances');

      // Fetch all coin balances
      const allBalances: CoinBalance[] = await suiClient.getAllBalances({
        owner: address,
      });

      // Filter to only coins with positive balance
      const nonZeroBalances = allBalances.filter(
        balance => BigInt(balance.totalBalance) > BigInt(0)
      );

      // Fetch metadata for each coin type in parallel
      const metadataPromises = nonZeroBalances.map(balance =>
        suiClient.getCoinMetadata({ coinType: balance.coinType })
          .catch(() => null) // Handle errors gracefully - return null if metadata unavailable
      );
      const metadataResults: (CoinMetadata | null)[] = await Promise.all(metadataPromises);

      // Combine balance + metadata into TokenBalance
      const tokenBalances: TokenBalance[] = nonZeroBalances.map((balance, index) => {
        const metadata = metadataResults[index];
        return {
          coinType: balance.coinType,
          totalBalance: BigInt(balance.totalBalance),
          // Use metadata if available, fallback to extracted values
          symbol: metadata?.symbol || extractSymbolFromCoinType(balance.coinType),
          name: metadata?.name || extractNameFromCoinType(balance.coinType),
          decimals: metadata?.decimals ?? 9, // Default to 9 decimals (SUI standard)
          iconUrl: metadata?.iconUrl || undefined,
        };
      }).sort((a, b) => {
        // Sort SUI first, then by balance descending
        if (a.coinType === '0x2::sui::SUI') return -1;
        if (b.coinType === '0x2::sui::SUI') return 1;
        return Number(b.totalBalance - a.totalBalance);
      });

      log.debug('Wallet balances fetched successfully', {
        address,
        tokenCount: tokenBalances.length,
      }, 'useWalletBalances');

      setState({
        balances: tokenBalances,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch wallet balances';

      log.error('Failed to fetch wallet balances', {
        error,
        address,
      }, 'useWalletBalances');

      setState({
        balances: [],
        isLoading: false,
        error: errorMessage,
      });
    }
  }, [address, suiClient]);

  const refresh = useCallback(() => {
    fetchBalances();
  }, [fetchBalances]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  return {
    ...state,
    refresh,
    hasBalances: state.balances.length > 0,
  };
}

/**
 * Format balance with proper decimals for display
 */
export function formatTokenBalance(balance: bigint, decimals: number): string {
  const divisor = BigInt(10 ** decimals);
  const wholePart = balance / divisor;
  const fractionalPart = balance % divisor;

  // Format fractional part with leading zeros
  const fractionalStr = fractionalPart.toString().padStart(decimals, '0');

  // Trim trailing zeros but keep at least 2 decimal places for display
  const trimmedFractional = fractionalStr.replace(/0+$/, '').padEnd(2, '0').slice(0, 4);

  if (trimmedFractional === '00') {
    return wholePart.toString();
  }

  return `${wholePart}.${trimmedFractional}`;
}

/**
 * Parse user input amount to smallest unit (e.g., MIST for SUI)
 */
export function parseAmountToSmallestUnit(amount: string, decimals: number): bigint {
  const parts = amount.split('.');
  const wholePart = parts[0] || '0';
  let fractionalPart = parts[1] || '';

  // Pad or truncate fractional part to match decimals
  fractionalPart = fractionalPart.padEnd(decimals, '0').slice(0, decimals);

  const combined = wholePart + fractionalPart;
  return BigInt(combined);
}
