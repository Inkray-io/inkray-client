import { useState, useCallback, useEffect } from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { getSealClient } from '@/lib/seal-client';
import { eventsAPI, articlesAPI } from '@/lib/api';
import { loadArticleContent } from '@/lib/article-utils';
import { 
  decryptArticleContentAsString, 
  decryptMediaFiles, 
  validateDecryptionRequirements,
  getDecryptionStatus 
} from '@/lib/seal-decryption';
import { hexToContentId } from '@/lib/seal-identity';

export interface ArticleMetadata {
  id: string;
  title: string;
  slug: string;
  author: string;
  publicationId: string;
  quiltBlobId: string;
  contentId: string;
  isEncrypted: boolean;
  createdAt: string;
  transactionDigest: string;
}

export interface DecryptionState {
  isLoading: boolean;
  isDownloading: boolean;
  isDecrypting: boolean;
  content: string | null;
  metadata: ArticleMetadata | null;
  error: string | null;
}

/**
 * Hook for article decryption and reading
 * Uses Seal IBE with free access policy for all encrypted content
 */
export const useArticleDecryption = (articleSlug: string | null) => {
  const [state, setState] = useState<DecryptionState>({
    isLoading: false,
    isDownloading: false,
    isDecrypting: false,
    content: null,
    metadata: null,
    error: null,
  });

  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();

  /**
   * Fetch article metadata from backend indexer
   */
  const fetchArticleMetadata = useCallback(
    async (slug: string): Promise<ArticleMetadata> => {
      try {
        console.log('Fetching article metadata for slug:', slug);

        // Fetch from backend API using centralized API client
        const response = await eventsAPI.getArticleCreatedEvents({
          slug: slug,
          limit: 1
        });

        const result = response.data;
        const articles = result.data || [];

        if (articles.length > 0) {
          const article = articles[0];

          // Get quilt blob ID from backend data
          const quiltBlobId = article.quiltId || article.blobId; // Support both new and legacy fields
          const contentId = article.contentId;

          return {
            id: article.id,
            title: article.title,
            slug: article.slug,
            author: article.author,
            publicationId: article.publicationId,
            quiltBlobId: quiltBlobId,
            contentId: contentId,
            isEncrypted: article.isEncrypted,
            createdAt: article.createdAt,
            transactionDigest: article.txDigest,
          };
        }

        // No article found
        throw new Error(`Article not found: Could not find article "${slug}" in backend indexer.`);
      } catch (error) {
        console.error('Failed to fetch article metadata:', error);
        if (error instanceof Error) {
          throw error;
        }
        throw new Error('Failed to fetch article information');
      }
    },
    [currentAccount]
  );

  /**
   * Download and decrypt article content using free access policy
   */
  const downloadAndDecryptArticle = useCallback(
    async (metadata: ArticleMetadata): Promise<string> => {
      setState(prev => ({ ...prev, isDownloading: true }));

      try {
        if (metadata.isEncrypted) {
          // All encrypted content uses free access policy - no complex credentials needed
          console.log('🔓 Loading encrypted article content:', metadata.quiltBlobId);
          console.log('  Content ID:', metadata.contentId);
          console.log('  Article ID:', metadata.id);
          
          // Wallet connection is required for signing the free access transaction
          if (!currentAccount) {
            throw new Error('Wallet connection required to decrypt content (needed for transaction signing)');
          }

          setState(prev => ({ ...prev, isDecrypting: true }));

          // Initialize Seal client with current account
          getSealClient(suiClient, currentAccount);

          // Validate decryption requirements
          const contentId = hexToContentId(metadata.contentId);
          validateDecryptionRequirements(contentId, metadata.id);

          // Call backend to get raw encrypted bytes (JWT token added automatically by interceptor)
          const response = await articlesAPI.getRawContent(metadata.quiltBlobId);
          const encryptedData = new Uint8Array(response.data);
          
          console.log(`  Downloaded ${encryptedData.length} bytes of encrypted content`);

          // Decrypt using free access policy - all content is accessible via this method
          const decryptedContent = await decryptArticleContentAsString(
            encryptedData,
            contentId,
            metadata.id // Article ID for free access validation
          );

          console.log('✅ Content decrypted successfully with Seal free access');
          return decryptedContent;
          
        } else {
          // For non-encrypted articles (legacy), use the backend API
          console.log('Loading free article content via backend API:', metadata.quiltBlobId);

          const articleContent = await loadArticleContent(metadata.quiltBlobId);
          console.log('Free article content loaded');
          
          return articleContent.markdown;
        }
      } catch (error) {
        console.error('❌ Download/decryption failed:', error);
        
        // Provide user-friendly error messages
        if (error instanceof Error) {
          if (error.message.includes('Wallet connection required')) {
            throw error; // Pass through wallet connection errors
          }
          if (error.message.includes('key server')) {
            throw new Error('Decryption service temporarily unavailable. Please try again later.');
          }
          if (error.message.includes('threshold')) {
            throw new Error('Decryption service unavailable. Insufficient key servers online.');
          }
          if (error.message.includes('session')) {
            throw new Error('Authentication failed. Please reconnect your wallet and try again.');
          }
          if (error.message.includes('approve_free')) {
            throw new Error('Content access denied. This article may not support free access.');
          }
        }
        
        throw new Error('Failed to load article content. Please try again later.');
      } finally {
        setState(prev => ({
          ...prev,
          isDownloading: false,
          isDecrypting: false
        }));
      }
    },
    [currentAccount, suiClient]
  );

  /**
   * Check if decryption is available and ready
   */
  const checkDecryptionAvailability = useCallback(async (): Promise<{
    isAvailable: boolean;
    error?: string;
    status: ReturnType<typeof getDecryptionStatus>;
  }> => {
    try {
      const status = getDecryptionStatus();
      return {
        isAvailable: status.isAvailable,
        error: status.error,
        status,
      };
    } catch (error) {
      return {
        isAvailable: false,
        error: error instanceof Error ? error.message : 'Unknown decryption error',
        status: {
          isAvailable: false,
          network: 'unknown',
          packageId: '',
          hasAccount: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }, []);

  /**
   * Load article by slug
   */
  const loadArticle = useCallback(
    async (slug: string) => {
      setState(prev => ({
        ...prev,
        isLoading: true,
        content: null,
        metadata: null,
        error: null
      }));

      try {
        // 1. Fetch metadata
        const metadata = await fetchArticleMetadata(slug);
        setState(prev => ({ ...prev, metadata }));

        // 2. Download and decrypt content
        const content = await downloadAndDecryptArticle(metadata);
        setState(prev => ({ ...prev, content }));

        console.log('Article loaded successfully:', { title: metadata.title, contentLength: content.length });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load article';
        console.error('Article loading failed:', error);
        setState(prev => ({ ...prev, error: errorMessage }));
      } finally {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    },
    [fetchArticleMetadata, downloadAndDecryptArticle]
  );

  /**
   * Load article when slug changes
   */
  useEffect(() => {
    if (articleSlug) {
      loadArticle(articleSlug);
    } else {
      setState({
        isLoading: false,
        isDownloading: false,
        isDecrypting: false,
        content: null,
        metadata: null,
        error: null,
      });
    }
  }, [articleSlug, loadArticle]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  /**
   * Retry loading
   */
  const retry = useCallback(() => {
    if (articleSlug) {
      loadArticle(articleSlug);
    }
  }, [articleSlug, loadArticle]);

  return {
    // State
    ...state,
    isProcessing: state.isLoading || state.isDownloading || state.isDecrypting,

    // Actions
    loadArticle,
    checkDecryptionAvailability,
    clearError,
    retry,
  };
};