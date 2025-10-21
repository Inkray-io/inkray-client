import { useState, useEffect, useCallback, useRef } from 'react';
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

  // Track if we've already loaded publication to prevent unnecessary re-queries
  const hasLoaded = useRef(false);
  
  // Store the last successful publication to prevent refetching the same data
  const lastPublication = useRef<UserPublicationInfo | null>(null);

  /**
   * Load user's publication from blockchain
   */
  const loadPublication = useCallback(async (force = false) => {
    if (!isAuthenticated) {
      setState({
        publication: null,
        isLoading: false,
        error: null,
      });
      hasLoaded.current = false;
      lastPublication.current = null;
      return;
    }

    // Prevent unnecessary re-queries if we've already loaded and it's not forced
    if (hasLoaded.current && !force && lastPublication.current) {
      log.debug('Skipping publication load - already loaded', {
        publicationId: lastPublication.current.publicationId,
      }, 'useUserPublications');
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const publication = await getUserPublication();
      
      // Update refs for stability
      hasLoaded.current = true;
      lastPublication.current = publication;
      
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
      
      hasLoaded.current = true; // Mark as attempted even if failed
      lastPublication.current = null;
    }
  }, [isAuthenticated, getUserPublication]);

  /**
   * Refresh publication data
   */
  const refresh = useCallback(() => {
    loadPublication(true); // Force reload
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