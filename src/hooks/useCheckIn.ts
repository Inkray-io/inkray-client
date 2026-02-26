import { useQuery } from '@tanstack/react-query';
import { gamificationAPI } from '@/lib/api';
import type { StreakStatus } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export function useStreakStatus() {
  const { isAuthenticated } = useAuth();

  return useQuery<StreakStatus>({
    queryKey: ['gamification', 'streakStatus'],
    queryFn: async () => {
      const response = await gamificationAPI.getStreakStatus();
      return response.data.data as StreakStatus;
    },
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });
}
