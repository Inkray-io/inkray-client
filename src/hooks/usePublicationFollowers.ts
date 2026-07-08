import { useInfiniteQuery } from '@tanstack/react-query';
import { followsAPI } from '@/lib/api';

export interface PublicationFollower {
  id: string;
  publicKey: string;
  username: string | null;
  avatar: string | null;
  followedAt: string;
}

export interface PublicationFollowersPage {
  followers: PublicationFollower[];
  pagination: {
    hasMore: boolean;
    nextCursor?: string;
    count: number;
  };
}

/**
 * Paginated follower list for a publication, newest first.
 * Powers the followers dialog opened from the publication header.
 */
export function usePublicationFollowers(publicationId: string, enabled = true) {
  return useInfiniteQuery<PublicationFollowersPage>({
    queryKey: ['follows', 'followers', publicationId],
    queryFn: async ({ pageParam }) => {
      const response = await followsAPI.getFollowers(publicationId, {
        limit: 20,
        cursor: (pageParam as string | undefined) ?? undefined,
      });
      return response.data.data as PublicationFollowersPage;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? lastPage.pagination.nextCursor : undefined,
    enabled: Boolean(publicationId) && enabled,
    staleTime: 30 * 1000,
  });
}
