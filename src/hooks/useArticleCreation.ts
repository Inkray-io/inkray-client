import { useState, useCallback } from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { articlesAPI } from '@/lib/api';
import { validateArticleCreation } from '@/lib/validation';
import { encryptArticleContent, encryptMediaFiles, EncryptedMediaFile } from '@/lib/seal-encryption';
import { validateEncryptionRequirements, getEncryptionStatus } from '@/lib/seal-encryption';
import { getSealClient } from '@/lib/seal-client';

export interface ArticleCreationState {
  isProcessing: boolean;
  uploadProgress: number;
  encryptionProgress: number;
  error: string | null;
  isEncrypting: boolean;
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
    encryptionProgress: 0,
    error: null,
    isEncrypting: false,
  });

  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();

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
        console.log('🔍 Validating plain text content before encryption...');
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
        
        console.log('✅ Content validation passed for plain text');

        // 3. Check Seal encryption requirements
        console.log('🔐 Checking Seal encryption status...');
        const encryptionStatus = getEncryptionStatus();
        if (!encryptionStatus.isAvailable) {
          throw new Error(`Seal encryption not available: ${encryptionStatus.error || 'Unknown error'}`);
        }

        // Validate encryption requirements
        validateEncryptionRequirements(publication.publicationId);

        setState(prev => ({ ...prev, isEncrypting: true, encryptionProgress: 10 }));

        // Initialize Seal client with current user context
        if (!currentAccount) {
          throw new Error('Wallet connection required for encryption');
        }
        
        // Initialize the Seal client with the current SuiClient and account
        const sealClient = getSealClient(suiClient, currentAccount);
        console.log('🔧 Seal client initialized:', sealClient.getStatus());

        console.log('🔒 Encrypting article content with Seal...');
        console.log('  Article title:', title);
        console.log('  Content length:', content.length);
        console.log('  Media files count:', mediaFiles.length);
        console.log('  Publication:', publication.name);

        // 4. Encrypt article content with Seal IBE
        const encryptedContent = await encryptArticleContent(
          content,
          publication.publicationId,
          title
        );

        setState(prev => ({ ...prev, encryptionProgress: 50 }));

        // 5. Encrypt media files if present
        let encryptedMediaFiles: EncryptedMediaFile[] = [];
        if (mediaFiles && mediaFiles.length > 0) {
          console.log('🖼️ Encrypting media files with Seal...');
          encryptedMediaFiles = await encryptMediaFiles(
            mediaFiles,
            publication.publicationId
          );
        }

        setState(prev => ({ ...prev, encryptionProgress: 90, isEncrypting: false }));

        console.log('✅ Encryption completed successfully');
        console.log('  Content encrypted size:', encryptedContent.encryptedSize, 'bytes');
        console.log('  Content ID:', encryptedContent.contentIdHex.substring(0, 20) + '...');
        console.log('  Encrypted media files:', encryptedMediaFiles.length);

        // 6. Prepare request data with encrypted content
        // Convert encrypted content to base64 for API transmission
        const encryptedContentBase64 = btoa(
          Array.from(encryptedContent.encryptedData, byte => String.fromCharCode(byte)).join('')
        );
        
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
        
        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as { response?: { status?: number; data?: { message?: string } }; code?: string; message?: string };
          if (axiosError.response?.status === 401) {
            errorMessage = 'Authentication expired. Please log in again.';
          } else if (axiosError.response?.status === 400) {
            errorMessage = axiosError.response.data?.message || 'Invalid article data';
          } else if (axiosError.response?.status === 500) {
            errorMessage = 'Server error. Please try again later.';
          } else if (axiosError.code === 'ECONNABORTED') {
            errorMessage = 'Upload timeout. Please try again with smaller files.';
          } else {
            errorMessage = axiosError.response?.data?.message || axiosError.message || errorMessage;
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
    [currentAccount, suiClient, getUserPublication]
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
   * Check if Seal encryption is available and ready
   */
  const checkEncryptionAvailability = useCallback(async (): Promise<{
    isAvailable: boolean;
    error?: string;
    status: ReturnType<typeof getEncryptionStatus>;
  }> => {
    try {
      const status = getEncryptionStatus();
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
  }, []);

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