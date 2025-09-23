import { useState, useCallback, useEffect } from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { articlesAPI } from '@/lib/api';
import { useContentDecryption } from './useContentDecryption';
import { EncryptedObject } from '@mysten/seal';
import { log } from '@/lib/utils/Logger';
import { parseContentError } from '@/lib/utils/errorHandling';
import { Article, ArticleState, ArticleError, ArticleErrorType } from '@/types/article';

/**
 * Comprehensive article loading and decryption hook
 * 
 * This hook provides complete article management including:
 * - Loading article metadata from the backend API
 * - Downloading and decrypting Seal-encrypted content
 * - Handling BCS validation and data integrity checks
 * - Managing loading states and error handling
 * - Supporting both encrypted and unencrypted content
 * 
 * **IMPORTANT**: This hook preserves all Seal and Walrus data processing logic.
 * The encryption/decryption flows and BCS validation must remain unchanged
 * to prevent data corruption or compatibility issues.
 * 
 * @param articleSlug - URL slug of the article to load
 * @returns Article state and management functions
 * 
 * @example
 * ```tsx
 * const { 
 *   article, 
 *   content, 
 *   isProcessing, 
 *   error, 
 *   loadArticle, 
 *   retry 
 * } = useArticle('my-article-slug');
 * 
 * // Load article with encrypted content decryption
 * useEffect(() => {
 *   if (slug) {
 *     loadArticle(slug);
 *   }
 * }, [slug]);
 * ```
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
        log.debug('Processing encrypted content with Seal ID', {
          articleId: article.articleId,
          contentSealId: article.contentSealId.substring(0, 20) + '...',
          quiltBlobId: article.quiltBlobId,
          title: article.title
        }, 'useArticle');

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
          log.debug('BCS validation successful. Content ID from encrypted object', { contentId: encObj.id }, 'useArticle');

          // Verify that the content ID in the encrypted object matches what we expect
          if (article.contentSealId && encObj.id !== article.contentSealId) {
            log.warn('Content ID mismatch', {
              fromDatabase: article.contentSealId,
              fromEncryptedObject: encObj.id
            }, 'useArticle');
          }
        } catch (parseError) {
          log.error('BCS validation failed - encrypted data is corrupted or mis-encoded', parseError, 'useArticle');
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
      log.error('Failed to load article content', error, 'useArticle');
      const errorMessage = parseContentError(error);
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
          log.debug('Manual decryption BCS validation successful', { contentId: encObj.id }, 'useArticle');

          // Verify content ID match
          if (article.contentSealId && encObj.id !== article.contentSealId) {
            log.warn('Manual decryption content ID mismatch', {
              fromDatabase: article.contentSealId,
              fromEncryptedObject: encObj.id
            }, 'useArticle');
          }
        } catch (parseError) {
          log.error('Manual decryption BCS validation failed', parseError, 'useArticle');
          throw new Error('Invalid encrypted content: BCS parsing failed. The stored data may be corrupted.');
        }

        // Manual decryption - bypasses auto-decryption flag
        log.info('MANUAL DECRYPTION - Starting Seal decryption process', null, 'useArticle');
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
      log.error('Manual decryption failed', error, 'useArticle');
      const errorMessage = parseContentError(error);
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