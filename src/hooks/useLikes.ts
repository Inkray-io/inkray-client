import { useState, useCallback, useEffect } from 'react';
import { likesAPI } from '@/lib/api';
import { log } from '@/lib/utils/Logger';

interface LikeState {
  isLiked: boolean;
  likeCount: number;
  isLoading: boolean;
  error: string | null;
}

interface LikeResult {
  success: boolean;
  message: string;
  action?: 'liked' | 'unliked';
}

/**
 * Hook for managing article like operations
 * 
 * Provides functionality to:
 * - Like/unlike articles
 * - Get like status
 * - Handle loading states and errors
 * - Optimistic UI updates
 * 
 * @param articleId - The article ID to manage likes for
 * @param initialLikeInfo - Initial like state from article data
 */
export const useLikes = (
  articleId: string,
  initialLikeInfo?: {
    isLiked: boolean;
    likeCount: number;
  }
) => {
  const [likeState, setLikeState] = useState<LikeState>({
    isLiked: initialLikeInfo?.isLiked ?? false,
    likeCount: initialLikeInfo?.likeCount ?? 0,
    isLoading: false,
    error: null,
  });

  /**
   * Sync state with initialLikeInfo when it changes (e.g., when article data loads)
   */
  useEffect(() => {
    if (initialLikeInfo) {
      setLikeState(prev => ({
        ...prev,
        isLiked: initialLikeInfo.isLiked,
        likeCount: initialLikeInfo.likeCount,
      }));
    }
  }, [initialLikeInfo?.isLiked, initialLikeInfo?.likeCount]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setLikeState(prev => ({ ...prev, error: null }));
  }, []);

  /**
   * Like an article
   */
  const likeArticle = useCallback(async (): Promise<LikeResult> => {
    if (!articleId) {
      return { success: false, message: 'Article ID is required' };
    }

    setLikeState(prev => ({ ...prev, isLoading: true, error: null }));

    // Optimistic update
    setLikeState(prev => ({
      ...prev,
      isLiked: true,
      likeCount: prev.likeCount + 1,
    }));

    try {
      const response = await likesAPI.likeArticle(articleId);
      
      if (response.data.success) {
        log.debug('Successfully liked article', {
          articleId,
          message: response.data.message,
        }, 'useLikes');

        // Update with actual like count from server
        setLikeState(prev => ({
          ...prev,
          likeCount: response.data.data.likeCount || prev.likeCount,
        }));

        return {
          success: true,
          message: response.data.message,
          action: 'liked',
        };
      } else {
        throw new Error(response.data.message || 'Failed to like article');
      }
    } catch (error) {
      log.error('Failed to like article', error, 'useLikes');
      
      // Revert optimistic update
      setLikeState(prev => ({
        ...prev,
        isLiked: false,
        likeCount: Math.max(0, prev.likeCount - 1),
        error: error instanceof Error ? error.message : 'Failed to like article',
      }));

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to like article',
      };
    } finally {
      setLikeState(prev => ({ ...prev, isLoading: false }));
    }
  }, [articleId]);

  /**
   * Unlike an article
   */
  const unlikeArticle = useCallback(async (): Promise<LikeResult> => {
    if (!articleId) {
      return { success: false, message: 'Article ID is required' };
    }

    setLikeState(prev => ({ ...prev, isLoading: true, error: null }));

    // Optimistic update
    setLikeState(prev => ({
      ...prev,
      isLiked: false,
      likeCount: Math.max(0, prev.likeCount - 1),
    }));

    try {
      const response = await likesAPI.unlikeArticle(articleId);
      
      if (response.data.success) {
        log.debug('Successfully unliked article', {
          articleId,
          message: response.data.message,
        }, 'useLikes');

        // Update with actual like count from server
        setLikeState(prev => ({
          ...prev,
          likeCount: response.data.data.likeCount || prev.likeCount,
        }));

        return {
          success: true,
          message: response.data.message,
          action: 'unliked',
        };
      } else {
        throw new Error(response.data.message || 'Failed to unlike article');
      }
    } catch (error) {
      log.error('Failed to unlike article', error, 'useLikes');
      
      // Revert optimistic update
      setLikeState(prev => ({
        ...prev,
        isLiked: true,
        likeCount: prev.likeCount + 1,
        error: error instanceof Error ? error.message : 'Failed to unlike article',
      }));

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to unlike article',
      };
    } finally {
      setLikeState(prev => ({ ...prev, isLoading: false }));
    }
  }, [articleId]);

  /**
   * Toggle like status (like if not liked, unlike if liked)
   */
  const toggleLike = useCallback(async (): Promise<LikeResult> => {
    if (!articleId) {
      return { success: false, message: 'Article ID is required' };
    }

    setLikeState(prev => ({ ...prev, isLoading: true, error: null }));

    // Optimistic update
    const wasLiked = likeState.isLiked;
    setLikeState(prev => ({
      ...prev,
      isLiked: !prev.isLiked,
      likeCount: prev.isLiked 
        ? Math.max(0, prev.likeCount - 1)
        : prev.likeCount + 1,
    }));

    try {
      const response = await likesAPI.toggleLike(articleId);
      
      if (response.data.success) {
        const action = response.data.data.action;
        log.debug(`Successfully ${action} article`, {
          articleId,
          action,
          message: response.data.message,
        }, 'useLikes');

        // Update with actual like count from server
        setLikeState(prev => ({
          ...prev,
          likeCount: response.data.data.likeCount || prev.likeCount,
        }));

        return {
          success: true,
          message: response.data.message,
          action,
        };
      } else {
        throw new Error(response.data.message || 'Failed to toggle like status');
      }
    } catch (error) {
      log.error('Failed to toggle like status', error, 'useLikes');
      
      let errorMessage = 'Failed to toggle like status';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status: number; data?: { message: string } } };
        if (axiosError.response?.status === 401) {
          errorMessage = 'Please log in to like articles';
        } else if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        }
      }
      
      // Revert optimistic update
      setLikeState(prev => ({
        ...prev,
        isLiked: wasLiked,
        likeCount: wasLiked
          ? prev.likeCount + 1
          : Math.max(0, prev.likeCount - 1),
        error: errorMessage,
      }));

      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setLikeState(prev => ({ ...prev, isLoading: false }));
    }
  }, [articleId, likeState.isLiked]);

  /**
   * Refresh like status from server
   */
  const refreshLikeStatus = useCallback(async () => {
    if (!articleId) return;

    setLikeState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await likesAPI.getLikeStatus(articleId);
      
      if (response.data.success) {
        const { isLiked, likeCount } = response.data.data;
        
        setLikeState(prev => ({
          ...prev,
          isLiked,
          likeCount,
        }));
      }
    } catch (error) {
      log.error('Failed to refresh like status', error, 'useLikes');
      setLikeState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to refresh like status',
      }));
    } finally {
      setLikeState(prev => ({ ...prev, isLoading: false }));
    }
  }, [articleId]);

  return {
    // State
    isLiked: likeState.isLiked,
    likeCount: likeState.likeCount,
    isLoading: likeState.isLoading,
    error: likeState.error,

    // Actions
    like: likeArticle,
    unlike: unlikeArticle,
    toggleLike,
    refreshLikeStatus,
    clearError,

    // Computed properties
    hasError: !!likeState.error,
    canLike: !likeState.isLoading,
  };
};