import { useState, useCallback } from 'react';
import { articlesAPI } from '@/lib/api';

export interface ArticleContentState {
  content: string | null;
  mediaFiles: Array<{
    identifier: string;
    filename: string;
    tags: Record<string, string>;
  }>;
  isLoading: boolean;
  error: string | null;
}

export interface ArticleContentResponse {
  content: string;
  mediaFiles: Array<{
    identifier: string;
    filename: string;
    tags: Record<string, string>;
  }>;
}

/**
 * Hook for retrieving article content from Walrus quilt
 */
export const useArticleContent = () => {
  const [state, setState] = useState<ArticleContentState>({
    content: null,
    mediaFiles: [],
    isLoading: false,
    error: null,
  });

  /**
   * Fetch article content by quilt blob ID
   */
  const fetchContent = useCallback(async (quiltBlobId: string): Promise<ArticleContentResponse> => {
    if (!quiltBlobId) {
      throw new Error('Quilt blob ID is required');
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      console.log('Fetching article content for quilt:', quiltBlobId);
      
      const response = await articlesAPI.getContent(quiltBlobId);
      const result: ArticleContentResponse = response.data;

      setState(prev => ({
        ...prev,
        content: result.content,
        mediaFiles: result.mediaFiles || [],
        isLoading: false,
      }));

      console.log('Article content fetched successfully:', {
        contentLength: result.content?.length,
        mediaFilesCount: result.mediaFiles?.length,
      });

      return result;

    } catch (error) {
      console.error('Failed to fetch article content:', error);
      
      let errorMessage = 'Failed to fetch article content';
      
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = 'Article content not found';
        } else if (error.response.status === 401) {
          errorMessage = 'Authentication required to view this content';
        } else if (error.response.status === 403) {
          errorMessage = 'You do not have permission to view this content';
        } else {
          errorMessage = error.response.data?.message || 'Failed to fetch content';
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));

      throw new Error(errorMessage);
    }
  }, []);

  /**
   * Fetch raw article content (for encrypted articles)
   */
  const fetchRawContent = useCallback(async (quiltBlobId: string): Promise<Uint8Array> => {
    if (!quiltBlobId) {
      throw new Error('Quilt blob ID is required');
    }

    try {
      console.log('Fetching raw article content for quilt:', quiltBlobId);
      
      const response = await articlesAPI.getRawContent(quiltBlobId);
      const rawContent = new Uint8Array(response.data);

      console.log('Raw article content fetched successfully:', {
        size: rawContent.length,
      });

      return rawContent;

    } catch (error) {
      console.error('Failed to fetch raw article content:', error);
      
      let errorMessage = 'Failed to fetch raw article content';
      
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = 'Article content not found';
        } else if (error.response.status === 401) {
          errorMessage = 'Authentication required to view this content';
        } else if (error.response.status === 403) {
          errorMessage = 'You do not have permission to view this content';
        } else {
          errorMessage = error.response.data?.message || 'Failed to fetch raw content';
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
    }
  }, []);

  /**
   * Clear content and reset state
   */
  const clearContent = useCallback(() => {
    setState({
      content: null,
      mediaFiles: [],
      isLoading: false,
      error: null,
    });
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  /**
   * Get media file by identifier
   */
  const getMediaFile = useCallback((identifier: string) => {
    return state.mediaFiles.find(file => file.identifier === identifier) || null;
  }, [state.mediaFiles]);

  /**
   * Check if content is available
   */
  const hasContent = useCallback(() => {
    return !!state.content;
  }, [state.content]);

  return {
    // State
    ...state,

    // Actions
    fetchContent,
    fetchRawContent,
    clearContent,
    clearError,
    getMediaFile,
    hasContent,
  };
};

export default useArticleContent;