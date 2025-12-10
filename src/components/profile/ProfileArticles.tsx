"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import { UserArticle } from '@/hooks/useUserArticles';
import { createCdnUrl } from '@/lib/utils/mediaUrlTransform';
import { HiEye, HiDocumentText, HiArrowRight } from 'react-icons/hi2';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileArticlesProps {
  articles: UserArticle[];
  isLoading: boolean;
  isLoadingMore?: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

function ArticleCard({ article }: { article: UserArticle }) {
  const router = useRouter();

  const coverImage =
    article.hasCover && article.quiltId
      ? createCdnUrl(article.quiltId, 'media0')
      : null;

  const handleClick = () => {
    router.push(ROUTES.ARTICLE_WITH_ID(article.slug));
  };

  return (
    <article
      onClick={handleClick}
      className={cn(
        'group flex gap-4 p-4 rounded-xl',
        'bg-white border border-gray-100',
        'cursor-pointer transition-all duration-200',
        'hover:shadow-md hover:border-gray-200 hover:bg-gray-50/50'
      )}
    >
      {/* Cover Image */}
      {coverImage && (
        <div className="flex-shrink-0 w-24 h-24 sm:w-32 sm:h-24 rounded-lg overflow-hidden bg-gray-100">
          <img
            src={coverImage}
            alt={article.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 text-sm sm:text-base line-clamp-2 group-hover:text-primary transition-colors">
            {article.title}
          </h3>
          <p className="text-gray-500 text-xs sm:text-sm mt-1 line-clamp-2">
            {article.summary}
          </p>
        </div>

        {/* Meta */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            {article.publication && (
              <span className="font-medium text-primary truncate max-w-[120px]">
                {article.publication.name}
              </span>
            )}
            <span>{new Date(article.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <HiEye className="w-3.5 h-3.5" />
            <span>{article.viewCount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Arrow indicator */}
      <div className="hidden sm:flex items-center">
        <HiArrowRight className="w-4 h-4 text-gray-300 transition-all duration-200 group-hover:text-primary group-hover:translate-x-1" />
      </div>
    </article>
  );
}

function ArticleSkeleton() {
  return (
    <div className="flex gap-4 p-4 rounded-xl bg-white border border-gray-100">
      <Skeleton className="w-24 h-24 sm:w-32 sm:h-24 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

export function ProfileArticles({
  articles,
  isLoading,
  isLoadingMore,
  hasMore,
  onLoadMore,
}: ProfileArticlesProps) {
  return (
    <section className="px-6 sm:px-8 py-6 border-t border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Articles</h2>
        {articles.length > 0 && (
          <span className="text-sm text-gray-500">
            {articles.length} {articles.length === 1 ? 'article' : 'articles'}
          </span>
        )}
      </div>

      {/* Loading initial */}
      {isLoading && articles.length === 0 && (
        <div className="space-y-3">
          <ArticleSkeleton />
          <ArticleSkeleton />
          <ArticleSkeleton />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && articles.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <HiDocumentText className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 text-sm">No articles published yet</p>
          <p className="text-gray-400 text-xs mt-1">
            Articles will appear here once published
          </p>
        </div>
      )}

      {/* Articles list */}
      {articles.length > 0 && (
        <div className="space-y-3">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                onClick={onLoadMore}
                disabled={isLoadingMore}
                variant="outline"
                className="gap-2 rounded-xl px-6"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    Load More Articles
                    <HiArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
