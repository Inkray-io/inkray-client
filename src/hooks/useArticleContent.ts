import { useState, useCallback } from 'react';
import { articlesAPI } from '@/lib/api';
import { log } from '@/lib/utils/Logger';
import { parseApiError } from '@/lib/utils/errorHandling';
import { ArticleContentState, ArticleContentResponse } from '@/types/article';

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
      log.debug('Fetching article content for quilt', { quiltBlobId }, 'useArticleContent');
      
      const response = await articlesAPI.getContent(quiltBlobId);
      const result: ArticleContentResponse = response.data;

      setState(prev => ({
        ...prev,
        content: result.content,
        mediaFiles: result.mediaFiles || [],
        isLoading: false,
      }));

      log.debug('Article content fetched successfully', {
        contentLength: result.content?.length,
        mediaFilesCount: result.mediaFiles?.length,
      }, 'useArticleContent');

      return result;

    } catch (error) {
      log.error('Failed to fetch article content', error, 'useArticleContent');
      
      const errorMessage = parseApiError(error, 'Failed to fetch article content');

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
      log.debug('Fetching raw article content for quilt', { quiltBlobId }, 'useArticleContent');
      
      const response = await articlesAPI.getRawContent(quiltBlobId);
      const rawContent = new Uint8Array(response.data);

      log.debug('Raw article content fetched successfully', {
        size: rawContent.length,
      }, 'useArticleContent');

      return rawContent;

    } catch (error) {
      log.error('Failed to fetch raw article content', error, 'useArticleContent');
      
      const errorMessage = parseApiError(error, 'Failed to fetch raw article content');
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