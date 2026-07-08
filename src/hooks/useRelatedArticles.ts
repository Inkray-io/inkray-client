import { useQuery } from '@tanstack/react-query';
import { feedAPI } from '@/lib/api';
import { FeedArticle } from '@/types/article';

interface UseRelatedArticlesOptions {
  currentArticleId: string;
  currentArticleSlug: string;
  categoryId?: string; // Unused — the server picks same-category candidates itself
  limit?: number;
}

interface UseRelatedArticlesReturn {
  articles: FeedArticle[];
  isLoading: boolean;
}

export const useRelatedArticles = ({
  currentArticleId,
  currentArticleSlug,
  limit = 3,
}: UseRelatedArticlesOptions): UseRelatedArticlesReturn => {
  const { data, isLoading } = useQuery({
    queryKey: ['feed', 'related', currentArticleId],
    queryFn: async () => {
      const response = await feedAPI.getRelated({
        articleId: currentArticleId,
        limit,
      });
      return (response.data?.data?.articles || []) as FeedArticle[];
    },
    enabled: !!currentArticleId,
    staleTime: 60_000,
  });

  // Defensive filter — the server already excludes the current article
  const articles = (data || []).filter(
    (article) =>
      article.articleId !== currentArticleId &&
      article.slug !== currentArticleSlug,
  );

  return { articles, isLoading };
};
