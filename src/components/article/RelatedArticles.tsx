"use client"

import { useRelatedArticles } from "@/hooks/useRelatedArticles"
import { RelatedArticleCard } from "./RelatedArticleCard"
import { RelatedArticleSkeleton } from "./RelatedArticleSkeleton"

interface RelatedArticlesProps {
  currentArticleId: string
  currentArticleSlug: string
  categoryId?: string
}

export function RelatedArticles({
  currentArticleId,
  currentArticleSlug,
  categoryId,
}: RelatedArticlesProps) {
  const { articles, isLoading } = useRelatedArticles({
    currentArticleId,
    currentArticleSlug,
    categoryId,
  })

  // Don't render if no articles and not loading
  if (!isLoading && articles.length === 0) {
    return null
  }

  return (
    <div className="mt-8 pt-6 border-t border-gray-100">
      <h3 className="text-base font-semibold text-gray-900 mb-4">
        You might also want to read...
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isLoading ? (
          <>
            <RelatedArticleSkeleton />
            <RelatedArticleSkeleton />
            <RelatedArticleSkeleton />
          </>
        ) : (
          articles.map((article) => (
            <RelatedArticleCard key={article.articleId} article={article} />
          ))
        )}
      </div>
    </div>
  )
}
