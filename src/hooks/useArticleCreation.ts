import { useState, useCallback } from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { articlesAPI } from '@/lib/api';
import { validateArticleCreation } from '@/lib/validation';
import { createSealService, type EncryptedMediaFile, type EncryptionStatus } from '@/lib/services/SealService';
import { getCachedPublication, type CachedPublicationData } from '@/lib/cache-manager';
import { toBase64 } from '@mysten/bcs';
import { log } from '@/lib/utils/Logger';
import { parseCreationError } from '@/lib/utils/errorHandling';
import { ArticleCreationState, MediaFile, ArticleUploadResult } from '@/types/article';

// Use CachedPublicationData from cache manager for consistency
type PublicationInfo = CachedPublicationData;

/**
 * Comprehensive article creation and publishing hook with Seal encryption
 * 
 * This hook provides complete article publishing functionality including:
 * - Article content validation and preparation
 * - Seal Identity-Based Encryption (IBE) for content security
 * - Media file encryption and processing
 * - Backend API integration for publishing
 * - Progress tracking for encryption and upload phases
 * - Error handling with user-friendly messages
 * 
 * **CRITICAL**: This hook preserves all Seal and Walrus data processing logic.
 * The encryption flows, BCS encoding, and data structures must remain unchanged
 * to prevent data corruption or compatibility issues with existing content.
 * 
 * @returns Article creation state and management functions
 * 
 * @example
 * ```tsx
 * const { 
 *   isProcessing, 
 *   uploadProgress, 
 *   encryptionProgress,
 *   error,
 *   createAndPublishArticle,
 *   convertFilesToMediaFiles,
 *   checkEncryptionAvailability
 * } = useArticleCreation();
 * 
 * // Create article with encryption
 * const handlePublish = async () => {
 *   try {
 *     const mediaFiles = await convertFilesToMediaFiles(selectedFiles);
 *     const result = await createAndPublishArticle(
 *       title, 
 *       content, 
 *       mediaFiles, 
 *       isGated
 *     );
 *     console.log('Article published:', result.slug);
 *   } catch (error) {
 *     console.error('Publishing failed:', error.message);
 *   }
 * };
 * ```
 */
