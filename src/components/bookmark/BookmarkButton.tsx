"use client";

import { useState, useCallback } from 'react';
import { Bookmark, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { log } from '@/lib/utils/Logger';

interface BookmarkButtonProps {
  isBookmarked: boolean;
  isLoading?: boolean;
  bookmarkCount?: number;
  onToggleBookmark: () => Promise<void>;
  showBookmarkCount?: boolean;
  className?: string;
  variant?: 'button' | 'engagement'; // button for standalone, engagement for feed items
}

export function BookmarkButton({
  isBookmarked,
  isLoading = false,
  bookmarkCount,
  onToggleBookmark,
  showBookmarkCount = true,
  className,
  variant = 'button',
}: BookmarkButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleClick = useCallback(async () => {
    if (isLoading || isProcessing) return;

    setIsProcessing(true);
    try {
      await onToggleBookmark();
    } catch (error) {
      log.error('Bookmark toggle failed', { error }, 'BookmarkButton');
    } finally {
      setIsProcessing(false);
    }
  }, [onToggleBookmark, isLoading, isProcessing]);

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
          <Bookmark
            className={cn(
              'h-4 w-4 transition-colors',
              isBookmarked
                ? 'text-amber-600 fill-amber-600'
                : 'text-gray-500 group-hover:text-amber-600'
            )}
          />
        )}

        {showBookmarkCount && typeof bookmarkCount === 'number' && (
          <span
            className={cn(
              'text-xs transition-colors',
              isBookmarked
                ? 'text-amber-600'
                : 'text-gray-500 group-hover:text-amber-600'
            )}
          >
            {bookmarkCount.toLocaleString()}
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
          isBookmarked
            ? 'bg-amber-50 text-amber-600 hover:bg-amber-100'
            : 'bg-gray-50 text-gray-700 hover:bg-amber-50 hover:text-amber-600',
          isActionLoading && 'opacity-50 cursor-not-allowed',
          className
        )}
      >
        {isActionLoading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Bookmark className={cn('h-3 w-3', isBookmarked && 'fill-current')} />
        )}

        <span>
          {isActionLoading ? 'Loading...' : isBookmarked ? 'Saved' : 'Save'}
        </span>
      </button>

      {showBookmarkCount && typeof bookmarkCount === 'number' && (
        <span className="text-xs text-gray-500">
          {bookmarkCount.toLocaleString()} saved
        </span>
      )}
    </div>
  );
}

export default BookmarkButton;
