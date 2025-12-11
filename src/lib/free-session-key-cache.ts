import type { ExportedSessionKey } from '@mysten/seal';
import { SessionKey } from '@mysten/seal';
import type { SuiClient } from '@mysten/sui/client';
import { CONFIG } from './config';
import { log } from './utils/Logger';
import { getOrCreateFreeArticleKeypair } from './free-article-keypair';

/**
 * Free Session Key Cache Manager
 *
 * Manages Seal session keys for free article decryption.
 * These session keys are automatically signed by the local Ed25519 keypair,
 * allowing wallet-free decryption of free articles.
 *
 * TTL: 30 minutes (maximum allowed by Seal SDK)
 */

const CACHE_KEY = 'inkray-free-session-key';
export const FREE_SESSION_KEY_TTL_MINUTES = 30; // Maximum allowed by Seal SDK

interface CachedFreeSessionKeyData {
  exportedSessionKey: SerializableFreeSessionKeyData;
  packageId: string;
  timestamp: number;
  expiresAt: number;
}

interface SerializableFreeSessionKeyData {
  address: string;
  packageId: string;
  mvrName?: string;
  creationTimeMs: number;
  ttlMin: number;
  personalMessageSignature?: string;
  sessionKey: string;
}

/**
 * Get cached free session key data if valid and not expired
 */
export function getCachedFreeSessionKey(): CachedFreeSessionKeyData | null {
  if (typeof window === 'undefined') return null;

  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) {
      log.debug('No cached free session key found', {}, 'FreeSessionKey');
      return null;
    }

    const data: CachedFreeSessionKeyData = JSON.parse(cached);

    // Validate package ID
    if (data.packageId !== CONFIG.PACKAGE_ID) {
      log.debug(
        'Free session key cache invalid - package ID mismatch',
        {
          cached: data.packageId,
          current: CONFIG.PACKAGE_ID,
        },
        'FreeSessionKey'
      );
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    // Check expiration (with 10 second buffer for safety)
    const now = Date.now();
    if (now >= data.expiresAt - 10000) {
      log.debug(
        'Free session key expired',
        {
          expiresAt: new Date(data.expiresAt).toISOString(),
          now: new Date(now).toISOString(),
        },
        'FreeSessionKey'
      );
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    // Check if session key has signature (required for usage)
    if (!data.exportedSessionKey.personalMessageSignature) {
      log.warn('Cached free session key has no signature, removing', {}, 'FreeSessionKey');
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    log.debug(
      'Valid free session key cache found',
      {
        expiresIn: Math.round((data.expiresAt - now) / 1000 / 60) + ' minutes',
        hasSignature: !!data.exportedSessionKey.personalMessageSignature,
        address: data.exportedSessionKey.address,
      },
      'FreeSessionKey'
    );

    return data;
  } catch (error) {
    log.warn('Failed to read free session key cache', error, 'FreeSessionKey');
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
}

/**
 * Cache a free session key with expiration
 */
export function setCachedFreeSessionKey(
  exportedSessionKey: ExportedSessionKey,
  ttlMin: number
): void {
  if (typeof window === 'undefined') return;

  try {
    const now = Date.now();
    const serializableData: SerializableFreeSessionKeyData = {
      address: exportedSessionKey.address,
      packageId: exportedSessionKey.packageId,
      mvrName: exportedSessionKey.mvrName,
      creationTimeMs: exportedSessionKey.creationTimeMs,
      ttlMin: exportedSessionKey.ttlMin,
      personalMessageSignature: exportedSessionKey.personalMessageSignature,
      sessionKey: exportedSessionKey.sessionKey,
    };

    const data: CachedFreeSessionKeyData = {
      exportedSessionKey: serializableData,
      packageId: CONFIG.PACKAGE_ID,
      timestamp: now,
      expiresAt: now + ttlMin * 60 * 1000,
    };

    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    log.debug(
      'Free session key cached',
      {
        ttlMin,
        expiresAt: new Date(data.expiresAt).toISOString(),
        hasSignature: !!serializableData.personalMessageSignature,
        address: serializableData.address,
      },
      'FreeSessionKey'
    );
  } catch (error) {
    log.error('Failed to cache free session key', { error }, 'FreeSessionKey');
  }
}

/**
 * Clear the free session key cache
 */
export function clearFreeSessionKeyCache(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CACHE_KEY);
  log.debug('Free session key cache cleared', {}, 'FreeSessionKey');
}

/**
 * Deserialize cached data back to ExportedSessionKey format
 */
function deserializeExportedSessionKey(data: SerializableFreeSessionKeyData): ExportedSessionKey {
  return {
    address: data.address,
    packageId: data.packageId,
    mvrName: data.mvrName,
    creationTimeMs: data.creationTimeMs,
    ttlMin: data.ttlMin,
    personalMessageSignature: data.personalMessageSignature,
    sessionKey: data.sessionKey,
  };
}

/**
 * Get a valid free session key (from cache or create new)
 *
 * This function:
 * 1. Checks cache for valid, non-expired session key
 * 2. If not found, creates new session key using local Ed25519 keypair
 * 3. The local keypair auto-signs the session key (no wallet popup!)
 * 4. Caches the new session key
 */
export async function getOrCreateFreeSessionKey(suiClient: SuiClient): Promise<SessionKey> {
  // Try to restore from cache first
  const cached = getCachedFreeSessionKey();
  if (cached) {
    try {
      const exportedKey = deserializeExportedSessionKey(cached.exportedSessionKey);
      const restoredKey = SessionKey.import(exportedKey, suiClient);

      if (!restoredKey.isExpired()) {
        log.debug('Using cached free session key', {}, 'FreeSessionKey');
        return restoredKey;
      }

      log.debug('Cached free session key is expired (SDK check)', {}, 'FreeSessionKey');
    } catch (error) {
      log.warn('Failed to restore free session key from cache', error, 'FreeSessionKey');
    }
  }

  // Get the local keypair (acts as signer)
  const freeKeypair = getOrCreateFreeArticleKeypair();
  const freeAddress = freeKeypair.getPublicKey().toSuiAddress();

  log.debug('Creating new free session key', { address: freeAddress }, 'FreeSessionKey');

  // Create session key with local keypair as signer
  // The Seal SDK will auto-call signer.signPersonalMessage() - no wallet popup!
  const sessionKey = await SessionKey.create({
    address: freeAddress,
    packageId: CONFIG.PACKAGE_ID,
    ttlMin: FREE_SESSION_KEY_TTL_MINUTES,
    signer: freeKeypair, // Ed25519Keypair implements Signer interface
    suiClient,
  });

  // Cache the session key
  try {
    const exported = sessionKey.export();
    setCachedFreeSessionKey(exported, FREE_SESSION_KEY_TTL_MINUTES);
  } catch (error) {
    log.warn('Failed to cache new free session key', error, 'FreeSessionKey');
  }

  log.debug('Created new free session key', { address: freeAddress }, 'FreeSessionKey');
  return sessionKey;
}

/**
 * Get the cache key (for use in cache-manager.ts)
 */
export const FREE_SESSION_KEY_CACHE_KEY = CACHE_KEY;
