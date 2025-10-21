import { useState, useCallback, useEffect } from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { articlesAPI } from '@/lib/api';
import { useContentDecryption } from './useContentDecryption';
import { useUserPublications } from './useUserPublications';
import { usePublication } from './usePublication';
import { EncryptedObject } from '@mysten/seal';
import { log } from '@/lib/utils/Logger';
import { parseContentError } from '@/lib/utils/errorHandling';
import { transformMediaUrls } from '@/lib/utils/mediaUrlTransform';
import { Article, ArticleState } from '@/types/article';

// Loading stages for better UX feedback
type LoadingStage = 'idle' | 'metadata' | 'content' | 'decrypting' | 'waiting-wallet';

interface LoadingStateInfo {
  stage: LoadingStage;
  message: string;
  description: string;
  showSpinner: boolean;
  needsWallet: boolean;
}

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

  // Enhanced loading state tracking
  const [isWalletReady, setIsWalletReady] = useState(false);
  const [isWaitingForWallet, setIsWaitingForWallet] = useState(false);
  const [loadingStage, setLoadingStage] = useState<LoadingStage>('idle');
  const [encryptedContentData, setEncryptedContentData] = useState<{
    encryptedData: Uint8Array;
    article: Article;
  } | null>(null);

  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const { decryptContent, isDecrypting, decryptionError, clearError: clearDecryptionError } = useContentDecryption();
  
  // Get user's publication info for owner cap ID
  const { firstPublication, isLoading: isLoadingUserPublications } = useUserPublications();
  
  // Get publication info for subscription price (we'll need the article's publicationId for this)
  const [currentPublicationId, setCurrentPublicationId] = useState<string | null>(null);
  const { publication: currentPublication, isLoading: isLoadingPublication } = usePublication(currentPublicationId || '');

  // Get loading state information based on current stage
  const getLoadingStateInfo = useCallback((): LoadingStateInfo => {
    switch (loadingStage) {
      case 'metadata':
        return {
          stage: 'metadata',
          message: 'Loading article...',
          description: 'Fetching article metadata from the backend',
          showSpinner: true,
          needsWallet: false
        };
      case 'content':
        return {
          stage: 'content', 
          message: 'Loading content from Walrus...',
          description: 'Downloading content from decentralized storage',
          showSpinner: true,
          needsWallet: false
        };
      case 'decrypting':
        return {
          stage: 'decrypting',
          message: 'Decrypting content with Seal...',
          description: 'Using Seal Identity-Based Encryption to decrypt content',
          showSpinner: true,
          needsWallet: true
        };
      case 'waiting-wallet':
        return {
          stage: 'waiting-wallet',
          message: 'Waiting for wallet connection...',
          description: 'Please connect your wallet to decrypt this encrypted content',
          showSpinner: false,
          needsWallet: true
        };
      default:
        return {
          stage: 'idle',
          message: '',
          description: '',
          showSpinner: false,
          needsWallet: false
        };
    }
  }, [loadingStage]);

  // Monitor wallet connection status
  useEffect(() => {
    const walletReady = !!(currentAccount && suiClient);
    setIsWalletReady(walletReady);
    
    if (walletReady && isWaitingForWallet) {
      log.debug('Wallet connection established, ready for decryption', {
        account: currentAccount?.address,
        hasClient: !!suiClient
      }, 'useArticle');
      setIsWaitingForWallet(false);
    }
  }, [currentAccount, suiClient, isWaitingForWallet]);

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
  const loadArticleContent = useCallback(async (article: Article, forceWait: boolean = false): Promise<string | null> => {
    if (!suiClient) {
      throw new Error('Sui client not available');
    }

    try {
      setState(prev => ({ ...prev, isLoadingContent: true }));
      setLoadingStage('content');

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

        // Check wallet connection for encrypted content
        if (!currentAccount || !isWalletReady) {
          if (forceWait) {
            // Set waiting state and don't throw error - let the wallet monitoring handle retry
            setIsWaitingForWallet(true);
            setLoadingStage('waiting-wallet');
            setState(prev => ({ 
              ...prev, 
              isLoadingContent: false,
              error: 'Waiting for wallet connection to decrypt content...'
            }));
            return null;
          } else {
            throw new Error('Wallet connection required to decrypt content');
          }
        }
        
        // Enhanced data availability checks
        const isOwnerOfPublication = firstPublication?.publicationId === article.publicationId;
        const hasOwnerCapData = isOwnerOfPublication && !!firstPublication?.ownerCapId;
        const hasSubscriptionData = !!currentPublication?.subscriptionPrice;
        
        // If user owns publication but we don't have owner cap data, wait for it
        if (isOwnerOfPublication && !hasOwnerCapData && !isLoadingUserPublications) {
          console.warn('⚠️ Owner publication detected but no ownerCapId available');
          if (forceWait) {
            setIsWaitingForWallet(true);
            setLoadingStage('waiting-wallet');
            setState(prev => ({ 
              ...prev, 
              isLoadingContent: false,
              error: 'Waiting for publication ownership data...'
            }));
            return null;
          } else {
            throw new Error('Publication ownership data missing');
          }
        }
        
        // Check if we're still loading user publications
        if (isLoadingUserPublications) {
          if (forceWait) {
            setIsWaitingForWallet(true);
            setLoadingStage('waiting-wallet');
            setState(prev => ({ 
              ...prev, 
              isLoadingContent: false,
              error: 'Loading user publication data...'
            }));
            return null;
          } else {
            throw new Error('User publication data still loading');
          }
        }
        
        // Check if publication subscription data is still loading
        if (isLoadingPublication && currentPublicationId) {
          if (forceWait) {
            setIsWaitingForWallet(true);
            setLoadingStage('waiting-wallet');
            setState(prev => ({ 
              ...prev, 
              isLoadingContent: false,
              error: 'Loading subscription data for decryption...'
            }));
            return null;
          } else {
            throw new Error('Subscription data still loading');
          }
        }

        // Download encrypted content from backend
        const response = await articlesAPI.getRawContent(article.quiltBlobId);
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

        // Store encrypted data and article for later decryption
        // Decryption will be triggered by useEffect when all data is ready
        console.log('📦 Storing encrypted content for data-driven decryption');
        setEncryptedContentData({ encryptedData, article });
        setLoadingStage('waiting-wallet'); // Will be updated when decryption starts
        
        return null; // Content will be set by the decryption useEffect

      } else {
        // Fallback: if no content seal ID, try to get parsed content from backend

        const response = await articlesAPI.getContent(article.quiltBlobId);
        const content = response.data.content;

        // Transform media URLs to include articleId parameter (even for unencrypted content)
        const transformedContent = transformMediaUrls(content, article.articleId);

        return transformedContent;
      }

    } catch (error) {
      log.error('Failed to load article content', error, 'useArticle');
      const errorMessage = parseContentError(error);
      throw new Error(errorMessage);
    } finally {
      setState(prev => ({ ...prev, isLoadingContent: false }));
      setLoadingStage('idle');
    }
  }, [suiClient, currentAccount, isWalletReady, decryptContent]);

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

    // Clear wallet waiting state when starting fresh
    setIsWaitingForWallet(false);
    setLoadingStage('metadata');

    try {
      // 1. Load article metadata from backend (doesn't require wallet)
      log.debug('Loading article metadata', { slug }, 'useArticle');
      const article = await loadArticleMetadata(slug);
      setState(prev => ({ ...prev, article }));
      
      // Set current publication ID for subscription price lookup
      setCurrentPublicationId(article.publicationId);

      // 2. Progressive content loading based on encryption status
      if (article.quiltBlobId) {
        try {
          // For encrypted content, use forceWait to gracefully handle wallet not ready
          const isEncrypted = !!article.contentSealId;
          const content = await loadArticleContent(article, isEncrypted);
          
          if (content !== null) {
            setState(prev => ({ ...prev, content }));
          }
          // If content is null and encrypted, it means we're waiting for wallet
          
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
      setLoadingStage('idle');
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
      setIsWaitingForWallet(false);
      setLoadingStage('idle');
      setEncryptedContentData(null);
    }
  }, [articleSlug, loadArticle]);

  /**
   * Data-driven decryption trigger: Decrypt when all required data is available
   */
  useEffect(() => {
    // Only proceed if we have encrypted content waiting for decryption
    if (!encryptedContentData || state.content) {
      return;
    }

    const { encryptedData, article } = encryptedContentData;
    
    // Check if wallet is ready
    if (!isWalletReady || !currentAccount) {
      console.log('⏳ Waiting for wallet connection');
      return;
    }

    // Check if we're still loading publication data
    if (isLoadingUserPublications || isLoadingPublication) {
      console.log('⏳ Waiting for publication data to load');
      return;
    }

    const isOwnerOfPublication = firstPublication?.publicationId === article.publicationId;
    const hasOwnerCapData = isOwnerOfPublication ? !!firstPublication?.ownerCapId : true;
    const hasSubscriptionData = currentPublicationId ? !!currentPublication : true;

    // Ensure we have all required data
    if (!hasOwnerCapData || !hasSubscriptionData) {
      console.log('⏳ Waiting for complete publication data', {
        isOwnerOfPublication,
        hasOwnerCapData,
        hasSubscriptionData,
        firstPublication: !!firstPublication,
        currentPublication: !!currentPublication
      });
      return;
    }

    // All data is ready - trigger decryption
    const performDecryption = async () => {
      try {
        console.log('🚀 ALL DATA READY - Starting decryption');
        setLoadingStage('decrypting');
        setState(prev => ({ ...prev, isLoadingContent: true, error: null }));
        
        // Debug: Check data availability before creating decryption params
        console.log('🔍 FINAL DATA CHECK:', {
          firstPublication,
          hasFirstPub: !!firstPublication,
          firstPubId: firstPublication?.publicationId,
          ownerCapId: firstPublication?.ownerCapId,
          currentPublication,
          hasCurrentPub: !!currentPublication,
          subscriptionPrice: currentPublication?.subscriptionPrice,
          articlePubId: article.publicationId,
          isLoadingUserPubs: isLoadingUserPublications,
          isLoadingPub: isLoadingPublication
        });
        
        // Create decryption parameters with all available data
        const decryptionParams = {
          encryptedData,
          contentId: article.contentSealId!,
          articleId: article.articleId,
          publicationId: article.publicationId,
          // Policy selection fields for smart access control
          ownerCapId: firstPublication?.ownerCapId && firstPublication.publicationId === article.publicationId 
            ? firstPublication.ownerCapId 
            : undefined,
          subscriptionPrice: currentPublication?.subscriptionPrice,
          // TODO: Add subscriptionId when subscription system is implemented
          // subscriptionId: userSubscription?.id
        };
        
        console.log('🎯 FINAL POLICY SELECTION INPUT:', {
          ownerCapId: decryptionParams.ownerCapId,
          subscriptionPrice: decryptionParams.subscriptionPrice,
          publicationId: decryptionParams.publicationId
        });
        
        // Decrypt content
        const decryptedContent = await decryptContent(decryptionParams);
        
        // Transform media URLs to include articleId parameter
        const transformedContent = transformMediaUrls(decryptedContent, article.articleId);
        
        // Update state with decrypted content
        setState(prev => ({ 
          ...prev, 
          content: transformedContent,
          isLoadingContent: false,
          error: null
        }));
        
        // Clear encrypted data since we're done
        setEncryptedContentData(null);
        setLoadingStage('idle');
        
        console.log('✅ Decryption completed successfully');
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to decrypt content';
        console.error('❌ Decryption failed:', errorMessage);
        
        setState(prev => ({
          ...prev,
          isLoadingContent: false,
          error: errorMessage
        }));
        setLoadingStage('idle');
      }
    };

    performDecryption();
  }, [
    encryptedContentData,
    state.content,
    isWalletReady,
    currentAccount,
    isLoadingUserPublications,
    isLoadingPublication,
    firstPublication?.publicationId,
    firstPublication?.ownerCapId,
    currentPublication?.subscriptionPrice,
    currentPublicationId,
    currentPublication,
    decryptContent
  ]);


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
      setLoadingStage('content');

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
        setLoadingStage('decrypting');
        log.info('MANUAL DECRYPTION - Starting Seal decryption process', null, 'useArticle');
        
        // Log manual decryption parameters for debugging
        const manualDecryptionParams = {
          encryptedData,
          contentId: article.contentSealId, // Pass as hex string directly from database
          articleId: article.articleId,
          publicationId: article.publicationId, // Add publication ID for subscription verification
          // Policy selection fields for smart access control
          ownerCapId: firstPublication?.ownerCapId && firstPublication.publicationId === article.publicationId 
            ? firstPublication.ownerCapId 
            : undefined,
          subscriptionPrice: currentPublication?.subscriptionPrice,
          // TODO: Add subscriptionId when subscription system is implemented
          // subscriptionId: userSubscription?.id
        };
        
        console.log('🎯 MANUAL POLICY SELECTION INPUT:', {
          ownerCapId: manualDecryptionParams.ownerCapId,
          subscriptionPrice: manualDecryptionParams.subscriptionPrice,
          publicationId: manualDecryptionParams.publicationId
        });
        
        const decryptedContent = await decryptContent(manualDecryptionParams);

        // Transform media URLs to include articleId parameter
        const transformedContent = transformMediaUrls(decryptedContent, article.articleId);

        return transformedContent;
      } else {
        // Fallback: if no content seal ID, try to get parsed content from backend
        const response = await articlesAPI.getContent(article.quiltBlobId);
        const content = response.data.content;
        
        // Transform media URLs to include articleId parameter (even for unencrypted content)
        const transformedContent = transformMediaUrls(content, article.articleId);
        
        return transformedContent;
      }
    } catch (error) {
      log.error('Manual decryption failed', error, 'useArticle');
      const errorMessage = parseContentError(error);
      throw new Error(errorMessage);
    } finally {
      setState(prev => ({ ...prev, isLoadingContent: false }));
      setLoadingStage('idle');
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
    isWaitingForWallet,
    isWalletReady,
    loadingStage,
    loadingStateInfo: getLoadingStateInfo(),

    // Actions
    loadArticle,
    clearError: () => {
      setState(prev => ({ ...prev, error: null }));
      setIsWaitingForWallet(false);
      setLoadingStage('idle');
      clearDecryptionError();
    },
    retry,
    reloadContent,

    // Computed properties
    hasContent: !!state.content,
    hasArticle: !!state.article,
    canLoadContent: !!state.article?.quiltBlobId,
    needsWalletForContent: !!(state.article?.contentSealId && !isWalletReady),
  };
};