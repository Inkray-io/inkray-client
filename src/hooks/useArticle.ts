import { useState, useCallback, useEffect } from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { articlesAPI } from '@/lib/api';
import { useContentDecryption } from './useContentDecryption';
import { fromBase64 } from '@mysten/bcs';
import { EncryptedObject } from '@mysten/seal';

export interface Article {
  articleId: string;
  slug: string;
  title: string;
  author: string;
  authorShortAddress: string;
  publicationId: string;
  vaultId: string;
  isEncrypted: boolean;
  quiltBlobId: string;
  quiltObjectId: string;
  contentSealId?: string;
  createdAt: string;
  transactionHash: string;
  timeAgo: string;
}

export interface ArticleState {
  article: Article | null;
  content: string | null;
  isLoading: boolean;
  isLoadingContent: boolean;
  error: string | null;
}

/**
 * Simplified hook for loading and displaying articles using direct API calls
 * Independent of feed data - fetches article metadata directly from backend
 */
export const useArticle = (articleSlug: string | null) => {
  const [state, setState] = useState<ArticleState>({
    article: null,
    content: null,
    isLoading: false,
    isLoadingContent: false,
    error: null,
  });

  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const { decryptContent, isDecrypting, decryptionError, clearError: clearDecryptionError } = useContentDecryption();

  /**
   * Load article metadata directly from backend API
   */
  const loadArticleMetadata = useCallback(async (slug: string): Promise<Article> => {

    try {
      const response = await articlesAPI.getBySlug(slug);

      // Handle wrapped API response: { success: true, data: {...} }
      if (!response.data || !response.data.success) {
        throw new Error('API returned unsuccessful response');
      }

      const article = response.data.data;

      if (!article) {
        throw new Error('No article data in API response');
      }


      return article;
    } catch (error) {
      throw new Error(`Article with slug "${slug}" not found`);
    }
  }, []);

  /**
   * Load article content (with decryption for encrypted content)
   */
  const loadArticleContent = useCallback(async (article: Article): Promise<string | null> => {
    if (!suiClient) {
      throw new Error('Sui client not available');
    }


    try {
      setState(prev => ({ ...prev, isLoadingContent: true }));

      if (!article.quiltBlobId) {
        throw new Error('Article has no quilt blob ID');
      }

      // All content is encrypted - check if we have a content seal ID
      if (article.contentSealId) {
        console.log('🔓 Processing encrypted content with Seal ID:', {
          articleId: article.articleId,
          contentSealId: article.contentSealId.substring(0, 20) + '...',
          quiltBlobId: article.quiltBlobId,
          title: article.title
        });

        // Wallet connection is required for signing the decryption transaction
        if (!currentAccount) {
          throw new Error('Wallet connection required to decrypt content');
        }

        // Download encrypted content from backend
        const response = await articlesAPI.getRawContent(article.quiltBlobId);

        // Debug: Log response structure to understand the issue

        // Handle different response formats
        const encryptedData = new Uint8Array(response.data);

        // Validate that the encrypted data is a valid BCS-encoded EncryptedObject
        try {
          const encObj = EncryptedObject.parse(encryptedData);
          console.log('✅ BCS validation successful. Content ID from encrypted object:', encObj.id);

          // Verify that the content ID in the encrypted object matches what we expect
          if (article.contentSealId && encObj.id !== article.contentSealId) {
            console.warn('⚠️ Content ID mismatch:', {
              fromDatabase: article.contentSealId,
              fromEncryptedObject: encObj.id
            });
          }
        } catch (parseError) {
          console.error('❌ BCS validation failed - encrypted data is corrupted or mis-encoded:', parseError);
          throw new Error('Invalid encrypted content: BCS parsing failed. The stored data may be corrupted.');
        }

        // Decrypt using the new decryption hook (pass contentSealId as hex string directly)
        const decryptedContent = await decryptContent({
          encryptedData,
          contentId: article.contentSealId, // Pass as hex string directly from database
          articleId: article.articleId,
        });

        return decryptedContent;

      } else {
        // Fallback: if no content seal ID, try to get parsed content from backend

        const response = await articlesAPI.getContent(article.quiltBlobId);
        const content = response.data.content;

        return content;
      }

    } catch (error) {
      console.log(error)
      // Provide user-friendly error messages
      let errorMessage = 'Failed to load article content';

      if (error instanceof Error) {
        if (error.message.includes('Wallet connection required')) {
          errorMessage = 'Please connect your wallet to view this encrypted content';
        } else if (error.message.includes('key server')) {
          errorMessage = 'Decryption service temporarily unavailable. Please try again later.';
        } else if (error.message.includes('threshold')) {
          errorMessage = 'Decryption service unavailable. Please try again later.';
        } else if (error.message.includes('session')) {
          errorMessage = 'Authentication failed. Please reconnect your wallet and try again.';
        } else if (error.message.includes('approve_free')) {
          errorMessage = 'Content access denied. This article may not support free access.';
        } else {
          errorMessage = error.message;
        }
      }

      throw new Error(errorMessage);
    } finally {
      setState(prev => ({ ...prev, isLoadingContent: false }));
    }
  }, [suiClient, currentAccount, decryptContent]);

  /**
   * Load complete article (metadata + content)
   */
  const loadArticle = useCallback(async (slug: string) => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      article: null,
      content: null,
    }));

    try {
      // 1. Load article metadata from backend
      const article = await loadArticleMetadata(slug);
      setState(prev => ({ ...prev, article }));

      // 2. Load article content
      if (article.quiltBlobId) {
        try {
          const content = await loadArticleContent(article);
          setState(prev => ({ ...prev, content }));
        } catch (contentError) {
          // If content loading fails, still show the article metadata
          setState(prev => ({
            ...prev,
            error: `Failed to load article content: ${contentError instanceof Error ? contentError.message : 'Unknown error'}`
          }));
        }
      } else {
        setState(prev => ({
          ...prev,
          error: 'Article content not available (no blob ID)'
        }));
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load article';
      setState(prev => ({ ...prev, error: errorMessage }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [loadArticleMetadata, loadArticleContent]);

  /**
   * Load article when slug changes
   */
  useEffect(() => {
    if (articleSlug) {
      loadArticle(articleSlug);
    } else {
      // Clear state when no slug
      setState({
        article: null,
        content: null,
        isLoading: false,
        isLoadingContent: false,
        error: null,
      });
    }
  }, [articleSlug, loadArticle]);


  /**
   * Retry loading
   */
  const retry = useCallback(() => {
    if (articleSlug) {
      loadArticle(articleSlug);
    }
  }, [articleSlug, loadArticle]);

  /**
   * Manual decryption that bypasses the auto-decryption flag
   */
  const manualDecryptContent = useCallback(async (article: Article): Promise<string> => {
    if (!suiClient) {
      throw new Error('Sui client not available');
    }

    try {
      setState(prev => ({ ...prev, isLoadingContent: true }));

      if (!article.quiltBlobId) {
        throw new Error('Article has no quilt blob ID');
      }

      // All content is encrypted - check if we have a content seal ID
      if (article.contentSealId) {
        // Wallet connection is required for signing the decryption transaction
        if (!currentAccount) {
          throw new Error('Wallet connection required to decrypt content');
        }

        // Download encrypted content from backend
        const response = await articlesAPI.getRawContent(article.quiltBlobId);

        // Handle different response formats
        const encryptedData = new Uint8Array(response.data);

        // Validate that the encrypted data is a valid BCS-encoded EncryptedObject
        try {
          const encObj = EncryptedObject.parse(encryptedData);
          console.log('✅ Manual decryption BCS validation successful. Content ID:', encObj.id);

          // Verify content ID match
          if (article.contentSealId && encObj.id !== article.contentSealId) {
            console.warn('⚠️ Manual decryption content ID mismatch:', {
              fromDatabase: article.contentSealId,
              fromEncryptedObject: encObj.id
            });
          }
        } catch (parseError) {
          console.error('❌ Manual decryption BCS validation failed:', parseError);
          throw new Error('Invalid encrypted content: BCS parsing failed. The stored data may be corrupted.');
        }

        // Manual decryption - bypasses auto-decryption flag
        console.log('🔓 MANUAL DECRYPTION - Starting Seal decryption process...');
        const decryptedContent = await decryptContent({
          encryptedData,
          contentId: article.contentSealId, // Pass as hex string directly from database
          articleId: article.articleId,
        });

        return decryptedContent;
      } else {
        // Fallback: if no content seal ID, try to get parsed content from backend
        const response = await articlesAPI.getContent(article.quiltBlobId);
        const content = response.data.content;
        return content;
      }
    } catch (error) {
      console.log(error);
      // Provide user-friendly error messages
      let errorMessage = 'Failed to load article content';

      if (error instanceof Error) {
        if (error.message.includes('Wallet connection required')) {
          errorMessage = 'Please connect your wallet to view this encrypted content';
        } else if (error.message.includes('key server')) {
          errorMessage = 'Decryption service temporarily unavailable. Please try again later.';
        } else if (error.message.includes('threshold')) {
          errorMessage = 'Decryption service unavailable. Please try again later.';
        } else if (error.message.includes('session')) {
          errorMessage = 'Authentication failed. Please reconnect your wallet and try again.';
        } else if (error.message.includes('approve_free')) {
          errorMessage = 'Content access denied. This article may not support free access.';
        } else {
          errorMessage = error.message;
        }
      }

      throw new Error(errorMessage);
    } finally {
      setState(prev => ({ ...prev, isLoadingContent: false }));
    }
  }, [suiClient, currentAccount, decryptContent]);

  /**
   * Reload content only
   */
  const reloadContent = useCallback(async () => {
    if (state.article && state.article.quiltBlobId) {
      try {
        // Use manual decryption for encrypted content, regular loading for others
        const content = state.article.contentSealId
          ? await manualDecryptContent(state.article)
          : await loadArticleContent(state.article);
        setState(prev => ({ ...prev, content, error: null }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to reload content';
        setState(prev => ({ ...prev, error: errorMessage }));
      }
    }
  }, [state.article, loadArticleContent, manualDecryptContent]);

  return {
    // State
    ...state,
    isProcessing: state.isLoading || state.isLoadingContent || isDecrypting,
    error: state.error || decryptionError,

    // Actions
    loadArticle,
    clearError: () => {
      setState(prev => ({ ...prev, error: null }));
      clearDecryptionError();
    },
    retry,
    reloadContent,

    // Computed properties
    hasContent: !!state.content,
    hasArticle: !!state.article,
    canLoadContent: !!state.article?.quiltBlobId,
  };
};