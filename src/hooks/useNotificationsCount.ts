import useSWR from 'swr';
import { notificationsAPI } from '@/lib/api';

export function useNotificationsCount() {
  const fetcher = async () => {
    const response = await notificationsAPI.getUnreadCount();

    return response.data.data.unreadCount;
  };

  const { data, error, isLoading } = useSWR(
    '/notifications/unread-count',
    fetcher,
    {
      refreshInterval: 60000, // 60 seconds
      revalidateOnFocus: true,
    }
  );

  return {
    count: typeof data === 'number' ? data : 0,
    isLoading,
    error,
  };
}
