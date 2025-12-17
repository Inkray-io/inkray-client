"use client";

import { useState, useEffect, useCallback } from 'react';
import { usersAPI } from '@/lib/api';
import { log } from '@/lib/utils/Logger';

export interface UserArticle {
  id: string;
  articleId: string;
  title: string;
  summary: string;
  slug: string;
  hasCover: boolean;
  quiltId: string;
  publicationId: string;
  vaultId: string;
  gating: number;
  viewCount: number;
  chatViewCount: number;
  likesCount: number;
  commentsCount: number;
  bookmarksCount: number;
  totalTips: number;
  isLiked: boolean;
  isBookmarked: boolean;
  createdAt: string;
  author: string;
  publication: {
    id: string;
    name: string;
    avatar: string | null;
    owner: string;
  } | null;
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

interface UseUserArticlesState {
  articles: UserArticle[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  nextCursor: string | null;
}

/**
 * Hook for fetching articles by a specific user
 *
 * @param address - The wallet address of the user
 * @param limit - Number of articles per page (default 10)
 */
export const useUserArticles = (address?: string, limit = 10) => {
  const [state, setState] = useState<UseUserArticlesState>({
    articles: [],
    isLoading: false,
    isLoadingMore: false,
    error: null,
    hasMore: true,
    nextCursor: null,
  });

  /**
   * Fetch articles from API
   */
  const fetchArticles = useCallback(
    async (cursor?: string) => {
      if (!address) {
        setState({
          articles: [],
          isLoading: false,
          isLoadingMore: false,
          error: null,
          hasMore: false,
          nextCursor: null,
        });
        return;
      }

      const isInitialLoad = !cursor;

      setState((prev) => ({
        ...prev,
        isLoading: isInitialLoad,
        isLoadingMore: !isInitialLoad,
        error: null,
      }));

      try {
        const response = await usersAPI.getUserArticles(address, {
          cursor,
          limit,
        });

        const { articles: newArticles, nextCursor, hasMore } = response.data.data;

        setState((prev) => ({
          ...prev,
          articles: isInitialLoad
            ? newArticles
            : [...prev.articles, ...newArticles],
          isLoading: false,
          isLoadingMore: false,
          hasMore,
          nextCursor,
        }));

        log.debug(
          'User articles loaded',
          {
            address,
            count: newArticles.length,
            hasMore,
          },
          'useUserArticles'
        );
      } catch (error) {
        log.error(
          'Failed to fetch user articles',
          { error, address },
          'useUserArticles'
        );

        let errorMessage = 'Failed to load articles';

        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as {
            response?: { status: number; data?: { message: string } };
          };
          if (axiosError.response?.data?.message) {
            errorMessage = axiosError.response.data.message;
          }
        }

        setState((prev) => ({
          ...prev,
          isLoading: false,
          isLoadingMore: false,
          error: errorMessage,
        }));
      }
    },
    [address, limit]
  );

  /**
   * Load more articles
   */
  const loadMore = useCallback(() => {
    if (!state.isLoading && !state.isLoadingMore && state.hasMore && state.nextCursor) {
      fetchArticles(state.nextCursor);
    }
  }, [state.isLoading, state.isLoadingMore, state.hasMore, state.nextCursor, fetchArticles]);

  /**
   * Refresh articles (reset pagination)
   */
  const refresh = useCallback(() => {
    fetchArticles();
  }, [fetchArticles]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // Load articles when address changes
  useEffect(() => {
    fetchArticles();
  }, [address]); // Only re-fetch when address changes, not on every fetchArticles change

  return {
    // State
    ...state,

    // Actions
    loadMore,
    refresh,
    clearError,

    // Computed
    hasError: !!state.error,
    isEmpty: !state.isLoading && state.articles.length === 0,
    totalCount: state.articles.length,
  };
};
