import { CONFIG } from './config';
import type { ExportedSessionKey } from '@mysten/seal';
import { log } from './utils/Logger';

/**
 * Cache Manager for Inkray Application
 * 
 * Handles localStorage caching with automatic invalidation when package ID changes.
 * This prevents stale data issues when contracts are redeployed.
 */

// Cache keys
const CACHE_KEYS = {
  PUBLICATION: 'inkray-user-publication',
  ARTICLE_DRAFT: 'inkray-article-draft',
  PACKAGE_ID: 'inkray-package-id', // Track which package ID was used for cache
  SESSION_KEY: 'inkray-session-key', // Cached Seal session key (wallet-based)
  FREE_KEYPAIR: 'inkray-free-keypair', // Local Ed25519 keypair for free content
  FREE_SESSION_KEY: 'inkray-free-session-key', // Cached Seal session key for free content
} as const;

export interface CachedPublicationData {
  publicationId: string;
  vaultId: string;
  ownerCapId: string;
  name: string;
  packageId: string; // Track which package ID this data belongs to
  timestamp: number; // When it was cached
}

export interface CachedDraftData {
  title: string;
  content: string;
  summary: string;
  categoryId: string;
  gated: boolean;
  packageId: string; // Track which package ID this draft belongs to
  timestamp: number;
}

export interface CachedSessionKeyData {
  exportedSessionKey: ExportedSessionKey;
  packageId: string; // Track which package ID this session key belongs to
  timestamp: number; // When it was cached
}

export interface SerializableSessionKeyData {
  address: string;
  packageId: string;
  mvrName?: string;
  creationTimeMs: number;
  ttlMin: number;
  personalMessageSignature?: string;
  sessionKey: string;
  cachePackageId: string; // Our cache validation package ID
  timestamp: number; // When it was cached
}

/**
 * Check if cached data is valid for the current package ID
 */
export function isCacheValid(cachedData: { packageId?: string }): boolean {
  if (!cachedData.packageId) {
    log.debug('Cache invalid: No package ID in cached data', {}, 'CacheManager');
    return false;
  }

  if (cachedData.packageId !== CONFIG.PACKAGE_ID) {
    log.debug('Cache invalid: Package ID mismatch', {
      cached: cachedData.packageId,
      current: CONFIG.PACKAGE_ID
    }, 'CacheManager');
    return false;
  }

  return true;
}

/**
 * Clear all Inkray-related localStorage entries
 */
export function clearInkrayCache(): void {
  // SSR guard - localStorage only available in browser
  if (typeof window === 'undefined') {
    return;
  }

  log.debug('Clearing all Inkray cache entries', {}, 'CacheManager');

  Object.values(CACHE_KEYS).forEach(key => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      log.debug('Cleared cache key', { key }, 'CacheManager');
    }
  });

  log.debug('Cache clearing completed', {}, 'CacheManager');
}

/**
 * Get cached publication data with validation
 */
export function getCachedPublication(): CachedPublicationData | null {
  // SSR guard - localStorage only available in browser
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const cached = localStorage.getItem(CACHE_KEYS.PUBLICATION);
    if (!cached) {
      return null;
    }
    
    const data: CachedPublicationData = JSON.parse(cached);
    
    // Validate cache against current package ID
    if (!isCacheValid(data)) {
      log.debug('Removing invalid publication cache', {}, 'CacheManager');
      localStorage.removeItem(CACHE_KEYS.PUBLICATION);
      return null;
    }

    // Check if cache is too old (optional: 24 hours)
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    if (Date.now() - data.timestamp > maxAge) {
      log.debug('Publication cache expired, clearing', { age: Date.now() - data.timestamp, maxAge }, 'CacheManager');
      localStorage.removeItem(CACHE_KEYS.PUBLICATION);
      return null;
    }

    log.debug('Valid publication cache found', {}, 'CacheManager');
    return data;

  } catch (error) {
    log.error('Error reading publication cache', { error }, 'CacheManager');
    localStorage.removeItem(CACHE_KEYS.PUBLICATION);
    return null;
  }
}

