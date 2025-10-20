import { useState, useEffect, useCallback } from 'react';
import { useArticleCreation } from '@/hooks/useArticleCreation';
import { log } from '@/lib/utils/Logger';
import { useAuth } from '@/contexts/AuthContext';

interface UserPublicationInfo {
  publicationId: string;
  vaultId: string;
  ownerCapId: string;
  name: string;
  packageId: string;
  timestamp: number;
}

interface UserPublicationsState {
  publication: UserPublicationInfo | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook for managing user's own publication (users can only have one publication)
 * 
 * Uses the existing getUserPublication logic from useArticleCreation hook
 * which queries the blockchain directly for PublicationOwnerCap objects.
 */
export const useUserPublications = () => {
  const { isAuthenticated } = useAuth();
  const { getUserPublication } = useArticleCreation();
  
  const [state, setState] = useState<UserPublicationsState>({
    publication: null,
    isLoading: false,
    error: null,
  });

  /**
   * Load user's publication from blockchain
   */
  const loadPublication = useCallback(async () => {
    if (!isAuthenticated) {
      setState({
        publication: null,
        isLoading: false,
        error: null,
      });
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const publication = await getUserPublication();
      
      setState({
        publication,
        isLoading: false,
        error: null,
      });

      log.debug('User publication loaded successfully', {
        hasPublication: !!publication,
        publicationId: publication?.publicationId,
      }, 'useUserPublications');
    } catch (error) {
      log.error('Failed to load user publication', error, 'useUserPublications');
      
      let errorMessage = 'Failed to load publication';
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      setState({
        publication: null,
        isLoading: false,
        error: errorMessage,
      });
    }
  }, [isAuthenticated, getUserPublication]);

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

  // Load publication when authentication status changes
  useEffect(() => {
    loadPublication();
  }, [loadPublication]);

  return {
    // State
    ...state,

    // Actions
    refresh,
    clearError,

    // Computed properties
    hasError: !!state.error,
    hasPublications: !!state.publication,
    firstPublication: state.publication ? {
      publicationId: state.publication.publicationId,
      ownerCapId: state.publication.ownerCapId,
      name: state.publication.name,
    } : null,
  };
};