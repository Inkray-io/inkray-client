import { useState, useEffect, useCallback } from 'react';
import { feedAPI, bookmarksAPI } from '@/lib/api';
import { log } from '@/lib/utils/Logger';
import { FeedArticle, FeedArticlesState } from '@/types/article';
import { createUserAvatarConfig } from '@/lib/utils/avatar';
import { createCdnUrl } from '@/lib/utils/mediaUrlTransform';

/**
 * Hook to fetch articles from the backend indexer for the feed
 * 
 * This hook manages the article feed state, including loading, pagination,
 * and error handling. It provides functions to load initial articles,
 * paginate through more articles, and refresh the feed.
 * 
 * @param feedType - Type of feed to fetch ('fresh' | 'popular' | 'my' | 'bookmarks')
 * @param timeframe - Timeframe for popular feed ('day' | 'week' | 'month')
 * @param categoryId - Optional category ID to filter articles by
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
 * } = useFeedArticles('popular', 'week', 'category-id');
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
export const useFeedArticles = (
  feedType: 'fresh' | 'popular' | 'my' | 'bookmarks' = 'fresh',
  timeframe: 'day' | 'week' | 'month' = 'week',
  categoryId?: string
) => {
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
      // Handle bookmarks feed separately
      if (feedType === 'bookmarks') {
        const response = await bookmarksAPI.getMyBookmarkedArticles({
          limit: 20,
          cursor: cursor || undefined,
        });
        const result = response.data;

        // Transform bookmarked articles to match FeedArticle format
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const articles = (result.data?.articles || []).map((article: any) => ({
          ...article,
          isBookmarked: true,
          // Ensure all required fields are present
          totalLikes: article.totalLikes || 0,
          totalTips: article.totalTips || 0,
          isLiked: article.isLiked || false,
        }));

        return {
          articles,
          hasMore: result.data?.hasMore || false,
          nextCursor: result.data?.nextCursor || null,
          total: articles.length,
        };
      }

      const params: {
        type?: 'fresh' | 'popular' | 'my';
        limit?: number;
        cursor?: string;
        timeframe?: 'day' | 'week' | 'month';
        categoryId?: string;
        includeFollowStatus?: boolean;
      } = {
        type: feedType,
        limit: 20,
        includeFollowStatus: true, // Include follow status for publications
      };

      if (cursor) {
        params.cursor = cursor;
      }

      // Add timeframe for popular feed
      if (feedType === 'popular') {
        params.timeframe = timeframe;
      }

      // Add category filter if provided
      if (categoryId) {
        params.categoryId = categoryId;
      }

      const response = await feedAPI.getArticles(params);
      const result = response.data;

      return {
        articles: result.articles || [],
        hasMore: result.meta?.hasMore || false,
        nextCursor: result.meta?.nextCursor || null,
        total: result.meta?.total || 0,
      };
    } catch (error) {
      log.error('Failed to fetch articles', error, 'useFeedArticles');
      throw new Error(`Feed articles fetch failed: Could not fetch articles from backend. Ensure the backend service is running.`);
    }
  }, [feedType, timeframe, categoryId]);

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
    const hasCover = Boolean(article.hasCover);
    // Use CDN for cover images with the article's quilt blob ID
    // Example: https://testnet-cdn.inkray.xyz/blob/{quiltBlobId}?file=media0
    const coverImage = hasCover && article.quiltBlobId
      ? createCdnUrl(article.quiltBlobId, 'media0')
      : undefined;

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
      image: coverImage,
      description: article.summary || `Published on Sui blockchain • ${article.gated ? '🔒 Premium content' : '📖 Free article'}`,
      engagement: {
        likes: article.totalLikes,
        comments: 0, // TODO: Implement comments count from backend
        views: article.viewCount ?? 0,
        isLiked: article.isLiked,
        isBookmarked: article.isBookmarked,
        bookmarkCount: article.totalBookmarks,
      },
      transactionHash: article.transactionHash,
      quiltBlobId: article.quiltBlobId,
      quiltObjectId: article.quiltObjectId,
      gated: article.gated,
      hasCover,
    };
  }, []);

  // Load articles on mount or when feed type/timeframe changes
  useEffect(() => {
    loadArticles();
  }, [loadArticles, feedType, timeframe, categoryId]);

  return {
    // State
    ...state,
    feedType,
    timeframe,

    // Actions
    loadMore,
    refresh,
    clearError,
    getArticleBySlug,
    formatArticleForDisplay,
  };
};
