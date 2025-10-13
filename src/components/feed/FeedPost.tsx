"use client"

import { useRouter } from "next/navigation"
import { HiDotsHorizontal } from "react-icons/hi"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/constants/routes"
import { TipButton } from "@/components/article/TipButton"
import { TipDisplay } from "@/components/ui/TipDisplay"

interface FeedPostProps {
  author: {
    name: string
    avatar: string
    mintedBy: number
    date: string
    readTime: string
  }
  title: string
  description: string
  image?: string
  hasReadMore?: boolean
  engagement?: {
    likes: number
    comments: number
    views: number
  }
  // Optional slug for navigation - if not provided, will generate from title
  slug?: string
  // Click handler to allow custom navigation
  onClick?: () => void
  // Publication information for linking
  publication?: {
    id: string
    name: string
  }
  // Article information for tipping
  articleId?: string
  publicationId?: string
  totalTips?: number
}

export function FeedPost({ 
  author, 
  title, 
  description, 
  image, 
  hasReadMore = false,
  engagement,
  slug,
  onClick,
  publication,
  articleId,
  publicationId,
  totalTips
}: FeedPostProps) {
  const router = useRouter()
  
  const handleArticleClick = () => {
    if (onClick) {
      onClick()
    } else if (slug) {
      // Use the real slug if provided
      router.push(ROUTES.ARTICLE_WITH_ID(slug))
    } else {
      // Fallback: generate ID from title
      const articleId = title.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
      router.push(ROUTES.ARTICLE_WITH_ID(articleId))
    }
  }

  const handlePublicationClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (publication?.id) {
      router.push(ROUTES.PUBLICATION_WITH_ID(publication.id))
    }
  }
  
  return (
    <div className="bg-white rounded-2xl p-6">
      {/* Author Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full overflow-hidden">
            <img src={author.avatar} alt={author.name} className="size-full object-cover" />
          </div>
          <div>
            <div className="font-semibold text-black">{author.name}</div>
            <div className="text-sm text-black/50">
              Minted by <span className="font-semibold">{author.mintedBy}</span> • {author.date} • {author.readTime}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-blue-50 text-primary text-sm font-semibold rounded-lg">
            Support
          </div>
          <Button variant="ghost" size="icon">
            <HiDotsHorizontal className="size-6" />
          </Button>
        </div>
      </div>
      
      {/* Content */}
      <div className="space-y-5">
        <div>
          <h2 
            className="text-xl font-medium text-black cursor-pointer hover:text-primary transition-colors"
            onClick={handleArticleClick}
          >
            {title}
          </h2>
          {publication && (
            <div className="text-sm text-black/50 mt-1">
              Published in{' '}
              <button
                onClick={handlePublicationClick}
                className="font-semibold text-primary hover:text-primary/80 hover:underline transition-colors"
              >
                {publication.name}
              </button>
            </div>
          )}
          <p className="text-black/80 mt-4">
            {description}
          </p>
        </div>
        
        {image && (
          <div 
            className="rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
            onClick={handleArticleClick}
          >
            <img 
              src={image}
              alt="Post image" 
              className="w-full h-[333px] object-cover"
            />
          </div>
        )}

        {(hasReadMore || engagement) && (
          <div className="space-y-5">
            {hasReadMore && (
              <div 
                className="text-primary font-medium cursor-pointer hover:underline"
                onClick={handleArticleClick}
              >
                Read more
              </div>
            )}
            
            {engagement && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className="flex items-center gap-1">
                    <div className="size-7 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-sm">👍</span>
                    </div>
                    <span className="text-gray-600">{engagement.likes}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="size-7 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-sm">💬</span>
                    </div>
                    <span className="text-gray-600">{engagement.comments}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="size-7">
                    <span className="text-sm">🔗</span>
                  </Button>
                  <Button variant="ghost" size="icon" className="size-7">
                    <span className="text-sm">📤</span>
                  </Button>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="size-2 bg-primary rounded"></div>
                  <span className="text-gray-600 text-sm">{engagement.views} views</span>
                </div>
              </div>
            )}

            {/* Tip section */}
            {articleId && publicationId && (
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <TipDisplay amount={totalTips || 0} size="sm" />
                <TipButton 
                  articleId={articleId}
                  publicationId={publicationId}
                  articleTitle={title}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}