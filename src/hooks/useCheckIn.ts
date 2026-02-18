import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gamificationAPI, CheckInStatus, CheckInResult } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export function useCheckInStatus() {
  const { isAuthenticated } = useAuth();

  return useQuery<CheckInStatus>({
    queryKey: ['gamification', 'checkInStatus'],
    queryFn: async () => {
      const response = await gamificationAPI.getCheckInStatus();
      return response.data.data;
    },
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });
}

export function useCheckIn() {
  const queryClient = useQueryClient();

  return useMutation<CheckInResult>({
    mutationFn: async () => {
      const response = await gamificationAPI.checkIn();
      return response.data.data;
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['gamification', 'checkInStatus'] });
      queryClient.invalidateQueries({ queryKey: ['gamification', 'points'] });
      queryClient.invalidateQueries({ queryKey: ['gamification', 'myRank'] });
      queryClient.invalidateQueries({ queryKey: ['gamification', 'leaderboard'] });
    },
  });
}
