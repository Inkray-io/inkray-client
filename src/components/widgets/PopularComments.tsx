"use client"

import { ThumbsUp } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';

interface Comment {
  id: string
  author: {
    name: string
    avatar: string
  }
  date: string
  content: string
  reactions: number
}

interface PopularCommentsProps {
  comments?: Comment[]
}

export function PopularComments({ comments }: PopularCommentsProps) {
  // Default comments matching Figma design
  const defaultComments: Comment[] = [
    {
      id: "1",
      author: {
        name: "AnonInk",
        avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face"
      },
      date: "14 Aug",
      content: "Every chain pumps adoption news. Robinhood is big exposure, but let's see if it translates into actual usage of Sui tech.",
      reactions: 11
    },
    {
      id: "2",
      author: {
        name: "SilentType", 
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face"
      },
      date: "15 Aug",
      content: "In a world where technology evolves rapidly, embracing innovation is key to staying ahead. We are committed to pushing boundaries in",
      reactions: 20
    },
    {
      id: "3",
      author: {
        name: "VoidWriter",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
      },
      date: "15 Aug",
      content: "Mom, can we get ETH?\" – \"We have ETH at home.\" – ETH at home: SUI on Robinhood.\"\n\"SUI Army W!",
      reactions: 20
    }
  ]

  const displayComments = comments || defaultComments

  return (
    <div className="bg-white rounded-2xl p-5">
      <div className="mb-4">
        <h3 className="font-semibold text-black text-lg">Popular comments</h3>
      </div>
      
      <div className="space-y-4">
        {displayComments.map((comment) => (
          <div key={comment.id} className="space-y-2">
            {/* Author Header */}
            <div className="flex items-center gap-3">
              <Avatar
                src={comment.author.avatar}
                alt={comment.author.name}
                size="md"
                fallbackText={comment.author.name}
              />
              <div className="flex items-center gap-1">
                <span className="text-black text-sm font-semibold">
                  {comment.author.name}
                </span>
                <div className="w-0.5 h-0.5 bg-gray-400 rounded-full"></div>
                <span className="text-gray-500 text-xs">
                  {comment.date}
                </span>
              </div>
            </div>

            {/* Comment Content */}
            <div className="space-y-1.5">
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                {comment.content}
              </p>
              
              {/* Appreciations */}
              <div className="flex items-center gap-1.5">
                <ThumbsUp className="size-4 text-gray-600" />
                <span className="text-gray-600 text-sm">
                  {comment.reactions} appreciations
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}