"use client"

import React, { useState, useEffect } from 'react';
import { log } from '@/lib/utils/Logger';

interface Comment {
  id: string
  author: {
    name: string
    avatar: string
  }
  date: string
  content: string
  reactions: number
  reactionTypes?: string[]
}

interface PopularCommentsProps {
  comments?: Comment[]
  onError?: (error: string) => void
}

interface PopularCommentsState {
  isLoading: boolean
  error: string | null
  displayComments: Comment[]
}

export function PopularComments({ comments, onError }: PopularCommentsProps) {
  const [state, setState] = useState<PopularCommentsState>({
    isLoading: false,
    error: null,
    displayComments: []
  });

  // Default comments as fallback
  const defaultComments: Comment[] = [
    {
      id: "1",
      author: {
        name: "AnonInk",
        avatar: "/placeholder-user.jpg"
      },
      date: "14 Aug",
      content: "Every chain pumps adoption news. Robinhood is big exposure, but let's see if it translates into actual usage of Sui tech.",
      reactions: 11,
      reactionTypes: ["yellow", "red", "blue"]
    },
    {
      id: "2",
      author: {
        name: "SilentType", 
        avatar: "/placeholder-user.jpg"
      },
      date: "15 Aug",
      content: "In a world where technology evolves rapidly, embracing innovation is key to staying ahead. We are committed to pushing boundaries in",
      reactions: 20,
      reactionTypes: ["yellow", "blue"]
    },
    {
      id: "3",
      author: {
        name: "VoidWriter",
        avatar: "/placeholder-user.jpg"
      },
      date: "15 Aug",
      content: "\"Mom, can we get ETH?\" – \"We have ETH at home.\" – ETH at home: SUI on Robinhood.\"\n\"SUI Army W!",
      reactions: 20,
      reactionTypes: ["yellow", "blue"]
    }
  ]

  // Initialize comments when component mounts or when comments prop changes
  useEffect(() => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const commentsToDisplay = comments || defaultComments;
      
      // Validate comments structure
      const validatedComments = commentsToDisplay.filter(comment => {
        if (!comment.id || !comment.author?.name || !comment.content) {
          log.warn('Invalid comment structure detected', comment, 'PopularComments');
          return false;
        }
        return true;
      });

      setState(prev => ({
        ...prev,
        isLoading: false,
        displayComments: validatedComments,
        error: null
      }));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load comments';
      log.error('Error loading comments', error, 'PopularComments');
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        displayComments: defaultComments,
        error: errorMessage
      }));

      onError?.(errorMessage);
    }
  }, [comments, onError]);

  const getReactionColor = (type: string) => {
    switch (type) {
      case "yellow": return "bg-yellow-400"
      case "red": return "bg-red-400"
      case "blue": return "bg-blue-400"
      case "green": return "bg-green-400"
      default: return "bg-gray-400"
    }
  }

  // Loading state
  if (state.isLoading) {
    return (
      <div className="bg-white rounded-2xl p-5">
        <h3 className="font-medium text-black mb-4">Popular comments</h3>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center gap-3 mb-2">
                <div className="size-10 rounded-full bg-gray-200"></div>
                <div className="space-y-1">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (state.error) {
    return (
      <div className="bg-white rounded-2xl p-5">
        <h3 className="font-medium text-black mb-4">Popular comments</h3>
        <div className="text-center py-8">
          <div className="text-red-500 mb-2">⚠️</div>
          <div className="text-sm text-gray-600">Failed to load comments</div>
          <button 
            onClick={() => window.location.reload()} 
            className="text-blue-500 text-sm mt-2 hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-5">
      <h3 className="font-medium text-black mb-4">Popular comments</h3>
      
      <div className="space-y-4">
        {state.displayComments.map((comment) => (
          <div key={comment.id} className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-gray-200 overflow-hidden">
                <img src={comment.author.avatar} alt={comment.author.name} className="size-full object-cover" />
              </div>
              <div>
                <div className="font-semibold text-black">{comment.author.name}</div>
                <div className="text-sm text-black/50">{comment.date}</div>
              </div>
            </div>
            <div className="text-sm text-black leading-relaxed whitespace-pre-line">
              {comment.content}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {comment.reactionTypes?.map((type, index) => (
                  <div key={index} className={`size-4 rounded ${getReactionColor(type)}`} />
                ))}
              </div>
              <span className="text-sm text-gray-600">{comment.reactions} reactions</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}