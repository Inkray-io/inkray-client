import { useState, useEffect, useCallback } from 'react';
import { publicationsAPI } from '@/lib/api';
import { log } from '@/lib/utils/Logger';
import { Publication, PublicationState } from '@/types/article';
import Cookies from 'js-cookie';

/**
 * Hook for managing publication data
 * 
 * Provides functionality to:
 * - Load publication information
 * - Handle authentication context for follow status
 * - Manage loading states and errors
 * - Refresh publication data
 * 
 * @param publicationId - The publication ID to load
 */
export const usePublication = (publicationId: string) => {
  const [state, setState] = useState<PublicationState>({
    publication: null,
    isLoading: true,
    error: null,
  });

  /**
   * Check if user is authenticated
   */
  const isAuthenticated = useCallback(() => {
    const token = Cookies.get('access_token');
    return !!token;
  }, []);

  /**
   * Load publication information
   */
  const loadPublication = useCallback(async () => {
    if (!publicationId) {
      setState(prev => ({
        ...prev,
        error: 'Publication ID is required',
        isLoading: false,
      }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      let response;

      if (isAuthenticated()) {
        // Use authenticated endpoint for better follow status
        try {
          response = await publicationsAPI.getPublicationAuthenticated(publicationId);
        } catch (authError) {
          // Fallback to public endpoint if auth fails
          log.warn('Authentication failed, falling back to public endpoint', authError, 'usePublication');
          response = await publicationsAPI.getPublication(publicationId);
        }
      } else {
        // Use public endpoint for unauthenticated users
        response = await publicationsAPI.getPublication(publicationId);
      }

      if (response.data.success) {
        const publicationData = response.data.data;
        const publication: Publication = {
          id: publicationData.id,
          name: publicationData.name,
          description: publicationData.description,
          owner: publicationData.owner,
          vaultId: publicationData.vaultId,
          avatar: publicationData.avatar,
          tags: publicationData.tags,
          socialAccounts: publicationData.socialAccounts,
          createdAt: publicationData.createdAt,
          articleCount: publicationData.articleCount,
          followerCount: publicationData.followerCount,
          isFollowing: publicationData.isFollowing,
          followedAt: publicationData.followedAt,
          totalTips: publicationData.totalTips || 0,
          directTips: publicationData.directTips || 0,
          articleTips: publicationData.articleTips || 0,
          subscriptionPrice: publicationData.subscriptionPrice || 0,
          isVerified: publicationData.isVerified || false,
        };

        setState(prev => ({
          ...prev,
          publication,
          isLoading: false,
        }));

        log.debug('Publication loaded successfully', {
          publicationId,
          name: publication.name,
          articleCount: publication.articleCount,
          followerCount: publication.followerCount,
        }, 'usePublication');
      } else {
        throw new Error(response.data.message || 'Failed to load publication');
      }
    } catch (error) {
      log.error('Failed to load publication', error, 'usePublication');
      
      let errorMessage = 'Failed to load publication';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status: number; data?: { message: string } } };
        if (axiosError.response?.status === 404) {
          errorMessage = 'Publication not found';
        } else if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        }
      }

      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));
    }
  }, [publicationId, isAuthenticated]);

  /**
   * Refresh publication data
   */
  const refresh = useCallback(() => {
    loadPublication();
  }, [loadPublication]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  /**
   * Update follow status (for use after follow operations)
   */
  const updateFollowStatus = useCallback((isFollowing: boolean, followerCount?: number) => {
    setState(prev => ({
      ...prev,
      publication: prev.publication ? {
        ...prev.publication,
        isFollowing,
        followerCount: followerCount ?? (isFollowing 
          ? prev.publication.followerCount + 1 
          : Math.max(0, prev.publication.followerCount - 1)),
        followedAt: isFollowing ? new Date().toISOString() : undefined,
      } : null,
    }));
  }, []);

  // Load publication on mount and when publicationId changes
  useEffect(() => {
    loadPublication();
  }, [loadPublication]);

  return {
    // State
    ...state,

    // Actions
    refresh,
    clearError,
    updateFollowStatus,

    // Computed properties
    hasError: !!state.error,
    canRetry: !!state.error && !state.isLoading,
    publicationExists: !!state.publication,
  };
};