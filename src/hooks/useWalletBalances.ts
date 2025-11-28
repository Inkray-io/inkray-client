import { useState, useEffect, useCallback } from 'react';
import { useSuiClient } from '@mysten/dapp-kit';
import { CoinBalance } from '@mysten/sui/client';
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
 * Extract token symbol from coin type
 * e.g., "0x2::sui::SUI" -> "SUI"
 */
function extractSymbolFromCoinType(coinType: string): string {
  const parts = coinType.split('::');
  return parts[parts.length - 1] || 'Unknown';
}

/**
 * Extract readable name from coin type
 * e.g., "0x2::sui::SUI" -> "SUI"
 * e.g., "0xabc123::my_token::MY_TOKEN" -> "MY TOKEN"
 */
function extractNameFromCoinType(coinType: string): string {
  const symbol = extractSymbolFromCoinType(coinType);
  // Convert snake_case or SCREAMING_CASE to Title Case
  return symbol.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Get decimals for known coin types (defaults to 9 for most Sui tokens)
 */
function getDecimalsForCoinType(coinType: string): number {
  // SUI uses 9 decimals, most tokens on Sui follow this convention
  // In a production app, you'd fetch this from the coin metadata
  return 9;
}

/**
 * Hook for fetching all token balances in a user's wallet
 *
 * Uses suiClient.getAllBalances() to retrieve all coin balances,
 * then formats them for display with symbol, name, and formatted balance.
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

      // Transform to our TokenBalance format
      const tokenBalances: TokenBalance[] = allBalances
        .filter(balance => BigInt(balance.totalBalance) > 0n)
        .map(balance => ({
          coinType: balance.coinType,
          symbol: extractSymbolFromCoinType(balance.coinType),
          name: extractNameFromCoinType(balance.coinType),
          totalBalance: BigInt(balance.totalBalance),
          decimals: getDecimalsForCoinType(balance.coinType),
        }))
        .sort((a, b) => {
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
