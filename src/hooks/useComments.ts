import { useState, useCallback, useEffect } from 'react';
import { commentsAPI } from '@/lib/api';
import { log } from '@/lib/utils/Logger';

interface CommentAuthor {
  id: string;
  publicKey: string;
  username: string | null;
  avatar: string | null;
  shortAddress: string;
}

interface Comment {
  id: string;
  articleId: string;
  content: string;
  author: CommentAuthor;
  createdAt: string;
  isOwner: boolean;
}

interface CommentsState {
  comments: Comment[];
  isLoading: boolean;
  isLoadingMore: boolean;
  isSubmitting: boolean;
  isDeleting: string | null;
  error: string | null;
  hasMore: boolean;
  nextCursor: string | null;
}

interface CommentResult {
  success: boolean;
  message: string;
}

/**
 * Hook for managing article comments
 *
 * Provides functionality to:
 * - Fetch paginated comments
 * - Post new comments
 * - Delete own comments
 * - Handle loading states and errors
 *
 * @param articleId - The article ID to manage comments for
 * @param options - Configuration options
 */
export const useComments = (
  articleId: string,
  options: { initialLimit?: number } = {}
) => {
  const { initialLimit = 3 } = options;

  const [state, setState] = useState<CommentsState>({
    comments: [],
    isLoading: true,
    isLoadingMore: false,
    isSubmitting: false,
    isDeleting: null,
    error: null,
    hasMore: false,
    nextCursor: null,
  });

  /**
   * Fetch comments for the article
   */
  const fetchComments = useCallback(async () => {
    if (!articleId) return;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await commentsAPI.getComments(articleId, { limit: initialLimit });

      if (response.data.success) {
        setState((prev) => ({
          ...prev,
          comments: response.data.data,
          hasMore: response.data.pagination.hasMore,
          nextCursor: response.data.pagination.nextCursor,
          isLoading: false,
        }));
      } else {
        throw new Error('Failed to fetch comments');
      }
    } catch (error: any) {
      log.error('Failed to fetch comments', error, 'useComments');

      // Don't show error for 401 (user not logged in)
      if (error?.response?.status === 401) {
        setState((prev) => ({
          ...prev,
          comments: [],
          isLoading: false,
          error: null,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          error: 'Failed to load comments',
          isLoading: false,
        }));
      }
    }
  }, [articleId, initialLimit]);

  /**
   * Load more comments (pagination)
   */
  const loadMore = useCallback(async () => {
    if (!articleId || !state.nextCursor || state.isLoadingMore) return;

    setState((prev) => ({ ...prev, isLoadingMore: true, error: null }));

    try {
      const response = await commentsAPI.getComments(articleId, {
        limit: initialLimit,
        cursor: state.nextCursor,
      });

      if (response.data.success) {
        setState((prev) => ({
          ...prev,
          comments: [...prev.comments, ...response.data.data],
          hasMore: response.data.pagination.hasMore,
          nextCursor: response.data.pagination.nextCursor,
          isLoadingMore: false,
        }));
      } else {
        throw new Error('Failed to load more comments');
      }
    } catch (error) {
      log.error('Failed to load more comments', error, 'useComments');
      setState((prev) => ({
        ...prev,
        error: 'Failed to load more comments',
        isLoadingMore: false,
      }));
    }
  }, [articleId, state.nextCursor, state.isLoadingMore, initialLimit]);

  /**
   * Submit a new comment
   */
  const submitComment = useCallback(
    async (content: string): Promise<CommentResult> => {
      if (!articleId || !content.trim()) {
        return { success: false, message: 'Comment content is required' };
      }

      setState((prev) => ({ ...prev, isSubmitting: true, error: null }));

      try {
        const response = await commentsAPI.createComment(articleId, content.trim());

        if (response.data.success) {
          // Add new comment to the beginning of the list
          setState((prev) => ({
            ...prev,
            comments: [response.data.data, ...prev.comments],
            isSubmitting: false,
          }));

          log.debug('Comment submitted successfully', {
            articleId,
            commentId: response.data.data.id,
          }, 'useComments');

          return { success: true, message: 'Comment posted successfully' };
        } else {
          throw new Error(response.data.message || 'Failed to post comment');
        }
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || 'Failed to post comment';
        log.error('Failed to submit comment', error, 'useComments');

        setState((prev) => ({
          ...prev,
          error: errorMessage,
          isSubmitting: false,
        }));

        return { success: false, message: errorMessage };
      }
    },
    [articleId]
  );

  /**
   * Delete a comment
   */
  const deleteComment = useCallback(
    async (commentId: string): Promise<CommentResult> => {
      if (!commentId) {
        return { success: false, message: 'Comment ID is required' };
      }

      setState((prev) => ({ ...prev, isDeleting: commentId, error: null }));

      try {
        const response = await commentsAPI.deleteComment(commentId);

        if (response.data.success) {
          // Remove comment from the list
          setState((prev) => ({
            ...prev,
            comments: prev.comments.filter((c) => c.id !== commentId),
            isDeleting: null,
          }));

          log.debug('Comment deleted successfully', { commentId }, 'useComments');

          return { success: true, message: 'Comment deleted successfully' };
        } else {
          throw new Error(response.data.message || 'Failed to delete comment');
        }
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || 'Failed to delete comment';
        log.error('Failed to delete comment', error, 'useComments');

        setState((prev) => ({
          ...prev,
          error: errorMessage,
          isDeleting: null,
        }));

        return { success: false, message: errorMessage };
      }
    },
    []
  );

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  /**
   * Refresh comments from server
   */
  const refresh = useCallback(() => {
    setState((prev) => ({
      ...prev,
      comments: [],
      nextCursor: null,
      hasMore: false,
    }));
    fetchComments();
  }, [fetchComments]);

  // Fetch comments on mount and when articleId changes
  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  return {
    // State
    comments: state.comments,
    isLoading: state.isLoading,
    isLoadingMore: state.isLoadingMore,
    isSubmitting: state.isSubmitting,
    isDeleting: state.isDeleting,
    error: state.error,
    hasMore: state.hasMore,

    // Actions
    loadMore,
    submitComment,
    deleteComment,
    clearError,
    refresh,

    // Computed properties
    commentCount: state.comments.length,
    hasError: !!state.error,
  };
};
