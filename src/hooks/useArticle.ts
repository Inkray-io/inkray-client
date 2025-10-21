import { useState, useCallback, useEffect, useRef } from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { articlesAPI } from '@/lib/api';
import { useContentDecryption } from './useContentDecryption';
import type { DecryptionParams } from '@/lib/services/SealService';
import { useUserPublications } from './useUserPublications';
import { usePublication } from './usePublication';
import { useSubscription } from './useSubscription';
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

  // Guard to prevent multiple decryption attempts for the same article
  const decryptionInProgress = useRef<Set<string>>(new Set());
  
  // Stable owner data to prevent dependency loops
  const stableOwnerData = useRef<{
    publicationId: string;
    ownerCapId: string;
  } | null>(null);


  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const { decryptContent, isDecrypting, decryptionError, clearError: clearDecryptionError } = useContentDecryption();
  
  // Stable reference to decryptContent to prevent useEffect loops
  const stableDecryptContent = useCallback((params: DecryptionParams) => {
    return decryptContent(params);
  }, [decryptContent]);


  // Get user's publication info for owner cap ID
  const { firstPublication, isLoading: isLoadingUserPublications } = useUserPublications();

  // Get publication info for subscription price (we'll need the article's publicationId for this)
  const [currentPublicationId, setCurrentPublicationId] = useState<string | null>(null);
  const { publication: currentPublication, isLoading: isLoadingPublication } = usePublication(currentPublicationId || '');

  // Get publication subscription status for the current user
  const {
    subscriptionStatus,
    subscriptionInfo,
    isLoading: isLoadingSubscription,
    refetch: refetchSubscription
  } = useSubscription({
    publicationId: currentPublicationId || '',
    enabled: !!currentPublicationId
  });

  /**
   * Determine if we should attempt decryption based on access control policies
   */
  const shouldAttemptDecryption = useCallback((article: Article): { shouldAttempt: boolean; reason: string; hasAccess: boolean } => {
    // For free content (no subscription price), always allow decryption
    const requiresSubscription = subscriptionStatus?.publicationRequiresSubscription ?? 
      !!(currentPublication?.subscriptionPrice && currentPublication.subscriptionPrice > 0);
    
    if (!requiresSubscription) {
      return { 
        shouldAttempt: true, 
        reason: 'Free content - no access control required',
        hasAccess: true 
      };
    }

    // Check if user is the publication owner
    const isOwner = stableOwnerData.current?.publicationId === article.publicationId;
    if (isOwner) {
      return { 
        shouldAttempt: true, 
        reason: 'User owns the publication',
        hasAccess: true 
      };
    }

    // Check subscription access
    const hasActiveSubscription = !!(subscriptionStatus?.hasActiveSubscription);
    if (hasActiveSubscription) {
      return { 
        shouldAttempt: true, 
        reason: 'User has active subscription',
        hasAccess: true 
      };
    }

    // If we're still loading data, be conservative - only allow if user might be the owner
    if (isLoadingUserPublications || isLoadingPublication || isLoadingSubscription) {
      // Check if user might be the publication owner (using stable owner data)
      const mightBeOwner = stableOwnerData.current?.publicationId === article.publicationId;
      
      if (mightBeOwner) {
        return { 
          shouldAttempt: true, 
          reason: 'Still loading data but user might be owner',
          hasAccess: true 
        };
      } else {
        // For non-owners, don't attempt decryption during loading to avoid unnecessary popups
        return { 
          shouldAttempt: false, 
          reason: 'Still loading access control data for non-owner',
          hasAccess: false 
        };
      }
    }

    // User lacks access - don't attempt decryption
    return { 
      shouldAttempt: false, 
      reason: 'User lacks subscription access to gated content',
      hasAccess: false 
    };
  }, [
    subscriptionStatus?.publicationRequiresSubscription,
    subscriptionStatus?.hasActiveSubscription,
    currentPublication?.subscriptionPrice,
    stableOwnerData,
    isLoadingUserPublications,
    isLoadingPublication,
    isLoadingSubscription
  ]);

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
    } catch {
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

      // Smart subscription/owner check - avoid race conditions for publication owners
      const requiresSubscription = subscriptionStatus?.publicationRequiresSubscription ?? 
        !!(currentPublication?.subscriptionPrice && currentPublication.subscriptionPrice > 0);
      const hasActiveSubscription = !!(subscriptionStatus?.hasActiveSubscription);
      
      // Check if user might be the publication owner (using stable owner data)
      const mightBeOwner = stableOwnerData.current?.publicationId === article.publicationId;
      
      // If this publication requires subscription and user doesn't have one
      if (requiresSubscription && !hasActiveSubscription) {
        // If user might be the owner but owner data is still loading, defer to data-driven decryption
        if (mightBeOwner || isLoadingUserPublications) {
          log.debug('Potential owner or owner data loading - deferring subscription check to data-driven decryption', {
            articleId: article.articleId,
            mightBeOwner,
            isLoadingUserPublications,
            requiresSubscription,
            hasActiveSubscription
          }, 'useArticle');
          
          // For encrypted content, this will be handled by data-driven decryption
          // For unencrypted content, we'll let it through (owner should access their own content)
          if (article.contentSealId) {
            // Return null to signal that data-driven decryption should handle this
            return null;
          }
          // For unencrypted content, continue loading (owners should access their own content)
        } else {
          // User is definitely not the owner and has no subscription
          throw new Error('This article requires an active subscription to view');
        }
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
  }, [
    suiClient, 
    currentAccount, 
    isWalletReady,
    subscriptionStatus?.publicationRequiresSubscription,
    subscriptionStatus?.hasActiveSubscription,
    currentPublication?.subscriptionPrice,
    isLoadingUserPublications,
    isLoadingPublication,
    firstPublication?.publicationId,
    firstPublication?.ownerCapId,
    currentPublicationId
  ]);

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
    
    let hasEncryptedContent = false;

    try {
      // 1. Load article metadata from backend (doesn't require wallet)
      log.debug('Loading article metadata', { slug }, 'useArticle');
      const article = await loadArticleMetadata(slug);
      setState(prev => ({ ...prev, article }));

      // Set current publication ID for subscription price lookup
      setCurrentPublicationId(article.publicationId);

      log.debug('Article metadata loaded, attempting to load content', {
        articleId: article.articleId,
        publicationId: article.publicationId,
        hasQuiltBlobId: !!article.quiltBlobId,
        isEncrypted: !!article.contentSealId
      }, 'useArticle');

      // 2. Load content directly if available
      if (article.quiltBlobId) {
        const isEncrypted = !!article.contentSealId;
        
        // For encrypted content, skip direct loading to avoid race conditions
        // Let the data-driven decryption useEffect handle it when all policy data is ready
        if (isEncrypted) {
          log.debug('Encrypted content detected - deferring to data-driven decryption', {
            articleId: article.articleId,
            contentSealId: article.contentSealId?.substring(0, 20) + '...'
          }, 'useArticle');
          
          // Download encrypted content and check access before attempting decryption
          try {
            const response = await articlesAPI.getRawContent(article.quiltBlobId);
            const encryptedData = new Uint8Array(response.data);
            
            // Check if user should attempt decryption based on access control
            const accessCheck = shouldAttemptDecryption(article);
            
            if (accessCheck.shouldAttempt) {
              // Store encrypted content data for data-driven decryption
              setEncryptedContentData({ encryptedData, article });
              
              // Set loading stage to indicate we're waiting for decryption data
              setLoadingStage('waiting-wallet');
              hasEncryptedContent = true;
              
              log.debug('Encrypted content downloaded, stored for data-driven decryption', {
                articleId: article.articleId,
                encryptedSize: encryptedData.length,
                accessReason: accessCheck.reason
              }, 'useArticle');
            } else {
              // User lacks access - don't attempt decryption, show subscription paywall instead
              log.debug('Encrypted content downloaded but user lacks access - showing subscription paywall', {
                articleId: article.articleId,
                reason: accessCheck.reason
              }, 'useArticle');
              
              // Don't set loading stage, let UI show subscription paywall
              setState(prev => ({
                ...prev,
                error: null // Clear any existing errors to show clean subscription paywall
              }));
            }
            
          } catch (encryptedError) {
            log.error('Failed to download encrypted content', encryptedError, 'useArticle');
            setState(prev => ({
              ...prev,
              error: `Failed to download encrypted content: ${encryptedError instanceof Error ? encryptedError.message : 'Unknown error'}`
            }));
          }
          
          return; // Exit early, let useEffect handle encrypted content
        }
        
        // For unencrypted content, load directly
        try {
          const content = await loadArticleContent(article, false);
          
          if (content !== null) {
            setState(prev => ({ ...prev, content }));
            log.debug('Unencrypted content loaded successfully', { articleId: article.articleId }, 'useArticle');
          }
        } catch (contentError) {
          // If content loading fails, still show the article metadata
          log.warn('Content loading failed, showing article metadata only', contentError, 'useArticle');
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
      
      // Only reset loading stage if we don't have encrypted content waiting for decryption
      if (!hasEncryptedContent) {
        setLoadingStage('idle');
      }
      // For encrypted content, the data-driven decryption useEffect will manage the loading stage
    }
  }, [loadArticleMetadata, loadArticleContent, shouldAttemptDecryption]);

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
   * Update stable owner data when firstPublication changes
   */
  useEffect(() => {
    if (firstPublication?.publicationId && firstPublication?.ownerCapId) {
      stableOwnerData.current = {
        publicationId: firstPublication.publicationId,
        ownerCapId: firstPublication.ownerCapId
      };
      console.log('📋 Stable owner data updated:', stableOwnerData.current);
    }
  }, [firstPublication?.publicationId, firstPublication?.ownerCapId]);

  /**
   * Data-driven decryption trigger: Decrypt when all required data is available
   */
  useEffect(() => {
    // Only proceed if we have encrypted content waiting for decryption
    if (!encryptedContentData || state.content) {
      return;
    }

    const { encryptedData, article } = encryptedContentData;

    // Check access control before attempting decryption
    const accessCheck = shouldAttemptDecryption(article);
    if (!accessCheck.shouldAttempt || !accessCheck.hasAccess) {
      console.log('🚫 Data-driven decryption blocked:', accessCheck.reason);
      // Clear encrypted content data to prevent retries and show subscription paywall instead
      setEncryptedContentData(null);
      setLoadingStage('idle');
      return;
    }
    const decryptionKey = `${article.articleId}-${article.contentSealId}`;

    // Check if decryption is already in progress for this article
    if (decryptionInProgress.current.has(decryptionKey)) {
      console.log('⏳ Decryption already in progress for article:', article.articleId);
      return;
    }

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

    // Use stable owner data to prevent dependency loops
    const isOwnerOfPublication = stableOwnerData.current?.publicationId === article.publicationId;
    const hasOwnerCapData = isOwnerOfPublication ? !!stableOwnerData.current?.ownerCapId : true;
    const hasSubscriptionData = currentPublicationId ? !!currentPublication : true;

    // Ensure we have all required data
    if (!hasOwnerCapData || !hasSubscriptionData) {
      console.log('⏳ Waiting for complete publication data', {
        isOwnerOfPublication,
        hasOwnerCapData,
        hasSubscriptionData,
        stableOwnerData: stableOwnerData.current,
        currentPublication: !!currentPublication
      });
      return;
    }

    // All data is ready - trigger decryption
    const performDecryption = async () => {
      try {
        // Mark decryption as in progress
        decryptionInProgress.current.add(decryptionKey);
        
        console.log('🚀 ALL DATA READY - Starting decryption');
        setLoadingStage('decrypting');
        setState(prev => ({ ...prev, isLoadingContent: true, error: null }));

        // Debug: Check data availability before creating decryption params
        console.log('🔍 FINAL DATA CHECK:', {
          stableOwnerData: stableOwnerData.current,
          currentPublication,
          hasCurrentPub: !!currentPublication,
          subscriptionPrice: currentPublication?.subscriptionPrice,
          articlePubId: article.publicationId,
          isLoadingUserPubs: isLoadingUserPublications,
          isLoadingPub: isLoadingPublication
        });

        // Create decryption parameters with stable owner data
        const decryptionParams = {
          encryptedData,
          contentId: article.contentSealId!,
          articleId: article.articleId,
          publicationId: article.publicationId,
          // Policy selection fields for smart access control
          ownerCapId: stableOwnerData.current?.publicationId === article.publicationId
            ? stableOwnerData.current?.ownerCapId
            : undefined,
          // Use subscription price from subscription API if available, fallback to publication data
          subscriptionPrice: subscriptionInfo?.subscriptionPrice ?? currentPublication?.subscriptionPrice,
          // Add subscriptionId from the subscription system
          subscriptionId: subscriptionStatus?.subscription?.subscriptionId,
        };

        console.log('🎯 FINAL POLICY SELECTION INPUT:', {
          ownerCapId: decryptionParams.ownerCapId,
          subscriptionPrice: decryptionParams.subscriptionPrice,
          subscriptionId: decryptionParams.subscriptionId,
          publicationId: decryptionParams.publicationId,
          hasActiveSubscription: subscriptionStatus?.hasActiveSubscription,
          subscriptionPriceFromAPI: subscriptionInfo?.subscriptionPrice,
          subscriptionPriceFromPublication: currentPublication?.subscriptionPrice,
          expectedPolicy: decryptionParams.ownerCapId ? 'OWNER' :
            (decryptionParams.subscriptionPrice && decryptionParams.subscriptionPrice > 0 && decryptionParams.subscriptionId) ? 'SUBSCRIPTION' : 'FREE'
        });

        // Decrypt content
        const decryptedContent = await stableDecryptContent(decryptionParams);

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
      } finally {
        // Always clear the in-progress flag
        decryptionInProgress.current.delete(decryptionKey);
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
    currentPublication?.subscriptionPrice,
    currentPublicationId,
    currentPublication,
    subscriptionInfo?.subscriptionPrice,
    subscriptionStatus?.hasActiveSubscription,
    subscriptionStatus?.subscription?.subscriptionId,
    stableDecryptContent,
    shouldAttemptDecryption
  ]);

  /**
   * Enhance article with publication subscription information
   * This effect runs after article and subscription data are loaded
   */
  useEffect(() => {
    // Only enhance if we have an article and aren't loading
    if (!state.article || isLoadingSubscription || isLoadingPublication) {
      return;
    }

    const article = state.article;

    console.log('🔍 ARTICLE ENHANCEMENT DEBUG:', {
      articleId: article.articleId,
      publicationId: article.publicationId,
      currentPublication: {
        id: currentPublication?.id,
        subscriptionPrice: currentPublication?.subscriptionPrice,
      },
      subscriptionStatus: {
        hasActiveSubscription: subscriptionStatus?.hasActiveSubscription,
        publicationRequiresSubscription: subscriptionStatus?.publicationRequiresSubscription,
      },
      subscriptionInfo: {
        id: subscriptionInfo?.id,
        subscriptionPrice: subscriptionInfo?.subscriptionPrice,
        priceInSUI: subscriptionInfo?.subscriptionPrice ? subscriptionInfo.subscriptionPrice / 1_000_000_000 : null,
      },
      loadingStates: {
        isLoadingSubscription,
        isLoadingPublication,
      },
    });

    // Determine if this publication requires a subscription
    // Priority: Use subscription API data if available, fallback to publication data
    const publicationRequiresSubscription = subscriptionStatus?.publicationRequiresSubscription ??
      !!(currentPublication?.subscriptionPrice && currentPublication.subscriptionPrice > 0);

    // Determine if user has an active subscription
    const hasActiveSubscription = !!(subscriptionStatus?.hasActiveSubscription);

    // Only update if the subscription fields need to change
    const needsUpdate =
      article.requiresPublicationSubscription !== publicationRequiresSubscription ||
      article.hasActivePublicationSubscription !== hasActiveSubscription ||
      (publicationRequiresSubscription && !article.publicationSubscriptionInfo && subscriptionInfo);

    if (needsUpdate) {
      const enhancedArticle: Article = {
        ...article,
        requiresPublicationSubscription: publicationRequiresSubscription,
        hasActivePublicationSubscription: hasActiveSubscription,
        publicationSubscriptionInfo: publicationRequiresSubscription ?
          (subscriptionInfo ? {
            id: subscriptionInfo.id,
            subscriptionPrice: subscriptionInfo.subscriptionPrice,
            subscriptionPeriod: subscriptionInfo.subscriptionPeriod,
          } : {
            // Fallback to publication data if subscription API data not available
            id: currentPublicationId || '',
            subscriptionPrice: currentPublication?.subscriptionPrice || 0,
            subscriptionPeriod: 30, // Default
          }) : undefined,
        publicationSubscriptionExpiresAt: subscriptionStatus?.subscription?.expiresAt?.toISOString(),
      };

      setState(prev => ({
        ...prev,
        article: enhancedArticle,
      }));

      console.log('📋 Enhanced article with publication subscription info:', {
        requiresSubscription: publicationRequiresSubscription,
        hasActiveSubscription: hasActiveSubscription,
        subscriptionPriceFromPublication: currentPublication?.subscriptionPrice,
        subscriptionPriceFromAPI: subscriptionInfo?.subscriptionPrice,
        finalSubscriptionInfo: enhancedArticle.publicationSubscriptionInfo,
        subscriptionExpiresAt: subscriptionStatus?.subscription?.expiresAt,
      });

      log.debug('Subscription validation completed - content loading will be evaluated', {
        articleId: enhancedArticle.articleId,
        requiresSubscription: publicationRequiresSubscription,
        hasActiveSubscription: hasActiveSubscription
      }, 'useArticle');
    }
  }, [
    state.article,
    currentPublication?.subscriptionPrice,
    currentPublication?.id,
    currentPublicationId,
    subscriptionStatus?.hasActiveSubscription,
    subscriptionStatus?.publicationRequiresSubscription,
    subscriptionStatus?.subscription?.expiresAt,
    subscriptionInfo,
    isLoadingSubscription,
    isLoadingPublication,
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
          // Use subscription price from subscription API if available, fallback to publication data
          subscriptionPrice: subscriptionInfo?.subscriptionPrice ?? currentPublication?.subscriptionPrice,
          // Add subscriptionId from the subscription system
          subscriptionId: subscriptionStatus?.subscription?.subscriptionId,
        };

        console.log('🎯 MANUAL POLICY SELECTION INPUT:', {
          ownerCapId: manualDecryptionParams.ownerCapId,
          subscriptionPrice: manualDecryptionParams.subscriptionPrice,
          subscriptionId: manualDecryptionParams.subscriptionId,
          publicationId: manualDecryptionParams.publicationId,
          hasActiveSubscription: subscriptionStatus?.hasActiveSubscription,
          expectedPolicy: manualDecryptionParams.ownerCapId ? 'OWNER' :
            (manualDecryptionParams.subscriptionPrice && manualDecryptionParams.subscriptionPrice > 0 && manualDecryptionParams.subscriptionId) ? 'SUBSCRIPTION' : 'FREE'
        });

        const decryptedContent = await stableDecryptContent(manualDecryptionParams);

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
  }, [
    suiClient, 
    currentAccount, 
    stableDecryptContent,
    firstPublication?.ownerCapId,
    firstPublication?.publicationId,
    currentPublication?.subscriptionPrice,
    subscriptionInfo?.subscriptionPrice,
    subscriptionStatus?.hasActiveSubscription,
    subscriptionStatus?.subscription?.subscriptionId
  ]);

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

  // Calculate if user has decryption access for current article
  const hasDecryptionAccess = state.article ? shouldAttemptDecryption(state.article).hasAccess : true;

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
    refetchSubscription,

    // Computed properties
    hasContent: !!state.content,
    hasArticle: !!state.article,
    canLoadContent: !!state.article?.quiltBlobId,
    needsWalletForContent: !!(state.article?.contentSealId && !isWalletReady),
    hasDecryptionAccess,
  };
};