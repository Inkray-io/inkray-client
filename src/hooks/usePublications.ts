"use client";

import { useState, useEffect, useCallback } from 'react';
import { publicationsAPI } from '@/lib/api';
import { createPublicationAvatarConfig, AvatarSize } from '@/lib/utils/avatar';

export interface DiscoveryPublication {
  id: string;
  name: string;
  description: string | null;
  avatar: string | null;
  tags: string[];
  followerCount: number;
  articleCount: number;
  isVerified: boolean;
  avatarConfig: {
    src: string | null;
    alt: string;
    fallbackText: string;
    gradientColors: string;
    size: AvatarSize;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

interface UsePublicationsReturn {
  publications: DiscoveryPublication[];
  pagination: Pagination | null;
  isLoading: boolean;
  error: string | null;
  search: string;
  setSearch: (query: string) => void;
  loadMore: () => void;
  refetch: () => void;
}

export function usePublications(initialLimit: number = 20): UsePublicationsReturn {
  const [publications, setPublications] = useState<DiscoveryPublication[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const transformData = (apiData: Array<{
    id: string;
    name: string;
    description: string | null;
    avatar: string | null;
    tags: string[];
    followerCount: number;
    articleCount: number;
    isVerified: boolean;
  }>): DiscoveryPublication[] => {
    return apiData.map((pub) => ({
      ...pub,
      avatarConfig: createPublicationAvatarConfig(
        { id: pub.id, name: pub.name, avatar: pub.avatar },
        'md'
      ),
    }));
  };

  const fetchPublications = useCallback(async (pageNum: number, searchQuery: string, append: boolean) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await publicationsAPI.discoverPublications({
        page: pageNum,
        limit: initialLimit,
        search: searchQuery || undefined,
      });

      if (response.data.success) {
        const { publications: apiPubs, pagination: pag } = response.data.data;
        const transformed = transformData(apiPubs);

        setPublications(prev => append ? [...prev, ...transformed] : transformed);
        setPagination(pag);
      } else {
        throw new Error('Failed to fetch publications');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load publications';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [initialLimit]);

  // Fetch on mount and when search changes
  useEffect(() => {
    setPage(1);
    fetchPublications(1, search, false);
  }, [search, fetchPublications]);

  const loadMore = useCallback(() => {
    if (pagination?.hasMore && !isLoading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPublications(nextPage, search, true);
    }
  }, [pagination, isLoading, page, search, fetchPublications]);

  const refetch = useCallback(() => {
    setPage(1);
    fetchPublications(1, search, false);
  }, [search, fetchPublications]);

  return {
    publications,
    pagination,
    isLoading,
    error,
    search,
    setSearch,
    loadMore,
    refetch,
  };
}
