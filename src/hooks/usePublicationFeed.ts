import { useState, useEffect, useCallback } from 'react';
import { publicationsAPI } from '@/lib/api';
import { log } from '@/lib/utils/Logger';
import { FeedArticle, PublicationFeedState, PublicationArticle } from '@/types/article';
import { createUserAvatarConfig } from '@/lib/utils/avatar';

/**
 * Hook to fetch articles from a specific publication
 * 
 * This hook manages the publication's article feed state, including loading,
 * pagination, and error handling. It provides functions to load initial articles,
 * paginate through more articles, and refresh the feed.
 * 
 * @param publicationId - The publication ID to get articles from
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
 * } = usePublicationFeed(publicationId);
 * 
 * return (
 *   <div>
 *     {articles.map(article => (
 *       <ArticleCard key={article.articleId} article={article} />
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
export const usePublicationFeed = (publicationId: string) => {
  const [state, setState] = useState<PublicationFeedState>({
    articles: [],
    isLoading: true,
    error: null,
    hasMore: false,
    nextCursor: null,
    total: 0,
  });

  /**
   * Fetch articles from publication API
   */
  const fetchArticles = useCallback(async (cursor?: string | null) => {
    try {
      const params: Parameters<typeof publicationsAPI.getPublicationArticles>[1] = {
        limit: 20,
      };

      if (cursor) {
        params.cursor = cursor;
      }

      const response = await publicationsAPI.getPublicationArticles(publicationId, params);
      
      if (response.data.success) {
        const result = response.data.data;
        
        // Transform articles to FeedArticle format

        const articles: FeedArticle[] = result.articles.map((article: PublicationArticle) => ({
          articleId: article.id,
          slug: article.slug,
          title: article.title,
          author: article.author,
          authorShortAddress: article.authorShortAddress,
          publicationId: publicationId, // Use the publication ID from hook
          vaultId: article.vaultId || '', // Now provided in publication feed
          publicationOwner: (article as { publicationOwner?: string }).publicationOwner,
          gated: article.gated,
          quiltBlobId: article.quiltBlobId || '',
          quiltObjectId: article.quiltObjectId || '',
          hasCover: article.hasCover ?? false,
          coverImageId: article.coverImageId || null,
          createdAt: article.createdAt,
          transactionHash: article.transactionHash,
          timeAgo: article.timeAgo,
          summary: article.summary,
          totalTips: article.totalTips,
          categoryName: article.categoryName || null,
          readTimeMinutes: article.readTimeMinutes || null,
          authorInfo: {
            name: article.authorShortAddress,
            avatar: createUserAvatarConfig({
              publicKey: article.author,
              // Don't pass short address as name - let the function detect it's an address
            }, 'md').src,
            readTime: article.readTimeMinutes ? `${article.readTimeMinutes} min` : "2 min",
            category: article.categoryName || undefined,
          },
          engagement: {
            likes: article.totalLikes,
            comments: 0,
            views: (article.viewCount ?? 0) + ((article as { chatViewCount?: number }).chatViewCount ?? 0), // Total views
            pageViews: article.viewCount ?? 0, // Views from article page
            chatViews: (article as { chatViewCount?: number }).chatViewCount ?? 0, // Views from AI chat mentions
            isLiked: article.isLiked,
          },
        }));

        return {
          articles,
          hasMore: result.pagination.hasMore,
          nextCursor: result.pagination.nextCursor,
          total: result.pagination.count,
        };
      } else {
        throw new Error(response.data.message || 'Failed to fetch articles');
      }
    } catch (error) {
      log.error('Failed to fetch publication articles', error, 'usePublicationFeed');
      throw new Error(`Publication feed fetch failed: Could not fetch articles from publication. Ensure the publication exists and is accessible.`);
    }
  }, [publicationId]);

  /**
   * Load initial articles
   */
  const loadArticles = useCallback(async () => {
    if (!publicationId) {
      setState(prev => ({
        ...prev,
        error: 'Publication ID is required',
        isLoading: false,
      }));
      return;
    }

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
  }, [fetchArticles, publicationId]);

  /**
   * Load more articles (pagination)
   */
  const loadMore = useCallback(async () => {
    if (!state.hasMore || state.isLoading || !publicationId) {
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
  }, [fetchArticles, state.hasMore, state.isLoading, state.nextCursor, publicationId]);

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

  // Load articles on mount and when publicationId changes
  useEffect(() => {
    if (publicationId) {
      loadArticles();
    }
  }, [loadArticles, publicationId]);

  return {
    // State
    ...state,

    // Actions
    loadMore,
    refresh,
    clearError,
    getArticleBySlug,

    // Computed properties
    hasError: !!state.error,
    canLoadMore: state.hasMore && !state.isLoading,
    isEmpty: state.articles.length === 0 && !state.isLoading,
  };
};
