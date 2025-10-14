"use client";

import { useState, useEffect, useCallback } from 'react';
import { publicationsAPI } from '@/lib/api';

interface TopWriterData {
  id: string;
  name: string;
  followerCount: number;
}

interface Writer {
  rank: number;
  name: string;
  subscribers: string;
  avatar: string;
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
    return apiData.map((publication, index) => ({
      rank: index + 1,
      name: publication.name,
      subscribers: `${publication.followerCount} subscriber${publication.followerCount !== 1 ? 's' : ''}`,
      // Use a default avatar pattern since publications don't have avatars in the schema
      avatar: `https://images.unsplash.com/photo-${getAvatarImageId(index)}?w=40&h=40&fit=crop&crop=face`
    }));
  };

  const getAvatarImageId = (index: number): string => {
    // Cycle through different avatar images for variety
    const avatarIds = [
      '1494790108755-2616b612b786', // First default avatar
      '1507003211169-0a1dd7228f2d', // Second default avatar  
      '1472099645785-5658abf4ff4e'  // Third default avatar
    ];
    return avatarIds[index % avatarIds.length];
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