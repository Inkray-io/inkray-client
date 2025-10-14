"use client"

import { Button } from "@/components/ui/button"
import { createUserAvatarConfig } from "@/lib/utils/avatar"
import { Avatar } from "@/components/ui/Avatar"

interface ArticleFooterProps {
  engagement: {
    likes: number
    comments: number
    views: number
  }
}

export function ArticleFooter({ engagement }: ArticleFooterProps) {
  return (
    <div className="bg-white rounded-2xl p-6">
      <div className="space-y-6">
        {/* Engagement Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="flex items-center gap-0.5 sm:gap-1">
                <Button variant="ghost" size="icon" className="size-6 sm:size-8 hover:bg-red-50">
                  <span className="text-sm sm:text-lg">❤️</span>
                </Button>
                <span className="text-primary font-medium text-xs sm:text-sm">{engagement.likes}</span>
              </div>

              <div className="flex items-center gap-0.5 sm:gap-1">
                <Button variant="ghost" size="icon" className="size-6 sm:size-8 hover:bg-blue-50">
                  <span className="text-sm sm:text-lg">👍</span>
                </Button>
                <span className="text-primary font-medium text-xs sm:text-sm">{engagement.comments}</span>
              </div>
            </div>

            <div className="flex items-center gap-0.5 sm:gap-2">
              <Button variant="ghost" size="icon" className="size-6 sm:size-8">
                <span className="text-sm sm:text-lg">💬</span>
              </Button>
              <span className="text-gray-600 text-xs sm:text-sm">{engagement.comments}</span>
            </div>

            <Button variant="ghost" size="icon" className="size-6 sm:size-8">
              <span className="text-sm sm:text-lg">🔗</span>
            </Button>

            <Button variant="ghost" size="icon" className="size-6 sm:size-8">
              <span className="text-sm sm:text-lg">📤</span>
            </Button>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5">
            <div className="size-1.5 sm:size-2 bg-primary rounded"></div>
            <span className="text-gray-600 text-xs sm:text-sm">{engagement.views} views</span>
          </div>
        </div>

        {/* Comment Preview */}
        <div className="border-t border-gray-100 pt-6">
          <div className="flex items-center gap-3 mb-4">
            <Avatar
              {...createUserAvatarConfig({
                publicKey: "anonymous_commenter",
                name: "Anonymous User",
              }, 'md')}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-black text-sm">Anonymous User</span>
                <span className="text-gray-500 text-xs">•</span>
                <span className="text-gray-500 text-xs">2 hours ago</span>
              </div>
              <p className="text-sm text-black/80">
                And even without this new our data is everywhere, why should we be afraid of it all. I think everyone understands that our information has long been in the...
              </p>
            </div>
          </div>

          <div className="ml-13">
            <Button variant="ghost" size="sm" className="text-primary hover:bg-blue-50 px-0">
              1 reply to post →
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}