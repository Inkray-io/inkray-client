"use client"

import { useRouter } from "next/navigation"
import { MoreHorizontal, ThumbsUp, MessageCircle, Link, Share } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/constants/routes"
import { TipButton } from "@/components/article/TipButton"
import { TipDisplay } from "@/components/ui/TipDisplay"
import { Avatar } from "@/components/ui/Avatar"
import { createUserAvatarConfig } from "@/lib/utils/avatar"
import { SuiIcon } from "@/components/ui/SuiIcon"
import { useState } from "react"

interface FeedPostProps {
  author: {
    name: string
    avatar: string | null
    address?: string // Full address for proper avatar config generation
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
  const [isTipDialogOpen, setIsTipDialogOpen] = useState(false)
  
  // Create proper avatar config for the author
  const authorAvatarConfig = createUserAvatarConfig({
    publicKey: author.address || author.name, // Use full address if available, otherwise use name
    avatar: author.avatar,
  }, 'md');
  
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
    <div className="bg-white rounded-2xl p-5">
      {/* Author Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Avatar
            {...authorAvatarConfig}
          />
          <div>
            <div className="font-semibold text-black text-sm">{author.name}</div>
            <div className="text-xs text-gray-500">
              Minted by <span className="font-semibold">{author.mintedBy}</span> • {author.date} • {author.readTime}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {articleId && publicationId ? (
            <button 
              className="px-3 py-1.5 bg-blue-50 text-primary text-xs font-semibold rounded-lg hover:bg-blue-100 transition-colors"
              onClick={() => setIsTipDialogOpen(true)}
            >
              Support
            </button>
          ) : (
            <div className="px-3 py-1.5 bg-blue-50 text-primary text-xs font-semibold rounded-lg">
              Support
            </div>
          )}
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="size-5" />
          </Button>
        </div>
      </div>
      
      {/* Content */}
      <div className="space-y-4">
        <div>
          <h2 
            className="text-lg font-semibold text-black cursor-pointer hover:text-primary transition-colors"
            onClick={handleArticleClick}
          >
            {title}
          </h2>
          {publication && (
            <div className="text-xs text-gray-500 mt-1">
              Published in{' '}
              <button
                onClick={handlePublicationClick}
                className="font-semibold text-primary hover:text-primary/80 hover:underline transition-colors"
              >
                {publication.name}
              </button>
            </div>
          )}
          <p className="text-gray-700 text-sm mt-3 leading-relaxed">
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
          <div className="space-y-3">
            {hasReadMore && (
              <div 
                className="text-primary text-sm font-medium cursor-pointer hover:underline"
                onClick={handleArticleClick}
              >
                Read more
              </div>
            )}
            
            {engagement && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button className="flex items-center gap-1.5 p-1 rounded-md hover:bg-gray-100 transition-colors group">
                    <ThumbsUp className="size-4 text-gray-600 group-hover:text-gray-700" />
                    <span className="text-gray-600 text-sm group-hover:text-gray-700">{engagement.likes}</span>
                  </button>
                  <button className="flex items-center gap-1.5 p-1 rounded-md hover:bg-gray-100 transition-colors group">
                    <MessageCircle className="size-4 text-gray-600 group-hover:text-gray-700" />
                    <span className="text-gray-600 text-sm group-hover:text-gray-700">{engagement.comments}</span>
                  </button>
                  {articleId && publicationId && (
                    <button 
                      className="flex items-center gap-1.5 p-1 rounded-md hover:bg-gray-100 transition-colors group"
                      onClick={() => setIsTipDialogOpen(true)}
                    >
                      <SuiIcon className="size-4 text-gray-600 group-hover:text-gray-700" />
                      <span className="text-gray-600 text-sm group-hover:text-gray-700">
                        <TipDisplay amount={totalTips || 0} size="sm" showIcon={false} inheritColor={true} />
                      </span>
                    </button>
                  )}
                  <Button variant="ghost" size="icon" className="size-8 hover:bg-gray-100">
                    <Link className="size-4 text-gray-600" />
                  </Button>
                  <Button variant="ghost" size="icon" className="size-8 hover:bg-gray-100">
                    <Share className="size-4 text-gray-600" />
                  </Button>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="size-2 bg-primary rounded"></div>
                  <span className="text-gray-600 text-sm">{engagement.views} views</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tip Dialog */}
      {articleId && publicationId && isTipDialogOpen && (
        <TipButton 
          articleId={articleId}
          publicationId={publicationId}
          articleTitle={title}
          isOpen={isTipDialogOpen}
          onOpenChange={setIsTipDialogOpen}
        />
      )}
    </div>
  )
}