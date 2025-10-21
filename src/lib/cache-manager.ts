import { CONFIG } from './config';
import type { ExportedSessionKey } from '@mysten/seal';

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
  SESSION_KEY: 'inkray-session-key', // Cached Seal session key
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
    console.log('📦 Cache invalid: No package ID in cached data');
    return false;
  }
  
  if (cachedData.packageId !== CONFIG.PACKAGE_ID) {
    console.log(`📦 Cache invalid: Package ID mismatch. Cached: ${cachedData.packageId}, Current: ${CONFIG.PACKAGE_ID}`);
    return false;
  }
  
  return true;
}

/**
 * Clear all Inkray-related localStorage entries
 */
export function clearInkrayCache(): void {
  console.log('🧹 Clearing all Inkray cache entries...');
  
  Object.values(CACHE_KEYS).forEach(key => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      console.log(`  ✅ Cleared: ${key}`);
    }
  });
  
  console.log('🧹 Cache clearing completed');
}

/**
 * Get cached publication data with validation
 */
export function getCachedPublication(): CachedPublicationData | null {
  try {
    const cached = localStorage.getItem(CACHE_KEYS.PUBLICATION);
    if (!cached) {
      return null;
    }
    
    const data: CachedPublicationData = JSON.parse(cached);
    
    // Validate cache against current package ID
    if (!isCacheValid(data)) {
      console.log('📦 Removing invalid publication cache');
      localStorage.removeItem(CACHE_KEYS.PUBLICATION);
      return null;
    }
    
    // Check if cache is too old (optional: 24 hours)
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    if (Date.now() - data.timestamp > maxAge) {
      console.log('⏰ Publication cache expired, clearing...');
      localStorage.removeItem(CACHE_KEYS.PUBLICATION);
      return null;
    }
    
    console.log('✅ Valid publication cache found');
    return data;
    
  } catch (error) {
    console.error('❌ Error reading publication cache:', error);
    localStorage.removeItem(CACHE_KEYS.PUBLICATION);
    return null;
  }
}

/**
 * Store publication data in cache with current package ID
 */
export function setCachedPublication(data: Omit<CachedPublicationData, 'packageId' | 'timestamp'>): void {
  try {
    const cachedData: CachedPublicationData = {
      ...data,
      packageId: CONFIG.PACKAGE_ID,
      timestamp: Date.now(),
    };
    
    localStorage.setItem(CACHE_KEYS.PUBLICATION, JSON.stringify(cachedData));
    console.log(`✅ Publication cached with package ID: ${CONFIG.PACKAGE_ID}`);
    
  } catch (error) {
    console.error('❌ Error storing publication cache:', error);
  }
}

/**
 * Get cached article draft with validation
 */
export function getCachedDraft(): CachedDraftData | null {
  try {
    const cached = localStorage.getItem(CACHE_KEYS.ARTICLE_DRAFT);
    if (!cached) {
      return null;
    }
    
    const data: CachedDraftData = JSON.parse(cached);
    
    // Validate cache against current package ID
    if (!isCacheValid(data)) {
      console.log('📦 Removing invalid draft cache');
      localStorage.removeItem(CACHE_KEYS.ARTICLE_DRAFT);
      return null;
    }
    
    console.log('✅ Valid draft cache found');
    return data;
    
  } catch (error) {
    console.error('❌ Error reading draft cache:', error);
    localStorage.removeItem(CACHE_KEYS.ARTICLE_DRAFT);
    return null;
  }
}

/**
 * Store article draft in cache with current package ID
 */
export function setCachedDraft(data: Omit<CachedDraftData, 'packageId' | 'timestamp'>): void {
  try {
    const cachedData: CachedDraftData = {
      ...data,
      packageId: CONFIG.PACKAGE_ID,
      timestamp: Date.now(),
    };
    
    localStorage.setItem(CACHE_KEYS.ARTICLE_DRAFT, JSON.stringify(cachedData));
    console.log(`✅ Draft cached with package ID: ${CONFIG.PACKAGE_ID}`);
    
  } catch (error) {
    console.error('❌ Error storing draft cache:', error);
  }
}

/**
 * Clear only the publication cache
 */
export function clearPublicationCache(): void {
  localStorage.removeItem(CACHE_KEYS.PUBLICATION);
  console.log('🧹 Publication cache cleared');
}

/**
 * Clear only the draft cache
 */
export function clearDraftCache(): void {
  localStorage.removeItem(CACHE_KEYS.ARTICLE_DRAFT);
  console.log('🧹 Draft cache cleared');
}

/**
 * Get cached session key with validation using safe deserialization
 */
