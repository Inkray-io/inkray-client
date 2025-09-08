"use client"

import { useRouter } from "next/navigation"
import { HiDotsHorizontal } from "react-icons/hi"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/constants/routes"

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
}

export function FeedPost({ 
  author, 
  title, 
  description, 
  image, 
  hasReadMore = false,
  engagement
}: FeedPostProps) {
  const router = useRouter()
  
  // Create a simple ID from the title for navigation
  const articleId = title.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  
  const handleArticleClick = () => {
    router.push(ROUTES.ARTICLE_WITH_ID(articleId))
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
        <div className="space-y-3">
          <h2 
            className="text-xl font-medium text-black cursor-pointer hover:text-primary transition-colors"
            onClick={handleArticleClick}
          >
            {title}
          </h2>
          <p className="text-black/80">
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
          </div>
        )}
      </div>
    </div>
  )
}