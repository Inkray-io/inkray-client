"use client";

import { useState, useCallback } from 'react';
import { ThumbsUp, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LikeButtonProps {
  isLiked: boolean;
  isLoading?: boolean;
  likeCount?: number;
  onToggleLike: () => Promise<void>;
  showLikeCount?: boolean;
  className?: string;
  variant?: 'button' | 'engagement'; // button for standalone, engagement for feed items
}

export function LikeButton({
  isLiked,
  isLoading = false,
  likeCount,
  onToggleLike,
  showLikeCount = true,
  className,
  variant = 'button',
}: LikeButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleClick = useCallback(async () => {
    if (isLoading || isProcessing) return;

    setIsProcessing(true);
    try {
      await onToggleLike();
    } catch (error) {
      console.error('Like toggle failed:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [onToggleLike, isLoading, isProcessing]);

  const isActionLoading = isLoading || isProcessing;

  if (variant === 'engagement') {
    return (
      <button
        onClick={handleClick}
        disabled={isActionLoading}
        className={cn(
          'flex items-center gap-1.5 p-1 rounded-md hover:bg-gray-100 transition-colors group',
          isActionLoading && 'opacity-50 cursor-not-allowed',
          className
        )}
      >
        {isActionLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
        ) : (
          <ThumbsUp 
            className={cn(
              'h-4 w-4 transition-colors',
              isLiked 
                ? 'text-blue-600 fill-blue-600' 
                : 'text-gray-500 group-hover:text-blue-600'
            )} 
          />
        )}
        
        {showLikeCount && typeof likeCount === 'number' && (
          <span className={cn(
            'text-xs transition-colors',
            isLiked 
              ? 'text-blue-600' 
              : 'text-gray-500 group-hover:text-blue-600'
          )}>
            {likeCount.toLocaleString()}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleClick}
        disabled={isActionLoading}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200',
          isLiked 
            ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' 
            : 'bg-gray-50 text-gray-700 hover:bg-blue-50 hover:text-blue-600',
          isActionLoading && 'opacity-50 cursor-not-allowed',
          className
        )}
      >
        {isActionLoading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <ThumbsUp 
            className={cn(
              'h-3 w-3',
              isLiked && 'fill-current'
            )} 
          />
        )}
        
        <span>
          {isActionLoading 
            ? 'Loading...'
            : isLiked 
              ? 'Liked' 
              : 'Like'
          }
        </span>
      </button>

      {showLikeCount && typeof likeCount === 'number' && (
        <span className="text-xs text-gray-500">
          {likeCount.toLocaleString()} {likeCount === 1 ? 'like' : 'likes'}
        </span>
      )}
    </div>
  );
}

export default LikeButton;