"use client";

import { useState, useEffect, useCallback } from 'react';
import { publicationsAPI, TopicConfig } from '@/lib/api';

interface UseTopicsReturn {
  topics: TopicConfig[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching available topics for onboarding
 *
 * Fetches the list of topics users can select during onboarding
 * to get personalized publication recommendations.
 */
export function useTopics(): UseTopicsReturn {
  const [topics, setTopics] = useState<TopicConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTopics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await publicationsAPI.getTopics();

      if (response.data.success && response.data.data) {
        setTopics(response.data.data.topics);
      } else {
        throw new Error('Failed to fetch topics');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load topics';
      setError(errorMessage);
      setTopics([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refetch = async () => {
    await fetchTopics();
  };

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  return {
    topics,
    isLoading,
    error,
    refetch,
  };
}
