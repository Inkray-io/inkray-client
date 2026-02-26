import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gamificationAPI, XConnectionStatus } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export function useXConnection() {
  const { isAuthenticated } = useAuth();

  return useQuery<XConnectionStatus>({
    queryKey: ['gamification', 'xConnection'],
    queryFn: async () => {
      const response = await gamificationAPI.getXStatus();
      return response.data.data as XConnectionStatus;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useConnectX() {
  const mutation = useMutation({
    mutationFn: async () => {
      const response = await gamificationAPI.getXConnectUrl();
      return response.data.data!.url;
    },
    onSuccess: (url: string) => {
      window.location.href = url;
    },
  });

  return {
    connect: () => mutation.mutate(),
    isPending: mutation.isPending,
  };
}

export function useDisconnectX() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await gamificationAPI.disconnectX();
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gamification', 'xConnection'] });
    },
  });
}
