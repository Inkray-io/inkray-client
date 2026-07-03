import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { searchAPI, SearchResponse } from '@/lib/api';

export const MIN_SEARCH_LENGTH = 2;

/**
 * DB-backed search across articles and publications.
 *
 * One request returns both result sets so the modal can show live counts on
 * its tabs. `keepPreviousData` keeps the current results on screen while the
 * next keystroke's query is in flight (no flicker).
 */
export function useSearch(query: string) {
  const q = query.trim();
  const enabled = q.length >= MIN_SEARCH_LENGTH;

  return useQuery<SearchResponse>({
    queryKey: ['search', q],
    queryFn: async () => {
      const response = await searchAPI.search(q, 'all', 8);
      const raw = response.data.data || response.data;
      return raw as SearchResponse;
    },
    enabled,
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
  });
}
