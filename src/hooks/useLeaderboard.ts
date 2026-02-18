import { useQuery } from '@tanstack/react-query';
import {
  gamificationAPI,
  LeaderboardResponse,
  MyRankResponse,
} from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export function useLeaderboard(params?: {
  limit?: number;
  offset?: number;
}) {
  return useQuery<LeaderboardResponse>({
    queryKey: ['gamification', 'leaderboard', params],
    queryFn: async () => {
      const response = await gamificationAPI.getLeaderboard(params);
      return response.data.data;
    },
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useMyRank() {
  const { isAuthenticated } = useAuth();

  return useQuery<MyRankResponse>({
    queryKey: ['gamification', 'myRank'],
    queryFn: async () => {
      const response = await gamificationAPI.getMyRank();
      return response.data.data;
    },
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });
}
