import { useQuery } from '@tanstack/react-query';
import { gamificationAPI, UserPointsResponse } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export function useUserPoints() {
  const { isAuthenticated } = useAuth();

  return useQuery<UserPointsResponse>({
    queryKey: ['gamification', 'points'],
    queryFn: async () => {
      const response = await gamificationAPI.getPoints();
      return response.data.data as UserPointsResponse;
    },
    enabled: isAuthenticated,
    staleTime: 30 * 1000, // 30 seconds
  });
}
