import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { CONFIG } from './config';
import { log } from './utils/Logger';

/**
 * Free Article Keypair Manager
 *
 * Manages a locally-generated Ed25519 keypair stored in localStorage.
 * This keypair is used to auto-sign Seal session keys for free article decryption,
 * allowing users to read free articles without connecting a wallet.
 *
 * Security Note: This keypair has no security implications since:
 * - It controls no on-chain assets
 * - Free articles use seal_approve_free policy which only validates publication ID
 * - Anyone can decrypt free articles anyway
 */

const CACHE_KEY = 'inkray-free-keypair';

interface FreeArticleKeypairData {
  secretKey: string; // Bech32-encoded secret key
  address: string; // Derived Sui address
  packageId: string; // Package ID for cache validation
  timestamp: number; // Creation timestamp
}

/**
 * Get existing keypair from localStorage or generate a new one
 */
export function getOrCreateFreeArticleKeypair(): Ed25519Keypair {
  // SSR guard - localStorage only available in browser
  if (typeof window === 'undefined') {
    throw new Error('Free article keypair can only be used in browser environment');
  }

  // Try to restore existing keypair
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    try {
      const data: FreeArticleKeypairData = JSON.parse(cached);

      // Validate package ID - regenerate on package change
      if (data.packageId !== CONFIG.PACKAGE_ID) {
        log.debug(
          'Free keypair package ID mismatch, regenerating',
          {
            cached: data.packageId,
            current: CONFIG.PACKAGE_ID,
          },
          'FreeKeypair'
        );
        localStorage.removeItem(CACHE_KEY);
      } else {
        // Restore keypair from secret key
        const keypair = Ed25519Keypair.fromSecretKey(data.secretKey);
        log.debug(
          'Restored free article keypair from cache',
          {
            address: keypair.getPublicKey().toSuiAddress(),
          },
          'FreeKeypair'
        );
        return keypair;
      }
    } catch (error) {
      log.warn('Failed to restore free keypair from cache, regenerating', error, 'FreeKeypair');
      localStorage.removeItem(CACHE_KEY);
    }
  }

  // Generate new keypair
  const keypair = Ed25519Keypair.generate();
  const address = keypair.getPublicKey().toSuiAddress();

  // Cache the keypair
  const cacheData: FreeArticleKeypairData = {
    secretKey: keypair.getSecretKey(), // Bech32-encoded
    address,
    packageId: CONFIG.PACKAGE_ID,
    timestamp: Date.now(),
  };

  localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  log.debug('Generated new free article keypair', { address }, 'FreeKeypair');

  return keypair;
}

/**
 * Get the Sui address derived from the free article keypair
 */
export function getFreeArticleAddress(): string {
  const keypair = getOrCreateFreeArticleKeypair();
  return keypair.getPublicKey().toSuiAddress();
}

/**
 * Clear the cached free article keypair
 */
export function clearFreeArticleKeypair(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CACHE_KEY);
  log.debug('Free article keypair cleared', {}, 'FreeKeypair');
}

/**
 * Check if a valid free article keypair exists in cache
 */
export function hasFreeArticleKeypair(): boolean {
  if (typeof window === 'undefined') return false;

  const cached = localStorage.getItem(CACHE_KEY);
  if (!cached) return false;

  try {
    const data: FreeArticleKeypairData = JSON.parse(cached);
    return data.packageId === CONFIG.PACKAGE_ID;
  } catch {
    return false;
  }
}

/**
 * Get the cache key (for use in cache-manager.ts)
 */
export const FREE_KEYPAIR_CACHE_KEY = CACHE_KEY;
