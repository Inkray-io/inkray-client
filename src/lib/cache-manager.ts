import { CONFIG } from './config';

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
  isGated: boolean;
  packageId: string; // Track which package ID this draft belongs to
  timestamp: number;
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
  packageId: string;
  cacheEntries: string[];
} {
  const cacheEntries = Object.values(CACHE_KEYS).filter(key => 
    localStorage.getItem(key) !== null
  );
  
  return {
    hasPublication: !!getCachedPublication(),
    hasDraft: !!getCachedDraft(),
    packageId: CONFIG.PACKAGE_ID,
    cacheEntries,
  };
}