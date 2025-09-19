import { useState, useCallback } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { articlesAPI } from '@/lib/api';

export interface ArticleCreationState {
  isProcessing: boolean;
  uploadProgress: number;
  error: string | null;
}

export interface MediaFile {
  content: string; // base64 encoded
  filename: string;
  mimeType: string;
  size?: number;
}

export interface ArticleUploadResult {
  articleId: string;
  quiltBlobId: string;
  quiltObjectId: string;
  slug: string;
  transactionDigest: string;
  totalSize: number;
  fileCount: number;
  storageEndEpoch: number;
}

interface PublicationInfo {
  publicationId: string;
  vaultId: string;
  ownerCapId: string;
  name: string;
}

/**
 * Hook for article creation using backend API
 * Replaces complex Walrus upload logic with simple API calls
 */
export const useArticleCreation = () => {
  const [state, setState] = useState<ArticleCreationState>({
    isProcessing: false,
    uploadProgress: 0,
    error: null,
  });

  const currentAccount = useCurrentAccount();

  /**
   * Get user's publication info from localStorage
   */
  const getUserPublication = useCallback(async (): Promise<PublicationInfo | null> => {
    // Try localStorage first
    const stored = localStorage.getItem('inkray-user-publication');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.error('Failed to parse stored publication:', error);
      }
    }
    return null;
  }, []);

  /**
   * Create and publish an article using backend API
   */
  const createAndPublishArticle = useCallback(
    async (
      title: string,
      content: string,
      mediaFiles: MediaFile[] = [],
      isGated: boolean = false
    ): Promise<ArticleUploadResult> => {
      if (!currentAccount) {
        throw new Error('Wallet not connected');
      }

      setState(prev => ({ ...prev, error: null, isProcessing: true, uploadProgress: 0 }));

      try {
        // 1. Get user's publication
        const publication = await getUserPublication();
        if (!publication) {
          throw new Error('No publication found. Please create a publication first.');
        }

        console.log('Creating article via backend API:', {
          title,
          contentLength: content.length,
          mediaFilesCount: mediaFiles.length,
          publication: publication.name,
          isGated,
        });

        // 2. Prepare request data - ensure mediaFiles is always an array
        const requestData = {
          title,
          content,
          publicationId: publication.publicationId,
          authorAddress: currentAccount.address,
          isGated,
          mediaFiles: Array.isArray(mediaFiles) ? mediaFiles : [],
          storageEpochs: 5,
        };

        setState(prev => ({ ...prev, uploadProgress: 25 }));

        setState(prev => ({ ...prev, uploadProgress: 50 }));

        // 3. Call backend API (token is automatically added by api interceptor)
        console.log('Calling backend API...');
        const response = await articlesAPI.create(requestData);

        setState(prev => ({ ...prev, uploadProgress: 90 }));

        if (!response.data) {
          throw new Error('No response data from server');
        }

        const result: ArticleUploadResult = response.data;

        console.log('Article created successfully:', result);

        setState(prev => ({ ...prev, uploadProgress: 100 }));

        return result;

      } catch (error) {
        console.error('Article creation failed:', error);
        
        let errorMessage = 'Failed to create article';
        
        if (error.response) {
          if (error.response?.status === 401) {
            errorMessage = 'Authentication expired. Please log in again.';
          } else if (error.response?.status === 400) {
            errorMessage = error.response.data?.message || 'Invalid article data';
          } else if (error.response?.status === 500) {
            errorMessage = 'Server error. Please try again later.';
          } else if (error.code === 'ECONNABORTED') {
            errorMessage = 'Upload timeout. Please try again with smaller files.';
          } else {
            errorMessage = error.response?.data?.message || error.message || errorMessage;
          }
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }

        setState(prev => ({ ...prev, error: errorMessage }));
        throw new Error(errorMessage);

      } finally {
        setState(prev => ({
          ...prev,
          isProcessing: false,
        }));
      }
    },
    [currentAccount, getUserPublication]
  );

  /**
   * Convert File objects to MediaFile format for API
   */
  const convertFilesToMediaFiles = useCallback(async (files: File[]): Promise<MediaFile[]> => {
    const mediaFiles: MediaFile[] = [];

    for (const file of files) {
      try {
        // Convert file to base64
        const buffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(buffer);
        const base64 = btoa(String.fromCharCode(...uint8Array));

        mediaFiles.push({
          content: base64,
          filename: file.name,
          mimeType: file.type,
          size: file.size,
        });
      } catch (error) {
        console.error(`Failed to process file ${file.name}:`, error);
        throw new Error(`Failed to process file: ${file.name}`);
      }
    }

    return mediaFiles;
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  /**
   * Reset all state
   */
  const reset = useCallback(() => {
    setState({
      isProcessing: false,
      uploadProgress: 0,
      error: null,
    });
  }, []);

  return {
    // State
    ...state,

    // Actions
    createAndPublishArticle,
    convertFilesToMediaFiles,
    getUserPublication,
    clearError,
    reset,
  };
};