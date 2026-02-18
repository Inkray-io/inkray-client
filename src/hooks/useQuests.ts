import { useQuery } from '@tanstack/react-query';
import { gamificationAPI, QuestResponse } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export function useQuests() {
  const { isAuthenticated } = useAuth();

  return useQuery<QuestResponse[]>({
    queryKey: ['gamification', 'quests'],
    queryFn: async () => {
      const response = await gamificationAPI.getQuests();
      return response.data.data;
    },
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });
}
