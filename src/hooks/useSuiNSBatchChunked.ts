"use client"

import { useQueries } from '@tanstack/react-query'
import { suinsAPI } from '@/lib/api'

interface UseSuiNSBatchChunkedResult {
  loading: boolean
  getName: (address: string) => string | null
}

interface UseSuiNSBatchChunkedOptions {
  enabled?: boolean
}

const CHUNK_SIZE = 50 // backend batch endpoint caps at 50 addresses per request

/**
 * Resolve any number of Sui addresses to SuiNS names, in stable
 * first-appearance chunks of 50 (the batch endpoint's per-request limit).
 *
 * Unlike useSuiNSBatch, this does not silently drop addresses past 50 and does
 * not refetch everything as the list grows: each chunk keeps a fixed set of
 * addresses (and thus a stable cache key), so an appended page only spins up a
 * query for the new chunk — earlier chunks stay cached.
 */
export const useSuiNSBatchChunked = (
  addresses: string[],
  options?: UseSuiNSBatchChunkedOptions,
): UseSuiNSBatchChunkedResult => {
  // Preserve first-appearance order; dedupe so a repeat address doesn't shift
  // chunk boundaries (which would change later chunks' cache keys).
  const ordered = [...new Set(addresses.filter(Boolean))]

  const chunks: string[][] = []
  for (let i = 0; i < ordered.length; i += CHUNK_SIZE) {
    chunks.push(ordered.slice(i, i + CHUNK_SIZE))
  }

  const results = useQueries({
    queries: chunks.map((chunk) => ({
      queryKey: ['suins', 'batch', chunk.join(',')],
      queryFn: async () => {
        const response = await suinsAPI.resolveNames(chunk)
        const rows = response.data.data?.results ?? []
        return new Map<string, string | null>(rows.map((r) => [r.address, r.name]))
      },
      enabled: chunk.length > 0 && options?.enabled !== false,
      staleTime: 1000 * 60 * 30,
      gcTime: 1000 * 60 * 60,
      retry: 1,
    })),
  })

  const names = new Map<string, string | null>()
  for (const r of results) {
    if (r.data) for (const [addr, name] of r.data) names.set(addr, name)
  }

  return {
    loading: results.some((r) => r.isLoading),
    getName: (address: string) => names.get(address) ?? null,
  }
}
