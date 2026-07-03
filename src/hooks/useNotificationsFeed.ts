import { useInfiniteQuery } from '@tanstack/react-query';
import { notificationsAPI } from '@/lib/api';
import { PaginatedNotifications } from '@/types/notifications';

const PAGE_SIZE = 10;

/**
 * Infinite-scrolling notifications feed (used by the bell popup).
 * Page-based pagination against GET /notifications.
 */
export function useNotificationsFeed(enabled: boolean) {
  return useInfiniteQuery<PaginatedNotifications>({
    queryKey: ['notifications', 'feed'],
    queryFn: async ({ pageParam }) => {
      const page = (pageParam as number) ?? 1;
      const response = await notificationsAPI.getPaginated(page, PAGE_SIZE);
      return (response.data.data ?? response.data) as PaginatedNotifications;
    },
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.page * last.limit < last.total ? last.page + 1 : undefined,
    enabled,
    staleTime: 30 * 1000,
  });
}
