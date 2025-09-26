"use client";

import { useFollows } from '@/hooks/useFollows';
import { FollowButton } from './FollowButton';
import { Users, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FollowBarProps {
  publicationId: string;
  publicationName: string;
  initialFollowInfo: {
    isFollowing: boolean;
    followerCount: number;
    followedAt?: string;
  };
  className?: string;
  variant?: 'default' | 'compact';
}

export function FollowBar({
  publicationId,
  publicationName,
  initialFollowInfo,
  className,
  variant = 'default',
}: FollowBarProps) {
  const {
    isFollowing,
    followerCount,
    isLoading,
    error,
    toggleFollow,
    clearError,
    hasError,
  } = useFollows(publicationId, initialFollowInfo);

  const handleToggleFollow = async () => {
    if (hasError) clearError();
    await toggleFollow();
  };

  if (variant === 'compact') {
    return (
      <div className={cn(
        'flex items-center justify-between p-3 bg-gray-50 rounded-lg border',
        className
      )}>
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <Users className="h-4 w-4 text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-gray-900 truncate text-sm">
              {publicationName}
            </p>
            <p className="text-xs text-muted-foreground">
              {followerCount.toLocaleString()} {followerCount === 1 ? 'follower' : 'followers'}
            </p>
          </div>
        </div>
        
        <FollowButton
          isFollowing={isFollowing}
          isLoading={isLoading}
          onToggleFollow={handleToggleFollow}
          size="sm"
          variant="outline"
        />
      </div>
    );
  }

  return (
    <div className={cn(
      'bg-white border rounded-xl p-6 space-y-4',
      className
    )}>
      {/* Publication Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Publication Avatar */}
          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <Users className="h-6 w-6 text-white" />
          </div>
          
          {/* Publication Info */}
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-lg text-gray-900 truncate">
              {publicationName}
            </h3>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>
                {followerCount.toLocaleString()} {followerCount === 1 ? 'follower' : 'followers'}
              </span>
              {initialFollowInfo.followedAt && isFollowing && (
                <span>
                  Following since {new Date(initialFollowInfo.followedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Follow Button */}
        <div className="flex-shrink-0">
          <FollowButton
            isFollowing={isFollowing}
            isLoading={isLoading}
            onToggleFollow={handleToggleFollow}
            size="default"
            variant={isFollowing ? 'outline' : 'default'}
          />
        </div>
      </div>

      {/* Follow Status Message */}
      {isFollowing && (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-lg">
          <Users className="h-4 w-4 flex-shrink-0" />
          <span>
            You&apos;re following this publication. You&apos;ll see new articles in your feed.
          </span>
        </div>
      )}

      {/* Error Message */}
      {hasError && error && (
        <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 p-3 rounded-lg">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
          <button
            onClick={clearError}
            className="ml-auto text-red-600 hover:text-red-800 text-xs font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Publication Description */}
      <div className="text-sm text-muted-foreground">
        <p>
          Follow <strong>{publicationName}</strong> to get notified about new articles 
          and updates from this publication.
        </p>
      </div>
    </div>
  );
}

export default FollowBar;