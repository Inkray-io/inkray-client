"use client"

import { useQuery } from '@tanstack/react-query'
import { suinsAPI } from '@/lib/api'

interface UseSuiNSBatchResult {
  names: Map<string, string | null>
  loading: boolean
  error: string | null
  getName: (address: string) => string | null
}

interface UseSuiNSBatchOptions {
  enabled?: boolean
}

/**
 * Hook to resolve multiple Sui addresses to their SuiNS names in batch
 * Uses React Query for caching and deduplication
 * Maximum 50 addresses per request
 */
export const useSuiNSBatch = (
  addresses: string[],
  options?: UseSuiNSBatchOptions
): UseSuiNSBatchResult => {
  // Deduplicate and sort for consistent cache keys
  const uniqueAddresses = [...new Set(addresses.filter(Boolean))].sort()
  const cacheKey = uniqueAddresses.join(',')

  const { data, isLoading, error } = useQuery({
    queryKey: ['suins', 'batch', cacheKey],
    queryFn: async () => {
      if (uniqueAddresses.length === 0) return new Map<string, string | null>()

      const response = await suinsAPI.resolveNames(uniqueAddresses)
      const results = response.data.data?.results ?? []

      return new Map<string, string | null>(
        results.map(r => [r.address, r.name])
      )
    },
    enabled: uniqueAddresses.length > 0 && (options?.enabled !== false),
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60, // 1 hour garbage collection
    retry: 1,
  })

  const namesMap = data ?? new Map<string, string | null>()

  return {
    names: namesMap,
    loading: isLoading,
    error: error ? 'Failed to resolve SuiNS names' : null,
    getName: (address: string) => namesMap.get(address) ?? null,
  }
}
