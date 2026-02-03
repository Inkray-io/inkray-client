import { useState, useEffect } from 'react';
import { feedAPI } from '@/lib/api';
import { FeedArticle } from '@/types/article';

interface UseRelatedArticlesOptions {
  currentArticleId: string;
  currentArticleSlug: string;
  categoryId?: string;
  limit?: number;
}

interface UseRelatedArticlesReturn {
  articles: FeedArticle[];
  isLoading: boolean;
}

export const useRelatedArticles = ({
  currentArticleId,
  currentArticleSlug,
  categoryId,
  limit = 3,
}: UseRelatedArticlesOptions): UseRelatedArticlesReturn => {
  const [articles, setArticles] = useState<FeedArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRelatedArticles = async () => {
      try {
        setIsLoading(true);
        let relatedArticles: FeedArticle[] = [];

        // Step 1: Fetch articles from same category (if categoryId exists)
        if (categoryId) {
          const categoryResponse = await feedAPI.getArticles({
            type: 'fresh',
            categoryId,
            limit: limit + 1, // +1 in case current article is included
          });

          const categoryArticles = categoryResponse.data?.data?.articles || categoryResponse.data?.articles || [];

          // Filter out current article
          relatedArticles = categoryArticles
            .filter((a: FeedArticle) => a.slug !== currentArticleSlug && a.articleId !== currentArticleId)
            .slice(0, limit);
        }

        // Step 2: If not enough articles, fetch recent from any category
        if (relatedArticles.length < limit) {
          const remaining = limit - relatedArticles.length;
          const existingSlugs = new Set([currentArticleSlug, ...relatedArticles.map(a => a.slug)]);
          const existingIds = new Set([currentArticleId, ...relatedArticles.map(a => a.articleId)]);

          const recentResponse = await feedAPI.getArticles({
            type: 'fresh',
            limit: remaining + existingSlugs.size + 1, // Fetch extra to account for filtering
          });

          const recentArticles = recentResponse.data?.data?.articles || recentResponse.data?.articles || [];

          // Filter out current article and already-included articles
          const additionalArticles = recentArticles
            .filter((a: FeedArticle) => !existingSlugs.has(a.slug) && !existingIds.has(a.articleId))
            .slice(0, remaining);

          relatedArticles = [...relatedArticles, ...additionalArticles];
        }

        setArticles(relatedArticles);
      } catch (error) {
        // Silent fail - this is a non-critical feature
        console.error('Failed to fetch related articles:', error);
        setArticles([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (currentArticleId && currentArticleSlug) {
      fetchRelatedArticles();
    }
  }, [currentArticleId, currentArticleSlug, categoryId, limit]);

  return { articles, isLoading };
};
