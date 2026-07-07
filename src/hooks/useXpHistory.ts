import { useInfiniteQuery } from '@tanstack/react-query';
import { gamificationAPI, XpHistoryResponse } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Paginated XP history — every event that earned (or granted) points,
 * newest first. Powers the "History" tab on the quests page.
 */
export function useXpHistory(pageSize = 25) {
  const { isAuthenticated } = useAuth();

  return useInfiniteQuery<XpHistoryResponse>({
    queryKey: ['gamification', 'xp-history', pageSize],
    queryFn: async ({ pageParam }) => {
      const response = await gamificationAPI.getHistory({
        limit: pageSize,
        cursor: (pageParam as string | undefined) ?? undefined,
      });
      return response.data.data as XpHistoryResponse;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
  });
}
