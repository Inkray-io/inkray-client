"use client"

import { MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/Avatar"

interface ArticleHeaderProps {
  author: {
    name: string
    avatar: string
    mintedBy: number
    date: string
    readTime: string
  }
}

export function ArticleHeader({ author }: ArticleHeaderProps) {
  return (
    <div className="bg-white rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar
            src={author.avatar}
            alt={author.name}
            size="md"
            fallbackText={author.name}
          />
          <div>
            <div className="font-semibold text-black text-sm">{author.name}</div>
            <div className="text-xs text-gray-500">
              Minted by <span className="font-semibold">{author.mintedBy}</span> • {author.date} • {author.readTime}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 bg-blue-50 text-primary text-xs font-semibold rounded-lg">
            Support
          </div>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="size-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}