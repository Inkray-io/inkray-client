"use client";

import { useState, useCallback } from 'react';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FollowButtonProps {
  isFollowing: boolean;
  isLoading?: boolean;
  followerCount?: number;
  onToggleFollow: () => Promise<void>;
  showFollowerCount?: boolean;
  className?: string;
}

export function FollowButton({
  isFollowing,
  isLoading = false,
  followerCount,
  onToggleFollow,
  showFollowerCount = false,
  className,
}: FollowButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleClick = useCallback(async () => {
    if (isLoading || isProcessing) return;

    setIsProcessing(true);
    try {
      await onToggleFollow();
    } catch (error) {
      console.error('Follow toggle failed:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [onToggleFollow, isLoading, isProcessing]);

  const isActionLoading = isLoading || isProcessing;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleClick}
        disabled={isActionLoading}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200',
          isFollowing 
            ? 'bg-gray-50 text-gray-700 hover:bg-red-50 hover:text-red-600' 
            : 'bg-blue-50 text-primary hover:bg-blue-100',
          isActionLoading && 'opacity-50 cursor-not-allowed',
          className
        )}
      >
        {isActionLoading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : isFollowing ? (
          <UserMinus className="h-3 w-3" />
        ) : (
          <UserPlus className="h-3 w-3" />
        )}
        
        <span>
          {isActionLoading 
            ? 'Loading...'
            : isFollowing 
              ? 'Following' 
              : 'Follow'
          }
        </span>
      </button>

      {showFollowerCount && typeof followerCount === 'number' && (
        <span className="text-xs text-gray-500">
          {followerCount.toLocaleString()} {followerCount === 1 ? 'follower' : 'followers'}
        </span>
      )}
    </div>
  );
}

export default FollowButton;