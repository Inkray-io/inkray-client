"use client";

import { useEffect } from 'react';
import { initializeCacheManager, getCacheStats } from '@/lib/cache-manager';

/**
 * Cache Provider Component
 * 
 * Initializes the cache manager when the app starts.
 * Automatically clears stale cache when package ID changes.
 */
export function CacheProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize cache manager on app start
    initializeCacheManager();
    
    // Cache initialization complete
    getCacheStats();
  }, []);

  return <>{children}</>;
}