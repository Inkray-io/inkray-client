import { useQuery } from '@tanstack/react-query';
import { gamificationAPI, QuestsOverviewResponse } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Built-in quest catalog: recurring XP actions (with today's progress vs daily
 * cap) and one-time achievements (with earned status).
 */
export function useQuestsOverview() {
  const { isAuthenticated } = useAuth();

  return useQuery<QuestsOverviewResponse>({
    queryKey: ['gamification', 'quests', 'overview'],
    queryFn: async () => {
      const response = await gamificationAPI.getQuestsOverview();
      return response.data.data as QuestsOverviewResponse;
    },
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });
}
