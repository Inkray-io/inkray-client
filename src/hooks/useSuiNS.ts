"use client"

import { useQuery } from '@tanstack/react-query'
import { suinsAPI } from '@/lib/api'

interface UseSuiNSResult {
  name: string
  loading: boolean
  error: string | null
}

interface UseSuiNSOptions {
  enabled?: boolean
}

/**
 * Hook to resolve a Sui address to its SuiNS name
 * Uses React Query for caching and deduplication
 */
export const useSuiNS = (address?: string, options?: UseSuiNSOptions): UseSuiNSResult => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['suins', 'name', address],
    queryFn: async () => {
      if (!address) return null
      const response = await suinsAPI.resolveName(address)
      return response.data.data?.name ?? null
    },
    enabled: !!address && (options?.enabled !== false),
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60, // 1 hour garbage collection
    retry: 1, // Only retry once on failure
  })

  return {
    name: data ?? '',
    loading: isLoading,
    error: error ? 'Failed to resolve SuiNS name' : null
  }
}