/**
 * Store publication data in cache with current package ID
 */
export function setCachedPublication(data: Omit<CachedPublicationData, 'packageId' | 'timestamp'>): void {
  // SSR guard - localStorage only available in browser
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const cachedData: CachedPublicationData = {
      ...data,
      packageId: CONFIG.PACKAGE_ID,
      timestamp: Date.now(),
    };

    localStorage.setItem(CACHE_KEYS.PUBLICATION, JSON.stringify(cachedData));
    log.debug('Publication cached', { packageId: CONFIG.PACKAGE_ID }, 'CacheManager');

  } catch (error) {
    log.error('Error storing publication cache', { error }, 'CacheManager');
  }
}

/**
 * Get cached article draft with validation
 */
export function getCachedDraft(): CachedDraftData | null {
  // SSR guard - localStorage only available in browser
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const cached = localStorage.getItem(CACHE_KEYS.ARTICLE_DRAFT);
    if (!cached) {
      return null;
    }
    
    const data: CachedDraftData = JSON.parse(cached);

    // Validate cache against current package ID
    if (!isCacheValid(data)) {
      log.debug('Removing invalid draft cache', {}, 'CacheManager');
      localStorage.removeItem(CACHE_KEYS.ARTICLE_DRAFT);
      return null;
    }

    log.debug('Valid draft cache found', {}, 'CacheManager');
    return data;

  } catch (error) {
    log.error('Error reading draft cache', { error }, 'CacheManager');
    localStorage.removeItem(CACHE_KEYS.ARTICLE_DRAFT);
    return null;
  }
}

/**
 * Store article draft in cache with current package ID
 */
export function setCachedDraft(data: Omit<CachedDraftData, 'packageId' | 'timestamp'>): void {
  // SSR guard - localStorage only available in browser
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const cachedData: CachedDraftData = {
      ...data,
      packageId: CONFIG.PACKAGE_ID,
      timestamp: Date.now(),
    };

    localStorage.setItem(CACHE_KEYS.ARTICLE_DRAFT, JSON.stringify(cachedData));
    log.debug('Draft cached', { packageId: CONFIG.PACKAGE_ID }, 'CacheManager');

  } catch (error) {
    log.error('Error storing draft cache', { error }, 'CacheManager');
  }
}

/**
 * Clear only the publication cache
 */
export function clearPublicationCache(): void {
  // SSR guard - localStorage only available in browser
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem(CACHE_KEYS.PUBLICATION);
  log.debug('Publication cache cleared', {}, 'CacheManager');
}

/**
 * Clear only the draft cache
 */
export function clearDraftCache(): void {
  // SSR guard - localStorage only available in browser
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem(CACHE_KEYS.ARTICLE_DRAFT);
  log.debug('Draft cache cleared', {}, 'CacheManager');
}

/**
 * Get cached session key with validation using safe deserialization
 */
export function getCachedSessionKey(): CachedSessionKeyData | null {
  // SSR guard - localStorage only available in browser
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const cached = localStorage.getItem(CACHE_KEYS.SESSION_KEY);
    if (!cached) {
      log.debug('No cached session key found', {}, 'CacheManager');
      return null;
    }

    log.debug('Found cached session key, validating', {}, 'CacheManager');

    const serializableData: SerializableSessionKeyData = JSON.parse(cached);

    // Validate cache against current package ID
    if (serializableData.cachePackageId !== CONFIG.PACKAGE_ID) {
      log.debug('Removing invalid session key cache - package ID mismatch', {
        cached: serializableData.cachePackageId,
        current: CONFIG.PACKAGE_ID
      }, 'CacheManager');
      localStorage.removeItem(CACHE_KEYS.SESSION_KEY);
      return null;
    }

    // Check if session key has signature (required for usage)
    if (!serializableData.personalMessageSignature) {
      log.warn('Cached session key has no signature, removing', {}, 'CacheManager');
      localStorage.removeItem(CACHE_KEYS.SESSION_KEY);
      return null;
    }

    // Deserialize back to expected format
    const exportedSessionKey = deserializeExportedSessionKey(serializableData);

    const result: CachedSessionKeyData = {
      exportedSessionKey,
      packageId: serializableData.cachePackageId,
      timestamp: serializableData.timestamp,
    };

    log.debug('Valid session key cache found and deserialized', {
      address: exportedSessionKey.address,
      packageId: exportedSessionKey.packageId,
      hasSignature: !!exportedSessionKey.personalMessageSignature,
      ttlMin: exportedSessionKey.ttlMin,
      age: Date.now() - serializableData.timestamp
    }, 'CacheManager');

    return result;

  } catch (error) {
    log.error('Error reading session key cache', { error }, 'CacheManager');
    localStorage.removeItem(CACHE_KEYS.SESSION_KEY);
    return null;
  }
}

