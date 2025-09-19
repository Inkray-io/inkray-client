import { useState, useEffect, useCallback } from 'react';
import { feedAPI } from '@/lib/api';

export interface FeedArticle {
  id: string;
  articleId: string;
  slug: string;
  title: string;
  author: string;
  authorShortAddress: string;
  publicationId: string;
  vaultId: string;
  isEncrypted: boolean;
  quiltBlobId?: string | null;
  quiltObjectId?: string | null;
  createdAt: string;
  transactionHash: string;
  timeAgo: string;
  tags?: string[];
  summary?: string;
}

export interface FeedArticlesState {
  articles: FeedArticle[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  nextCursor: string | null;
  total: number;
}

/**
 * Hook to fetch articles from the backend indexer for the feed
 */
export const useFeedArticles = () => {
  const [state, setState] = useState<FeedArticlesState>({
    articles: [],
    isLoading: true,
    error: null,
    hasMore: false,
    nextCursor: null,
    total: 0,
  });

  /**
   * Fetch articles from backend API using centralized API client
   */
  const fetchArticles = useCallback(async (cursor?: string | null) => {
    try {
      const params: Parameters<typeof feedAPI.getArticles>[0] = {
        limit: 20,
      };
      
      if (cursor) {
        params.cursor = cursor;
      }

      const response = await feedAPI.getArticles(params);
      const result = response.data;
      
      return {
        articles: result.data || [],
        hasMore: result.meta?.hasMore || false,
        nextCursor: result.meta?.nextCursor || null,
        total: result.meta?.total || 0,
      };
    } catch (error) {
      console.error('Failed to fetch articles:', error);
      throw new Error(`Feed articles fetch failed: Could not fetch articles from backend. Ensure the backend service is running.`);
    }
  }, []);

  /**
   * Load initial articles
   */
  const loadArticles = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await fetchArticles();
      setState(prev => ({
        ...prev,
        articles: result.articles,
        hasMore: result.hasMore,
        nextCursor: result.nextCursor,
        total: result.total,
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load articles';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));
    }
  }, [fetchArticles]);

  /**
   * Load more articles (pagination)
   */
  const loadMore = useCallback(async () => {
    if (!state.hasMore || state.isLoading) {
      return;
    }

    try {
      const result = await fetchArticles(state.nextCursor);
      setState(prev => ({
        ...prev,
        articles: [...prev.articles, ...result.articles],
        hasMore: result.hasMore,
        nextCursor: result.nextCursor,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load more articles';
      setState(prev => ({ ...prev, error: errorMessage }));
    }
  }, [fetchArticles, state.hasMore, state.isLoading, state.nextCursor]);

  /**
   * Refresh articles (reload from beginning)
   */
  const refresh = useCallback(() => {
    loadArticles();
  }, [loadArticles]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  /**
   * Get article by slug
   */
  const getArticleBySlug = useCallback((slug: string): FeedArticle | null => {
    return state.articles.find(article => article.slug === slug) || null;
  }, [state.articles]);

  /**
   * Format article for display
   */
  const formatArticleForDisplay = useCallback((article: FeedArticle) => {
    return {
      id: article.id,
      author: {
        name: article.authorShortAddress,
        avatar: "/placeholder-user.jpg",
        address: article.author,
        date: article.timeAgo,
        readTime: "2 min", // TODO: Calculate from content
        mintedBy: 0, // TODO: Add this metric from backend
      },
      title: article.title,
      slug: article.slug,
      description: `Published on Sui blockchain • ${article.isEncrypted ? '🔒 Premium content' : '📖 Free article'}`,
      engagement: {
        likes: 0, // TODO: Implement real engagement metrics from backend
        comments: 0,
        views: 0,
      },
      transactionHash: article.transactionHash,
      quiltBlobId: article.quiltBlobId,
      quiltObjectId: article.quiltObjectId,
      isEncrypted: article.isEncrypted,
    };
  }, []);

  // Load articles on mount
  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  return {
    // State
    ...state,
    
    // Actions
    loadMore,
    refresh,
    clearError,
    getArticleBySlug,
    formatArticleForDisplay,
  };
};