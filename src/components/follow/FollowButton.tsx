"use client";

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FollowButtonProps {
  isFollowing: boolean;
  isLoading?: boolean;
  followerCount?: number;
  onToggleFollow: () => Promise<void>;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showFollowerCount?: boolean;
  className?: string;
}

export function FollowButton({
  isFollowing,
  isLoading = false,
  followerCount,
  onToggleFollow,
  variant = 'default',
  size = 'default',
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

  const buttonVariant = isFollowing 
    ? (variant === 'default' ? 'outline' : variant)
    : variant;

  const sizeClasses = {
    default: 'h-9 px-4 text-sm',
    sm: 'h-8 px-3 text-xs',
    lg: 'h-10 px-6 text-base',
    icon: 'h-9 w-9',
  };

  const isActionLoading = isLoading || isProcessing;

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={buttonVariant}
        size={size}
        onClick={handleClick}
        disabled={isActionLoading}
        className={cn(
          'flex items-center gap-2 transition-all duration-200',
          sizeClasses[size],
          isFollowing && 'hover:bg-red-50 hover:text-red-600 hover:border-red-200',
          className
        )}
      >
        {isActionLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isFollowing ? (
          <UserMinus className="h-4 w-4" />
        ) : (
          <UserPlus className="h-4 w-4" />
        )}
        
        <span className="font-medium">
          {isActionLoading 
            ? 'Loading...'
            : isFollowing 
              ? 'Following' 
              : 'Follow'
          }
        </span>
      </Button>

      {showFollowerCount && typeof followerCount === 'number' && (
        <span className="text-sm text-muted-foreground">
          {followerCount.toLocaleString()} {followerCount === 1 ? 'follower' : 'followers'}
        </span>
      )}
    </div>
  );
}

export default FollowButton;