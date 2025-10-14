"use client";

import { useState, useEffect, useCallback } from 'react';
import { publicationsAPI } from '@/lib/api';
import { createPublicationAvatarConfig } from '@/lib/utils/avatar';

interface TopWriterData {
  id: string;
  name: string;
  followerCount: number;
  avatar: string | null;
}

interface Writer {
  rank: number;
  name: string;
  subscribers: string;
  avatar: string;
  avatarConfig: {
    src: string | null;
    alt: string;
    fallbackText: string;
    gradientColors: string;
    size: 'md';
  };
}

interface UseTopWritersReturn {
  writers: Writer[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching and managing top writers data
 * 
 * Fetches the top publications by subscriber count from the API
 * and transforms the data for use in the TopWriters component.
 */
export function useTopWriters(): UseTopWritersReturn {
  const [writers, setWriters] = useState<Writer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const transformApiDataToWriters = (apiData: TopWriterData[]): Writer[] => {
    return apiData.map((publication, index) => {
      // Create avatar configuration using database avatar with fallback
      const avatarConfig = createPublicationAvatarConfig(
        {
          id: publication.id,
          name: publication.name,
          avatar: publication.avatar, // Database avatar (nullable)
        },
        'md'
      );

      return {
        rank: index + 1,
        name: publication.name,
        subscribers: `${publication.followerCount} subscriber${publication.followerCount !== 1 ? 's' : ''}`,
        avatar: avatarConfig.src || '', // Use configured avatar for backward compatibility
        avatarConfig, // Include full avatar config
      };
    });
  };

  const fetchTopWriters = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await publicationsAPI.getTopWriters(3);
      
      if (response.data.success) {
        const transformedWriters = transformApiDataToWriters(response.data.data.topWriters);
        setWriters(transformedWriters);
      } else {
        throw new Error('Failed to fetch top writers data');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load top writers';
      setError(errorMessage);
      
      // Keep existing data on error, or use empty array if no data
      if (writers.length === 0) {
        setWriters([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [writers.length]);

  const refetch = async () => {
    await fetchTopWriters();
  };

  useEffect(() => {
    fetchTopWriters();
  }, [fetchTopWriters]);

  return {
    writers,
    isLoading,
    error,
    refetch,
  };
}