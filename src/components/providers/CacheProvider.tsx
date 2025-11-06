"use client";

import { useEffect } from 'react';
import { initializeCacheManager, getCacheStats } from '@/lib/cache-manager';

/**
 * Cache Provider Component
 *
 * Initializes the cache manager when the app starts.
 * Automatically clears stale cache when package ID changes.
 *
 * Uses useEffect to ensure cache initialization happens only on the client,
 * after hydration completes. This prevents SSR issues with localStorage access.
 */
export function CacheProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initializeCacheManager();
    getCacheStats();
  }, []);

  return <>{children}</>;
}