export function getCachedSessionKey(): CachedSessionKeyData | null {
  try {
    const cached = localStorage.getItem(CACHE_KEYS.SESSION_KEY);
    if (!cached) {
      console.log('🔍 No cached session key found');
      return null;
    }
    
    console.log('🔍 Found cached session key, validating...');
    
    const serializableData: SerializableSessionKeyData = JSON.parse(cached);
    
    // Validate cache against current package ID
    if (serializableData.cachePackageId !== CONFIG.PACKAGE_ID) {
      console.log(`📦 Removing invalid session key cache - package ID mismatch: ${serializableData.cachePackageId} != ${CONFIG.PACKAGE_ID}`);
      localStorage.removeItem(CACHE_KEYS.SESSION_KEY);
      return null;
    }
    
    // Check if session key has signature (required for usage)
    if (!serializableData.personalMessageSignature) {
      console.log('⚠️ Cached session key has no signature, removing...');
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
    
    console.log('✅ Valid session key cache found and deserialized');
    console.log('📝 Cache details:', {
      address: exportedSessionKey.address,
      packageId: exportedSessionKey.packageId,
      hasSignature: !!exportedSessionKey.personalMessageSignature,
      ttlMin: exportedSessionKey.ttlMin,
      age: Date.now() - serializableData.timestamp
    });
    
    return result;
    
  } catch (error) {
    console.error('❌ Error reading session key cache:', error);
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
  try {
    console.log('💾 Attempting to cache session key...');
    
    // Use safe serialization to avoid "not serializable" errors
    const serializableData = serializeExportedSessionKey(exportedSessionKey);
    
    console.log('📝 Serialized session key data:', {
      address: serializableData.address,
      packageId: serializableData.packageId,
      hasSignature: !!serializableData.personalMessageSignature,
      ttlMin: serializableData.ttlMin,
      timestamp: serializableData.timestamp
    });
    
    localStorage.setItem(CACHE_KEYS.SESSION_KEY, JSON.stringify(serializableData));
    console.log(`✅ Session key successfully cached with package ID: ${CONFIG.PACKAGE_ID}`);
    
  } catch (error) {
    console.error('❌ Error storing session key cache:', error);
    console.error('❌ Failed to serialize session key. Data:', exportedSessionKey);
  }
}

/**
 * Clear only the session key cache
 */
export function clearSessionKeyCache(): void {
  localStorage.removeItem(CACHE_KEYS.SESSION_KEY);
  console.log('🧹 Session key cache cleared');
}

/**
 * Clear user-specific cache data (publications, drafts, session keys)
 * Preserves non-user-specific data like package ID
 */
export function clearUserSpecificCache(): void {
  console.log('🧹 Clearing user-specific cache data...');
  
  const userSpecificKeys = [
    CACHE_KEYS.PUBLICATION,
    CACHE_KEYS.ARTICLE_DRAFT,
    CACHE_KEYS.SESSION_KEY,
  ];
  
  userSpecificKeys.forEach(key => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      console.log(`  ✅ Cleared: ${key}`);
    }
  });
  
  console.log('🧹 User-specific cache clearing completed');
}

/**
 * Clear cache when wallet address changes (account switch)
 */
export function clearOnWalletChange(previousAddress: string | null, newAddress: string): void {
  console.log('🔄 Clearing cache due to wallet address change', {
    previous: previousAddress ? previousAddress.substring(0, 8) + '...' : 'none',
    new: newAddress.substring(0, 8) + '...'
  });
  
  // Clear all user-specific data since it belongs to the previous account
  clearUserSpecificCache();
  
  console.log('✅ Cache cleared for wallet address change');
}

/**
 * Clear cache when wallet disconnects
 */
export function clearOnDisconnect(): void {
  console.log('🔌 Clearing cache due to wallet disconnect');
  
  // Clear all cache except package ID (non-user-specific)
  clearUserSpecificCache();
  
  console.log('✅ Cache cleared for wallet disconnect');
}

/**
 * Check if the current package ID has changed since last app usage
 * This can be used to detect contract redeployments
 */
export function checkPackageIdChange(): { hasChanged: boolean; oldPackageId?: string; newPackageId: string } {
  const lastPackageId = localStorage.getItem(CACHE_KEYS.PACKAGE_ID);
  const currentPackageId = CONFIG.PACKAGE_ID;
  
  // Update stored package ID
  localStorage.setItem(CACHE_KEYS.PACKAGE_ID, currentPackageId);
  
  if (lastPackageId && lastPackageId !== currentPackageId) {
    console.log(`📦 Package ID change detected: ${lastPackageId} → ${currentPackageId}`);
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
  console.log('🚀 Initializing Inkray cache manager...');
  
  const packageChange = checkPackageIdChange();
  
  if (packageChange.hasChanged) {
    console.log('📦 Package ID changed - clearing all cache to prevent stale data');
    clearInkrayCache();
  }
  
  console.log(`📦 Current package ID: ${packageChange.newPackageId}`);
}

/**
 * Get cache statistics for debugging
 */
export function getCacheStats(): {
  hasPublication: boolean;
  hasDraft: boolean;
  hasSessionKey: boolean;
  packageId: string;
  cacheEntries: string[];
} {
  const cacheEntries = Object.values(CACHE_KEYS).filter(key => 
    localStorage.getItem(key) !== null
  );
  
  return {
    hasPublication: !!getCachedPublication(),
    hasDraft: !!getCachedDraft(),
    hasSessionKey: !!getCachedSessionKey(),
    packageId: CONFIG.PACKAGE_ID,
    cacheEntries,
  };
}