"use client"

import { useRouter } from "next/navigation"
import { FileText } from "lucide-react"
import { FeedArticle } from "@/types/article"
import { ROUTES } from "@/constants/routes"
import { CONFIG } from "@/lib/config"
import { createCdnUrl } from "@/lib/utils/mediaUrlTransform"

interface RelatedArticleCardProps {
  article: FeedArticle
}

function getCoverImageUrl(article: FeedArticle): string | undefined {
  if (!article.hasCover) return undefined

  if (article.coverImageId) {
    return `${CONFIG.API_URL}/articles/images/article/${article.articleId}/media/${article.coverImageId}`
  }

  if (article.quiltBlobId) {
    return createCdnUrl(article.quiltBlobId, 'media0')
  }

  return undefined
}

function getPublicationName(article: FeedArticle): string {
  // API returns publicationName at root level, fallback to followInfo for compatibility
  return (article as any).publicationName || article.followInfo?.publicationName || 'Unknown'
}

export function RelatedArticleCard({ article }: RelatedArticleCardProps) {
  const router = useRouter()
  const coverImage = getCoverImageUrl(article)
  const publicationName = getPublicationName(article)

  const handleClick = () => {
    router.push(ROUTES.ARTICLE_WITH_ID(article.slug))
  }

  return (
    <div
      className="group bg-white border border-gray-100 rounded-xl overflow-hidden
                 hover:border-gray-200 hover:shadow-md transition-all duration-200
                 cursor-pointer h-full flex flex-col"
      onClick={handleClick}
    >
      {/* Cover Image */}
      <div className="aspect-16/10 bg-gray-50 overflow-hidden">
        {coverImage ? (
          <img
            src={coverImage}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
            <FileText className="w-8 h-8 text-gray-300" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col flex-1">
        {/* Title */}
        <h4 className="font-medium text-sm text-gray-900 line-clamp-2 leading-snug mb-2 group-hover:text-gray-700 transition-colors">
          {article.title}
        </h4>

        {/* Meta - pushed to bottom */}
        <div className="mt-auto flex items-center gap-1.5 text-xs text-gray-500">
          <span className="truncate">{publicationName}</span>
          <span>·</span>
          <span className="flex-shrink-0">{article.timeAgo}</span>
        </div>
      </div>
    </div>
  )
}