/**
 * Safely serialize ExportedSessionKey by extracting only serializable properties
 */
function serializeExportedSessionKey(exportedSessionKey: ExportedSessionKey): SerializableSessionKeyData {
  return {
    address: exportedSessionKey.address,
    packageId: exportedSessionKey.packageId,
    mvrName: exportedSessionKey.mvrName,
    creationTimeMs: exportedSessionKey.creationTimeMs,
    ttlMin: exportedSessionKey.ttlMin,
    personalMessageSignature: exportedSessionKey.personalMessageSignature,
    sessionKey: exportedSessionKey.sessionKey,
    cachePackageId: CONFIG.PACKAGE_ID,
    timestamp: Date.now(),
  };
}

/**
 * Deserialize session key data back to ExportedSessionKey format
 */
function deserializeExportedSessionKey(data: SerializableSessionKeyData): ExportedSessionKey {
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
 * Store session key in cache with current package ID using safe serialization
 */
export function setCachedSessionKey(exportedSessionKey: ExportedSessionKey): void {
  // SSR guard - localStorage only available in browser
  if (typeof window === 'undefined') {
    return;
  }

  try {
    log.debug('Attempting to cache session key', {}, 'CacheManager');

    // Use safe serialization to avoid "not serializable" errors
    const serializableData = serializeExportedSessionKey(exportedSessionKey);

    log.debug('Serialized session key data', {
      address: serializableData.address,
      packageId: serializableData.packageId,
      hasSignature: !!serializableData.personalMessageSignature,
      ttlMin: serializableData.ttlMin,
      timestamp: serializableData.timestamp
    }, 'CacheManager');

    localStorage.setItem(CACHE_KEYS.SESSION_KEY, JSON.stringify(serializableData));
    log.debug('Session key successfully cached', { packageId: CONFIG.PACKAGE_ID }, 'CacheManager');

  } catch (error) {
    log.error('Error storing session key cache', { error }, 'CacheManager');
    log.error('Failed to serialize session key', { exportedSessionKey }, 'CacheManager');
  }
}

/**
 * Clear only the session key cache
 */
export function clearSessionKeyCache(): void {
  // SSR guard - localStorage only available in browser
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem(CACHE_KEYS.SESSION_KEY);
  log.debug('Session key cache cleared', {}, 'CacheManager');
}

/**
 * Clear user-specific cache data (publications, drafts, session keys)
 * Preserves non-user-specific data like package ID and free keypair
 * Note: FREE_KEYPAIR is NOT user-specific (it's device-specific for free content)
 */
export function clearUserSpecificCache(): void {
  // SSR guard - localStorage only available in browser
  if (typeof window === 'undefined') {
    return;
  }

  log.debug('Clearing user-specific cache data', {}, 'CacheManager');

  const userSpecificKeys = [
    CACHE_KEYS.PUBLICATION,
    CACHE_KEYS.ARTICLE_DRAFT,
    CACHE_KEYS.SESSION_KEY,
    // Note: FREE_KEYPAIR is NOT cleared here - it's device-specific, not user-specific
    // FREE_SESSION_KEY could be cleared, but we keep it since it's not tied to wallet
  ];

  userSpecificKeys.forEach(key => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      log.debug('Cleared cache key', { key }, 'CacheManager');
    }
  });

  log.debug('User-specific cache clearing completed', {}, 'CacheManager');
}

