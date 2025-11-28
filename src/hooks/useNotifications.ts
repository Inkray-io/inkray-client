import useSWR from 'swr';
import { notificationsAPI } from '@/lib/api';
import { PaginatedNotifications } from '@/types/notifications';

export function useNotifications(page: number = 1, limit: number = 20) {
  const fetcher = async () => {
    const response = await notificationsAPI.getPaginated(page, limit);
    return response.data.data as PaginatedNotifications;
  };

  const { data, error, isLoading, mutate } = useSWR(
    ['/notifications', page, limit],
    fetcher,
    {
      revalidateOnFocus: true,
    }
  );

  const markAllAsRead = async () => {
    await notificationsAPI.markAllAsRead();
    mutate(); // Revalidate notifications after marking as read
  };

  return {
    notifications: data?.notifications ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? page,
    limit: data?.limit ?? limit,
    isLoading,
    error,
    markAllAsRead,
  };
}
