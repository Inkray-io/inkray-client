import { useEffect, useRef } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { clearOnWalletChange, clearOnDisconnect } from '@/lib/cache-manager';
import { log } from '@/lib/utils/Logger';

/**
 * Hook to detect wallet account changes and clear relevant cache data
 * 
 * This hook monitors wallet address changes and clears user-specific cached data
 * when users switch accounts or disconnect their wallet to prevent stale data issues.
 */
export const useWalletChangeDetection = () => {
  const currentAccount = useCurrentAccount();
  const lastKnownAddress = useRef<string | null>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    const currentAddress = currentAccount?.address || null;
    
    // Skip the initial run to avoid clearing cache on first load
    if (!isInitialized.current) {
      lastKnownAddress.current = currentAddress;
      isInitialized.current = true;
      
      if (currentAddress) {
        log.debug('Wallet connection detected on init', {
          address: currentAddress.substring(0, 8) + '...',
        }, 'useWalletChangeDetection');
      }
      return;
    }

    // Detect wallet changes
    if (lastKnownAddress.current !== currentAddress) {
      log.debug('Wallet address change detected', {
        previous: lastKnownAddress.current ? lastKnownAddress.current.substring(0, 8) + '...' : 'none',
        current: currentAddress ? currentAddress.substring(0, 8) + '...' : 'none',
        action: currentAddress ? 'switch' : 'disconnect'
      }, 'useWalletChangeDetection');

      if (currentAddress) {
        // User switched to a different wallet account
        log.debug('Account switch detected - clearing user-specific cache', {}, 'useWalletChangeDetection');
        clearOnWalletChange(lastKnownAddress.current, currentAddress);
      } else {
        // User disconnected wallet
        log.debug('Wallet disconnect detected - clearing all cache', {}, 'useWalletChangeDetection');
        clearOnDisconnect();
      }

      // Update the last known address
      lastKnownAddress.current = currentAddress;
    }
  }, [currentAccount?.address]);

  return {
    currentAddress: currentAccount?.address || null,
    isWalletConnected: !!currentAccount,
  };
};