export const useArticleCreation = () => {
  const [state, setState] = useState<ArticleCreationState>({
    isProcessing: false,
    uploadProgress: 0,
    encryptionProgress: 0,
    error: null,
    isEncrypting: false,
  });

  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();

  /**
   * Get user's publication info with automatic cache validation
   */
  const getUserPublication = useCallback(async (): Promise<PublicationInfo | null> => {
    // Use cache manager with automatic package ID validation
    const cachedPublication = getCachedPublication();
    
    if (cachedPublication) {
      return cachedPublication;
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

      setState(prev => ({ 
        ...prev, 
        error: null, 
        isProcessing: true, 
        uploadProgress: 0,
        encryptionProgress: 0,
        isEncrypting: false 
      }));

      try {
        // 1. Get user's publication
        const publication = await getUserPublication();
        if (!publication) {
          throw new Error('No publication found. Please create a publication first.');
        }

        // 2. Validate input data BEFORE encryption (validate plain text)
        const validation = validateArticleCreation({
          title,
          content, // Validate the original markdown content
          publicationId: publication.publicationId,
          authorAddress: currentAccount.address,
          mediaFiles: [], // Files converted to base64, validation happens before conversion
        });
        
        if (!validation.isValid) {
          throw new Error(`Content validation failed: ${validation.errors.join(', ')}`);
        }

        // 3. Initialize SealService and check encryption requirements
        if (!currentAccount || !suiClient) {
          throw new Error('Wallet connection required for encryption');
        }

        const sealService = createSealService(suiClient, currentAccount);
        const encryptionStatus = sealService.getEncryptionStatus();
        
        if (!encryptionStatus.isAvailable) {
          throw new Error(`Seal encryption not available: ${encryptionStatus.error || 'Unknown error'}`);
        }

        // Validate encryption requirements
        sealService.validateEncryptionRequirements(publication.publicationId);

        setState(prev => ({ ...prev, isEncrypting: true, encryptionProgress: 10 }));

        // 4. Encrypt article content with Seal IBE
        const encryptedContent = await sealService.encryptArticleContent(
          content,
          publication.publicationId,
          title
        );

        setState(prev => ({ ...prev, encryptionProgress: 50 }));

        // 5. Encrypt media files if present
        let encryptedMediaFiles: EncryptedMediaFile[] = [];
        if (mediaFiles && mediaFiles.length > 0) {
          encryptedMediaFiles = await sealService.encryptMediaFiles(
            mediaFiles,
            publication.publicationId
          );
        }

        setState(prev => ({ ...prev, encryptionProgress: 90, isEncrypting: false }));
        // 6. Prepare request data with encrypted content
        // Convert encrypted content to base64 for API transmission using Mysten's BCS utilities
        const encryptedContentBase64 = toBase64(encryptedContent.encryptedData);

        const requestData = {
          title,
          content: encryptedContentBase64, // Base64-encoded encrypted content
          contentId: encryptedContent.contentIdHex, // Send content ID for backend storage
          publicationId: publication.publicationId,
          authorAddress: currentAccount.address,
          isGated,
          mediaFiles: encryptedMediaFiles.map(file => ({
            content: file.content, // Already base64 encoded encrypted content
            filename: file.filename,
            mimeType: file.mimeType,
            contentId: file.contentIdHex, // Include content ID for each media file
            size: file.size,
          })),
          storageEpochs: 5,
          // Encryption metadata for backend
          isEncrypted: true, // Flag to indicate content is encrypted
          encryptionMetadata: {
            originalContentLength: content.length, // Original markdown length
            encryptedContentLength: encryptedContent.encryptedSize, // Encrypted size
            algorithm: 'seal-ibe', // Encryption method
            contentType: 'markdown', // Original content type
            validationPassed: true, // Frontend validation completed
          },
        };
        setState(prev => ({ ...prev, uploadProgress: 25 }));

        setState(prev => ({ ...prev, uploadProgress: 50 }));

        // 3. Call backend API (token is automatically added by api interceptor)
        const response = await articlesAPI.create(requestData);

        setState(prev => ({ ...prev, uploadProgress: 90 }));

        if (!response.data || !response.data.data) {
          throw new Error('No response data from server');
        }

        const result: ArticleUploadResult = response.data.data;
        setState(prev => ({ ...prev, uploadProgress: 100 }));

        return result;
      } catch (error) {
        const errorMessage = parseCreationError(error);
        setState(prev => ({ ...prev, error: errorMessage }));
        throw new Error(errorMessage);
      } finally {
        setState(prev => ({
          ...prev,
          isProcessing: false,
        }));
      }
    },
    [currentAccount, suiClient, getUserPublication]
  );

  /**
   * Convert File objects to MediaFile format for API
   */
  const convertFilesToMediaFiles = useCallback(async (files: File[]): Promise<MediaFile[]> => {
    const mediaFiles: MediaFile[] = [];

    for (const file of files) {
      try {
        // Convert file to base64 using Mysten's BCS utilities
        const buffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(buffer);
        const base64 = toBase64(uint8Array);

        mediaFiles.push({
          content: base64,
          filename: file.name,
          mimeType: file.type,
          size: file.size,
        });
      } catch (error) {
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
   * Check if Seal encryption is available and ready
   */
  const checkEncryptionAvailability = useCallback(async (): Promise<{
    isAvailable: boolean;
    error?: string;
    status: EncryptionStatus;
  }> => {
    try {
      if (!currentAccount || !suiClient) {
        throw new Error('Wallet not connected');
      }

      const sealService = createSealService(suiClient, currentAccount);
      const status = sealService.getEncryptionStatus();
      
      return {
        isAvailable: status.isAvailable,
        error: status.error,
        status,
      };
    } catch (error) {
      return {
        isAvailable: false,
        error: error instanceof Error ? error.message : 'Unknown encryption error',
        status: {
          isAvailable: false,
          network: 'unknown',
          packageId: '',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }, [currentAccount, suiClient]);

  /**
   * Reset all state
   */
  const reset = useCallback(() => {
    setState({
      isProcessing: false,
      uploadProgress: 0,
      encryptionProgress: 0,
      error: null,
      isEncrypting: false,
    });
  }, []);

  return {
    // State
    ...state,

    // Actions
    createAndPublishArticle,
    convertFilesToMediaFiles,
    getUserPublication,
    checkEncryptionAvailability,
    clearError,
    reset,
  };
};