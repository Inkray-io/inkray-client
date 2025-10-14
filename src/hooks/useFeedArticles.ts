import { useState, useEffect, useCallback } from 'react';
import { feedAPI } from '@/lib/api';
import { log } from '@/lib/utils/Logger';
import { FeedArticle, FeedArticlesState } from '@/types/article';
import { createUserAvatarConfig } from '@/lib/utils/avatar';

/**
 * Hook to fetch articles from the backend indexer for the feed
 * 
 * This hook manages the article feed state, including loading, pagination,
 * and error handling. It provides functions to load initial articles,
 * paginate through more articles, and refresh the feed.
 * 
 * @returns Object containing feed state and management functions
 * 
 * @example
 * ```tsx
 * const { 
 *   articles, 
 *   isLoading, 
 *   hasMore, 
 *   loadMore, 
 *   refresh 
 * } = useFeedArticles();
 * 
 * return (
 *   <div>
 *     {articles.map(article => (
 *       <ArticleCard key={article.id} article={article} />
 *     ))}
 *     {hasMore && (
 *       <button onClick={loadMore} disabled={isLoading}>
 *         Load More
 *       </button>
 *     )}
 *   </div>
 * );
 * ```
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
      log.error('Failed to fetch articles', error, 'useFeedArticles');
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
    // Create proper avatar config for user (without passing short address as name)
    const avatarConfig = createUserAvatarConfig({
      publicKey: article.author,
      // Don't pass the short address as name - let the function detect it's an address
    }, 'md');

    return {
      id: article.articleId,
      author: {
        name: article.authorShortAddress,
        avatar: avatarConfig.src,
        address: article.author,
        date: article.timeAgo,
        readTime: "2 min", // TODO: Calculate from content
        mintedBy: 0, // TODO: Add this metric from backend
      },
      title: article.title,
      slug: article.slug,
      description: article.summary || `Published on Sui blockchain • ${article.gated ? '🔒 Premium content' : '📖 Free article'}`,
      engagement: {
        likes: 0, // TODO: Implement real engagement metrics from backend
        comments: 0,
        views: 0,
      },
      transactionHash: article.transactionHash,
      quiltBlobId: article.quiltBlobId,
      quiltObjectId: article.quiltObjectId,
      gated: article.gated,
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