/**
 * Clear cache when wallet address changes (account switch)
 */
export function clearOnWalletChange(previousAddress: string | null, newAddress: string): void {
  log.debug('Clearing cache due to wallet address change', {
    previous: previousAddress ? previousAddress.substring(0, 8) + '...' : 'none',
    new: newAddress.substring(0, 8) + '...'
  }, 'CacheManager');

  // Clear all user-specific data since it belongs to the previous account
  clearUserSpecificCache();

  log.debug('Cache cleared for wallet address change', {}, 'CacheManager');
}

/**
 * Clear cache when wallet disconnects
 */
export function clearOnDisconnect(): void {
  log.debug('Clearing cache due to wallet disconnect', {}, 'CacheManager');

  // Clear all cache except package ID (non-user-specific)
  clearUserSpecificCache();

  log.debug('Cache cleared for wallet disconnect', {}, 'CacheManager');
}

/**
 * Check if the current package ID has changed since last app usage
 * This can be used to detect contract redeployments
 */
export function checkPackageIdChange(): { hasChanged: boolean; oldPackageId?: string; newPackageId: string } {
  // SSR guard - localStorage only available in browser
  if (typeof window === 'undefined') {
    return { hasChanged: false, newPackageId: CONFIG.PACKAGE_ID };
  }

  const lastPackageId = localStorage.getItem(CACHE_KEYS.PACKAGE_ID);
  const currentPackageId = CONFIG.PACKAGE_ID;

  // Update stored package ID
  localStorage.setItem(CACHE_KEYS.PACKAGE_ID, currentPackageId);

  if (lastPackageId && lastPackageId !== currentPackageId) {
    log.debug('Package ID change detected', {
      oldPackageId: lastPackageId,
      newPackageId: currentPackageId
    }, 'CacheManager');
    return {
      hasChanged: true,
      oldPackageId: lastPackageId,
      newPackageId: currentPackageId,
    };
  }

  return {
    hasChanged: false,
    newPackageId: currentPackageId,
  };
}

/**
 * Initialize cache manager - call this when app starts
 * Automatically clears cache if package ID has changed
 */
export function initializeCacheManager(): void {
  log.debug('Initializing Inkray cache manager', {}, 'CacheManager');

  const packageChange = checkPackageIdChange();

  if (packageChange.hasChanged) {
    log.debug('Package ID changed - clearing all cache to prevent stale data', {}, 'CacheManager');
    clearInkrayCache();
  }

  log.debug('Current package ID', { packageId: packageChange.newPackageId }, 'CacheManager');
}

/**
 * Get cache statistics for debugging
 */
export function getCacheStats(): {
  hasPublication: boolean;
  hasDraft: boolean;
  hasSessionKey: boolean;
  hasFreeKeypair: boolean;
  hasFreeSessionKey: boolean;
  packageId: string;
  cacheEntries: string[];
} {
  // SSR guard - localStorage only available in browser
  if (typeof window === 'undefined') {
    return {
      hasPublication: false,
      hasDraft: false,
      hasSessionKey: false,
      hasFreeKeypair: false,
      hasFreeSessionKey: false,
      packageId: CONFIG.PACKAGE_ID,
      cacheEntries: [],
    };
  }

  const cacheEntries = Object.values(CACHE_KEYS).filter(key =>
    localStorage.getItem(key) !== null
  );

  return {
    hasPublication: !!getCachedPublication(),
    hasDraft: !!getCachedDraft(),
    hasSessionKey: !!getCachedSessionKey(),
    hasFreeKeypair: !!localStorage.getItem(CACHE_KEYS.FREE_KEYPAIR),
    hasFreeSessionKey: !!localStorage.getItem(CACHE_KEYS.FREE_SESSION_KEY),
    packageId: CONFIG.PACKAGE_ID,
    cacheEntries,
  };
}