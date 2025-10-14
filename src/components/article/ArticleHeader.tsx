"use client"

import { HiDotsHorizontal } from "react-icons/hi"
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
    <div className="bg-white rounded-2xl p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar
            src={author.avatar}
            alt={author.name}
            size="md"
            fallbackText={author.name}
          />
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
    </div>
  )
}