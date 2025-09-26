import { useState, useCallback } from 'react';
import { followsAPI } from '@/lib/api';
import { log } from '@/lib/utils/Logger';

interface FollowState {
  isFollowing: boolean;
  followerCount: number;
  isLoading: boolean;
  error: string | null;
}

interface FollowResult {
  success: boolean;
  message: string;
  action?: 'followed' | 'unfollowed';
}

/**
 * Hook for managing publication follow operations
 * 
 * Provides functionality to:
 * - Follow/unfollow publications
 * - Get follow status
 * - Handle loading states and errors
 * - Optimistic UI updates
 * 
 * @param publicationId - The publication ID to manage follows for
 * @param initialFollowInfo - Initial follow state from article data
 */
export const useFollows = (
  publicationId: string,
  initialFollowInfo?: {
    isFollowing: boolean;
    followerCount: number;
  }
) => {
  const [followState, setFollowState] = useState<FollowState>({
    isFollowing: initialFollowInfo?.isFollowing ?? false,
    followerCount: initialFollowInfo?.followerCount ?? 0,
    isLoading: false,
    error: null,
  });

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setFollowState(prev => ({ ...prev, error: null }));
  }, []);

  /**
   * Follow a publication
   */
  const followPublication = useCallback(async (): Promise<FollowResult> => {
    if (!publicationId) {
      return { success: false, message: 'Publication ID is required' };
    }

    setFollowState(prev => ({ ...prev, isLoading: true, error: null }));

    // Optimistic update
    setFollowState(prev => ({
      ...prev,
      isFollowing: true,
      followerCount: prev.followerCount + 1,
    }));

    try {
      const response = await followsAPI.followPublication(publicationId);
      
      if (response.data.success) {
        log.debug('Successfully followed publication', {
          publicationId,
          message: response.data.data.message,
        }, 'useFollows');

        return {
          success: true,
          message: response.data.data.message,
          action: 'followed',
        };
      } else {
        throw new Error(response.data.message || 'Failed to follow publication');
      }
    } catch (error) {
      log.error('Failed to follow publication', error, 'useFollows');
      
      // Revert optimistic update
      setFollowState(prev => ({
        ...prev,
        isFollowing: false,
        followerCount: Math.max(0, prev.followerCount - 1),
        error: error instanceof Error ? error.message : 'Failed to follow publication',
      }));

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to follow publication',
      };
    } finally {
      setFollowState(prev => ({ ...prev, isLoading: false }));
    }
  }, [publicationId]);

  /**
   * Unfollow a publication
   */
  const unfollowPublication = useCallback(async (): Promise<FollowResult> => {
    if (!publicationId) {
      return { success: false, message: 'Publication ID is required' };
    }

    setFollowState(prev => ({ ...prev, isLoading: true, error: null }));

    // Optimistic update
    setFollowState(prev => ({
      ...prev,
      isFollowing: false,
      followerCount: Math.max(0, prev.followerCount - 1),
    }));

    try {
      const response = await followsAPI.unfollowPublication(publicationId);
      
      if (response.data.success) {
        log.debug('Successfully unfollowed publication', {
          publicationId,
          message: response.data.data.message,
        }, 'useFollows');

        return {
          success: true,
          message: response.data.data.message,
          action: 'unfollowed',
        };
      } else {
        throw new Error(response.data.message || 'Failed to unfollow publication');
      }
    } catch (error) {
      log.error('Failed to unfollow publication', error, 'useFollows');
      
      // Revert optimistic update
      setFollowState(prev => ({
        ...prev,
        isFollowing: true,
        followerCount: prev.followerCount + 1,
        error: error instanceof Error ? error.message : 'Failed to unfollow publication',
      }));

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to unfollow publication',
      };
    } finally {
      setFollowState(prev => ({ ...prev, isLoading: false }));
    }
  }, [publicationId]);

  /**
   * Toggle follow status (follow if not following, unfollow if following)
   */
  const toggleFollow = useCallback(async (): Promise<FollowResult> => {
    if (!publicationId) {
      return { success: false, message: 'Publication ID is required' };
    }

    setFollowState(prev => ({ ...prev, isLoading: true, error: null }));

    // Optimistic update
    const wasFollowing = followState.isFollowing;
    setFollowState(prev => ({
      ...prev,
      isFollowing: !prev.isFollowing,
      followerCount: prev.isFollowing 
        ? Math.max(0, prev.followerCount - 1)
        : prev.followerCount + 1,
    }));

    try {
      const response = await followsAPI.toggleFollow(publicationId);
      
      if (response.data.success) {
        const action = response.data.data.action;
        log.debug(`Successfully ${action} publication`, {
          publicationId,
          action,
          message: response.data.data.message,
        }, 'useFollows');

        return {
          success: true,
          message: response.data.data.message,
          action,
        };
      } else {
        throw new Error(response.data.message || 'Failed to toggle follow status');
      }
    } catch (error) {
      log.error('Failed to toggle follow status', error, 'useFollows');
      
      let errorMessage = 'Failed to toggle follow status';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status: number; data?: { message: string } } };
        if (axiosError.response?.status === 401) {
          errorMessage = 'Please log in to follow publications';
        } else if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        }
      }
      
      // Revert optimistic update
      setFollowState(prev => ({
        ...prev,
        isFollowing: wasFollowing,
        followerCount: wasFollowing
          ? prev.followerCount + 1
          : Math.max(0, prev.followerCount - 1),
        error: errorMessage,
      }));

      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setFollowState(prev => ({ ...prev, isLoading: false }));
    }
  }, [publicationId, followState.isFollowing]);

  /**
   * Refresh follow status from server
   */
  const refreshFollowStatus = useCallback(async () => {
    if (!publicationId) return;

    setFollowState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await followsAPI.getFollowStatus(publicationId);
      
      if (response.data.success) {
        const { isFollowing } = response.data.data;
        
        // Also get follower count
        const countResponse = await followsAPI.getFollowerCount(publicationId);
        const followerCount = countResponse.data.success ? countResponse.data.data.followerCount : 0;
        
        setFollowState(prev => ({
          ...prev,
          isFollowing,
          followerCount,
        }));
      }
    } catch (error) {
      log.error('Failed to refresh follow status', error, 'useFollows');
      setFollowState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to refresh follow status',
      }));
    } finally {
      setFollowState(prev => ({ ...prev, isLoading: false }));
    }
  }, [publicationId]);

  return {
    // State
    isFollowing: followState.isFollowing,
    followerCount: followState.followerCount,
    isLoading: followState.isLoading,
    error: followState.error,

    // Actions
    follow: followPublication,
    unfollow: unfollowPublication,
    toggleFollow,
    refreshFollowStatus,
    clearError,

    // Computed properties
    hasError: !!followState.error,
    canFollow: !followState.isLoading,
  };
};