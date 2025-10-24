import { useEffect, useRef } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { clearOnWalletChange, clearOnDisconnect } from '@/lib/cache-manager';

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
        console.log('🔗 Wallet connection detected on init:', {
          address: currentAddress.substring(0, 8) + '...',
        });
      }
      return;
    }

    // Detect wallet changes
    if (lastKnownAddress.current !== currentAddress) {
      console.log('🔄 Wallet address change detected:', {
        previous: lastKnownAddress.current ? lastKnownAddress.current.substring(0, 8) + '...' : 'none',
        current: currentAddress ? currentAddress.substring(0, 8) + '...' : 'none',
        action: currentAddress ? 'switch' : 'disconnect'
      });

      if (currentAddress) {
        // User switched to a different wallet account
        console.log('👤 Account switch detected - clearing user-specific cache');
        clearOnWalletChange(lastKnownAddress.current, currentAddress);
      } else {
        // User disconnected wallet
        console.log('🔌 Wallet disconnect detected - clearing all cache');
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