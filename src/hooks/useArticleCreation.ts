import { useState, useCallback } from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { api } from '@/lib/api-client';
import { validateArticleCreation } from '@/lib/validation';
import { createSealService, type EncryptionStatus } from '@/lib/services/SealService';
import { getCachedPublication, setCachedPublication, type CachedPublicationData } from '@/lib/cache-manager';
import { CONFIG as INKRAY_CONFIG } from '@/lib/config';
import { toBase64 } from '@mysten/bcs';
import { log } from '@/lib/utils/Logger';
import { parseCreationError } from '@/lib/utils/errorHandling';
import { ArticleCreationState, MediaFile, ArticleUploadResult, TemporaryImage } from '@/types/article';
import { ApiError } from '@/types/api';

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
 *       summary,
 *       categoryId,
 *       mediaFiles, 
 *       gated
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
   * Get user's publication info with automatic cache validation and blockchain fallback
   */
  const getUserPublication = useCallback(async (): Promise<PublicationInfo | null> => {
    // First check cache for fast response
    const cachedPublication = getCachedPublication();
    if (cachedPublication) {
      log.info('Found cached publication', { publicationId: cachedPublication.publicationId });
      return cachedPublication;
    }

    // If no cache and no wallet connection, return null
    if (!currentAccount || !suiClient) {
      log.info('No wallet connection, cannot fetch publications from blockchain');
      return null;
    }

    try {
      log.info('No cached publication found, querying blockchain...', {
        address: currentAccount.address
      });

      // Query for PublicationOwnerCap objects owned by the current account
      const ownedObjects = await suiClient.getOwnedObjects({
        owner: currentAccount.address,
        filter: {
          StructType: `${INKRAY_CONFIG.PACKAGE_ID}::publication::PublicationOwnerCap`,
        },
        options: {
          showContent: true,
        },
      });

      log.info('Blockchain query completed', {
        foundObjects: ownedObjects.data.length
      });

      if (ownedObjects.data.length === 0) {
        log.info('No publications found on blockchain');
        return null;
      }

      // Get the first publication (user should typically have one)
      const firstOwnerCap = ownedObjects.data[0];
      if (!firstOwnerCap.data?.content || !('fields' in firstOwnerCap.data.content)) {
        log.error('Invalid owner cap data structure');
        return null;
      }

      const fields = firstOwnerCap.data.content.fields as Record<string, unknown>;
      const publicationId = fields.publication_id as string;
      const ownerCapId = firstOwnerCap.data.objectId;

      // Get publication details
      const publicationObject = await suiClient.getObject({
        id: publicationId,
        options: { showContent: true },
      });

      if (!publicationObject.data?.content || !('fields' in publicationObject.data.content)) {
        log.error('Invalid publication data structure');
        return null;
      }

      const publicationFields = publicationObject.data.content.fields as Record<string, unknown>;
      const publicationName = publicationFields.name as string;
      const vaultId = publicationFields.vault_id as string;

      // Create publication info object
      const publicationInfo: CachedPublicationData = {
        publicationId,
        vaultId,
        ownerCapId,
        name: publicationName,
        packageId: INKRAY_CONFIG.PACKAGE_ID,
        timestamp: Date.now(),
      };

      // Cache the result for future use
      setCachedPublication(publicationInfo);

      log.info('Successfully fetched and cached publication from blockchain', {
        publicationId,
        name: publicationName
      });

      return publicationInfo;

    } catch (error) {
      log.error('Failed to fetch publication from blockchain', { error });
      return null;
    }
  }, [currentAccount, suiClient]);

  /**
   * Convert temporary images to MediaFile format for upload
   * @param tempImages - Array of temporary images from editor
   * @returns Promise resolving to MediaFile array
   */
  const convertTempImagesToMediaFiles = useCallback(
    async (tempImages: TemporaryImage[]): Promise<MediaFile[]> => {
      log.info('Converting temporary images to MediaFile format', {
        count: tempImages.length
      });

      const mediaFiles: MediaFile[] = await Promise.all(
        tempImages.map(async (tempImg) => {
          // Use FileReader API for reliable base64 conversion (handles large files)
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              resolve(result.split(',')[1]); // Remove "data:image/...;base64," prefix
            };
            reader.readAsDataURL(tempImg.file);
          });

          return {
            content: base64,
            filename: tempImg.filename,
            mimeType: tempImg.mimeType,
            size: tempImg.size,
          };
        })
      );

      log.info('Temporary images converted successfully', {
        originalCount: tempImages.length,
        convertedCount: mediaFiles.length
      });

      return mediaFiles;
    },
    []
  );

  /**
   * Create and publish an article using backend API
   * @param tempImages - Optional temporary images from editor (will be converted to MediaFiles)
   */
  const createAndPublishArticle = useCallback(
    async (
      title: string,
      content: string,
      summary: string,
      categoryId: string,
      mediaFiles: MediaFile[] = [],
      gated: boolean = false,
      tempImages: TemporaryImage[] = []
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
        // Convert temporary images to MediaFiles and merge with existing mediaFiles
        let allMediaFiles = [...mediaFiles];
        if (tempImages.length > 0) {
          log.info('Converting temporary images for upload', {
            tempImageCount: tempImages.length,
            existingMediaFiles: mediaFiles.length
          });

          const convertedTempImages = await convertTempImagesToMediaFiles(tempImages);
          allMediaFiles = [...allMediaFiles, ...convertedTempImages];

          log.info('Media files merged successfully', {
            totalMediaFiles: allMediaFiles.length
          });
        }
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
          mediaFiles: [], // Keep empty for validation, actual files processed separately
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

        // 5. Skip media file encryption - media files are stored unencrypted for direct serving
        // Only article content is encrypted with Seal, media files remain as plain binary data
        log.info('Skipping media file encryption - storing as unencrypted for direct serving', {
          mediaFileCount: allMediaFiles.length
        });

        setState(prev => ({ ...prev, encryptionProgress: 90, isEncrypting: false }));
        // 6. Prepare request data with encrypted content
        // Convert encrypted content to base64 for API transmission using Mysten's BCS utilities
        const encryptedContentBase64 = toBase64(encryptedContent.encryptedData);

        const requestData = {
          title,
          summary,
          categoryId,
          content: encryptedContentBase64, // Base64-encoded encrypted content
          contentId: encryptedContent.contentIdHex, // Send content ID for backend storage
          publicationId: publication.publicationId,
          authorAddress: currentAccount.address,
          gated,
          mediaFiles: allMediaFiles.map(file => ({
            content: file.content, // Base64 encoded unencrypted content
            filename: file.filename,
            mimeType: file.mimeType,
            size: file.size,
            // No contentId for unencrypted media files
          })),
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

        // 3. Call backend API with new type-safe client
        const result: ArticleUploadResult = await api.articles.create(requestData);

        setState(prev => ({ ...prev, uploadProgress: 90 }));
        setState(prev => ({ ...prev, uploadProgress: 100 }));

        return result;
      } catch (error) {
        let errorMessage: string;

        if (error instanceof ApiError) {
          // Use the user-friendly message from ApiError
          errorMessage = error.getUserMessage();
        } else {
          // Fallback to existing error parsing
          errorMessage = parseCreationError(error);
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
    [currentAccount, suiClient, getUserPublication, convertTempImagesToMediaFiles]
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
    convertTempImagesToMediaFiles, // New helper for temporary images
    getUserPublication,
    checkEncryptionAvailability,
    clearError,
    reset,
  };
};