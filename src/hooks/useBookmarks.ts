import { useState, useCallback, useEffect } from 'react';
import { bookmarksAPI } from '@/lib/api';
import { log } from '@/lib/utils/Logger';

interface BookmarkState {
  isBookmarked: boolean;
  bookmarkCount: number;
  isLoading: boolean;
  error: string | null;
}

interface BookmarkResult {
  success: boolean;
  message: string;
  action?: 'bookmarked' | 'unbookmarked';
}

/**
 * Hook for managing article bookmark operations
 *
 * Provides functionality to:
 * - Bookmark/unbookmark articles
 * - Get bookmark status
 * - Handle loading states and errors
 * - Optimistic UI updates
 *
 * @param articleId - The article ID to manage bookmarks for
 * @param initialBookmarkInfo - Initial bookmark state from article data
 */
export const useBookmarks = (
  articleId: string,
  initialBookmarkInfo?: {
    isBookmarked: boolean;
    bookmarkCount: number;
  }
) => {
  const [bookmarkState, setBookmarkState] = useState<BookmarkState>({
    isBookmarked: initialBookmarkInfo?.isBookmarked ?? false,
    bookmarkCount: initialBookmarkInfo?.bookmarkCount ?? 0,
    isLoading: false,
    error: null,
  });

  /**
   * Sync state with initialBookmarkInfo when it changes (e.g., when article data loads)
   */
  useEffect(() => {
    if (initialBookmarkInfo) {
      setBookmarkState((prev) => ({
        ...prev,
        isBookmarked: initialBookmarkInfo.isBookmarked,
        bookmarkCount: initialBookmarkInfo.bookmarkCount,
      }));
    }
  }, [initialBookmarkInfo?.isBookmarked, initialBookmarkInfo?.bookmarkCount]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setBookmarkState((prev) => ({ ...prev, error: null }));
  }, []);

  /**
   * Bookmark an article
   */
  const bookmarkArticle = useCallback(async (): Promise<BookmarkResult> => {
    if (!articleId) {
      return { success: false, message: 'Article ID is required' };
    }

    setBookmarkState((prev) => ({ ...prev, isLoading: true, error: null }));

    // Optimistic update
    setBookmarkState((prev) => ({
      ...prev,
      isBookmarked: true,
      bookmarkCount: prev.bookmarkCount + 1,
    }));

    try {
      const response = await bookmarksAPI.bookmarkArticle(articleId);

      if (response.data.success) {
        log.debug(
          'Successfully bookmarked article',
          {
            articleId,
            message: response.data.message,
          },
          'useBookmarks'
        );

        // Update with actual bookmark count from server
        setBookmarkState((prev) => ({
          ...prev,
          bookmarkCount: response.data.data.bookmarkCount || prev.bookmarkCount,
        }));

        return {
          success: true,
          message: response.data.message,
          action: 'bookmarked',
        };
      } else {
        throw new Error(response.data.message || 'Failed to bookmark article');
      }
    } catch (error) {
      log.error('Failed to bookmark article', error, 'useBookmarks');

      // Revert optimistic update
      setBookmarkState((prev) => ({
        ...prev,
        isBookmarked: false,
        bookmarkCount: Math.max(0, prev.bookmarkCount - 1),
        error:
          error instanceof Error ? error.message : 'Failed to bookmark article',
      }));

      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to bookmark article',
      };
    } finally {
      setBookmarkState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [articleId]);

  /**
   * Remove bookmark from an article
   */
  const unbookmarkArticle = useCallback(async (): Promise<BookmarkResult> => {
    if (!articleId) {
      return { success: false, message: 'Article ID is required' };
    }

    setBookmarkState((prev) => ({ ...prev, isLoading: true, error: null }));

    // Optimistic update
    setBookmarkState((prev) => ({
      ...prev,
      isBookmarked: false,
      bookmarkCount: Math.max(0, prev.bookmarkCount - 1),
    }));

    try {
      const response = await bookmarksAPI.unbookmarkArticle(articleId);

      if (response.data.success) {
        log.debug(
          'Successfully unbookmarked article',
          {
            articleId,
            message: response.data.message,
          },
          'useBookmarks'
        );

        // Update with actual bookmark count from server
        setBookmarkState((prev) => ({
          ...prev,
          bookmarkCount: response.data.data.bookmarkCount || prev.bookmarkCount,
        }));

        return {
          success: true,
          message: response.data.message,
          action: 'unbookmarked',
        };
      } else {
        throw new Error(
          response.data.message || 'Failed to unbookmark article'
        );
      }
    } catch (error) {
      log.error('Failed to unbookmark article', error, 'useBookmarks');

      // Revert optimistic update
      setBookmarkState((prev) => ({
        ...prev,
        isBookmarked: true,
        bookmarkCount: prev.bookmarkCount + 1,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to unbookmark article',
      }));

      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to unbookmark article',
      };
    } finally {
      setBookmarkState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [articleId]);

  /**
   * Toggle bookmark status (bookmark if not bookmarked, unbookmark if bookmarked)
   */
  const toggleBookmark = useCallback(async (): Promise<BookmarkResult> => {
    if (!articleId) {
      return { success: false, message: 'Article ID is required' };
    }

    setBookmarkState((prev) => ({ ...prev, isLoading: true, error: null }));

    // Optimistic update
    const wasBookmarked = bookmarkState.isBookmarked;
    setBookmarkState((prev) => ({
      ...prev,
      isBookmarked: !prev.isBookmarked,
      bookmarkCount: prev.isBookmarked
        ? Math.max(0, prev.bookmarkCount - 1)
        : prev.bookmarkCount + 1,
    }));

    try {
      const response = await bookmarksAPI.toggleBookmark(articleId);

      if (response.data.success) {
        const action = response.data.data.action;
        log.debug(
          `Successfully ${action} article`,
          {
            articleId,
            action,
            message: response.data.message,
          },
          'useBookmarks'
        );

        // Update with actual bookmark count from server
        setBookmarkState((prev) => ({
          ...prev,
          bookmarkCount: response.data.data.bookmarkCount || prev.bookmarkCount,
        }));

        return {
          success: true,
          message: response.data.message,
          action,
        };
      } else {
        throw new Error(
          response.data.message || 'Failed to toggle bookmark status'
        );
      }
    } catch (error) {
      log.error('Failed to toggle bookmark status', error, 'useBookmarks');

      let errorMessage = 'Failed to toggle bookmark status';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as {
          response?: { status: number; data?: { message: string } };
        };
        if (axiosError.response?.status === 401) {
          errorMessage = 'Please log in to bookmark articles';
        } else if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        }
      }

      // Revert optimistic update
      setBookmarkState((prev) => ({
        ...prev,
        isBookmarked: wasBookmarked,
        bookmarkCount: wasBookmarked
          ? prev.bookmarkCount + 1
          : Math.max(0, prev.bookmarkCount - 1),
        error: errorMessage,
      }));

      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setBookmarkState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [articleId, bookmarkState.isBookmarked]);

  /**
   * Refresh bookmark status from server
   */
  const refreshBookmarkStatus = useCallback(async () => {
    if (!articleId) return;

    setBookmarkState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await bookmarksAPI.getBookmarkStatus(articleId);

      if (response.data.success) {
        const { isBookmarked, bookmarkCount } = response.data.data;

        setBookmarkState((prev) => ({
          ...prev,
          isBookmarked,
          bookmarkCount,
        }));
      }
    } catch (error) {
      log.error('Failed to refresh bookmark status', error, 'useBookmarks');
      setBookmarkState((prev) => ({
        ...prev,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to refresh bookmark status',
      }));
    } finally {
      setBookmarkState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [articleId]);

  return {
    // State
    isBookmarked: bookmarkState.isBookmarked,
    bookmarkCount: bookmarkState.bookmarkCount,
    isLoading: bookmarkState.isLoading,
    error: bookmarkState.error,

    // Actions
    bookmark: bookmarkArticle,
    unbookmark: unbookmarkArticle,
    toggleBookmark,
    refreshBookmarkStatus,
    clearError,

    // Computed properties
    hasError: !!bookmarkState.error,
    canBookmark: !bookmarkState.isLoading,
  };
};
