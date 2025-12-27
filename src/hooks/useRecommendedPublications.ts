"use client";

import { useState, useCallback } from 'react';
import { publicationsAPI, RecommendedPublication } from '@/lib/api';
import { createPublicationAvatarConfig, AvatarSize } from '@/lib/utils/avatar';

interface RecommendedPublicationWithAvatar extends RecommendedPublication {
  avatarConfig: {
    src: string | null;
    alt: string;
    fallbackText: string;
    gradientColors: string;
    size: AvatarSize;
  };
}

interface UseRecommendedPublicationsReturn {
  publications: RecommendedPublicationWithAvatar[];
  matchedTopics: string[];
  isFallback: boolean;
  isLoading: boolean;
  error: string | null;
  fetchRecommendations: (topics: string[], limit?: number) => Promise<void>;
}

/**
 * Hook for fetching recommended publications based on selected topics
 *
 * Fetches publications matching the selected topics, ordered by follower count.
 * Falls back to popular publications if no matches are found.
 */
export function useRecommendedPublications(): UseRecommendedPublicationsReturn {
  const [publications, setPublications] = useState<RecommendedPublicationWithAvatar[]>([]);
  const [matchedTopics, setMatchedTopics] = useState<string[]>([]);
  const [isFallback, setIsFallback] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const transformPublications = (
    pubs: RecommendedPublication[]
  ): RecommendedPublicationWithAvatar[] => {
    return pubs.map((pub) => ({
      ...pub,
      avatarConfig: createPublicationAvatarConfig(
        {
          id: pub.id,
          name: pub.name,
          avatar: pub.avatar,
        },
        'md'
      ),
    }));
  };

  const fetchRecommendations = useCallback(
    async (topics: string[], limit: number = 10) => {
      if (topics.length === 0) {
        setPublications([]);
        setMatchedTopics([]);
        setIsFallback(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const response = await publicationsAPI.getRecommendedPublications({
          topics,
          limit,
        });

        if (response.data.success) {
          const { publications: pubs, matchedTopics: matched, fallback } = response.data.data;
          setPublications(transformPublications(pubs));
          setMatchedTopics(matched);
          setIsFallback(fallback);
        } else {
          throw new Error('Failed to fetch recommended publications');
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to load recommendations';
        setError(errorMessage);
        setPublications([]);
        setMatchedTopics([]);
        setIsFallback(false);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    publications,
    matchedTopics,
    isFallback,
    isLoading,
    error,
    fetchRecommendations,
  };
}
