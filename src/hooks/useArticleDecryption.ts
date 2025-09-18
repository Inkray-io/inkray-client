import { useState, useCallback, useEffect } from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { createSealClient } from '@/lib/seal-client';
import { createWalrusClient } from '@/lib/walrus-client';
import { eventsAPI } from '@/lib/api';
import type { UserCredentials } from '@/lib/seal-client';

export interface ArticleMetadata {
  id: string;
  title: string;
  slug: string;
  author: string;
  publicationId: string;
  blobId: string;
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
 * Adapted from contracts/scripts/src/workflows/decryption-test-flow.ts
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

          // If blobId is missing from backend, query the Article object on-chain
          const blobId = article.blobId;
          const contentId = article.contentId;

          if (!blobId && article.id) {
            console.log('Missing blobId in backend data, querying on-chain...');

            const objectIdToQuery = article.articleId || article.id;

            try {
              const articleObject = await suiClient.getObject({
                id: objectIdToQuery,
                options: { showContent: true },
              });

              if (articleObject.data?.content && 'fields' in articleObject.data.content) {
                const fields = articleObject.data.content.fields as Record<string, unknown>;

                if (fields.body_id) {
                  console.log('Found body_id in Article:', fields.body_id);
                  // TODO: Query vault to get actual blob ID from body_id
                }
              }
            } catch (error) {
              console.error('Failed to query Article object:', error);
            }
          }

          return {
            id: article.id,
            title: article.title,
            slug: article.slug,
            author: article.author,
            publicationId: article.publicationId,
            blobId: blobId,
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
   * Download and decrypt article content
   */
  const downloadAndDecryptArticle = useCallback(
    async (metadata: ArticleMetadata): Promise<string> => {
      // Only require wallet connection for encrypted articles
      if (metadata.isEncrypted && !currentAccount) {
        throw new Error('Wallet connection required to read encrypted content');
      }

      setState(prev => ({ ...prev, isDownloading: true }));

      try {
        // 1. Download content from Walrus
        console.log('Downloading article content from Walrus:', metadata.blobId);

        const walrusClient = createWalrusClient(suiClient, currentAccount);
        // Download content from Walrus - no fallback, throw error if it fails
        const rawContent = await walrusClient.downloadBlob(metadata.blobId);
        console.log(`Downloaded ${rawContent.length} bytes from Walrus`);

        setState(prev => ({ ...prev, isDownloading: false, isDecrypting: true }));
        // 2. Decrypt if encrypted
        if (metadata.isEncrypted) {
          console.log('Decrypting encrypted content...');

          // Wallet is guaranteed to be connected at this point due to check above
          if (!currentAccount) {
            throw new Error('Wallet connection required for decryption');
          }

          const sealClient = createSealClient(suiClient, currentAccount);

          // Build credentials for decryption - try multiple access methods
          const credentials = await buildDecryptionCredentials(
            currentAccount.address,
            metadata.publicationId
          );

          try {
            // Use the new real Seal client with multi-credential decryption
            const decryptedContent = await sealClient.decryptContent({
              encryptedData: rawContent,
              contentId: metadata.contentId, // This should be a BCS-encoded content ID or hex string
              credentials,
              packageId: process.env.NEXT_PUBLIC_PACKAGE_ID || '',
              requestingClient: suiClient,
            });

            const content = new TextDecoder().decode(decryptedContent);
            console.log('Content decrypted successfully with Seal');
            return content;
          } catch (error) {
            console.error('Seal decryption failed:', error);
            throw new Error('Failed to decrypt article content. You may not have permission to read this article.');
          }
        } else {
          // For free articles, return content as-is
          const content = new TextDecoder().decode(rawContent);
          console.log('Free article content loaded');
          
          // Check if content appears to be binary and try decryption if needed
          const isBinary = content.includes('\x00') || content.includes('\uFFFD');
          if (isBinary && currentAccount) {
            console.log('Content appears encrypted, attempting decryption...');
            
            try {
              const sealClient = createSealClient(suiClient, currentAccount);
              
              const credentials = await buildDecryptionCredentials(
                currentAccount.address,
                metadata.publicationId
              );

              const decryptedContent = await sealClient.decryptContent({
                encryptedData: rawContent,
                contentId: metadata.contentId || new TextEncoder().encode(`fallback_${metadata.id}`),
                credentials,
                packageId: process.env.NEXT_PUBLIC_PACKAGE_ID || '',
                requestingClient: suiClient,
              });

              const decryptedText = new TextDecoder().decode(decryptedContent);
              console.log('Successfully decrypted content');
              return decryptedText;
            } catch (decryptionError) {
              console.log('Decryption failed:', decryptionError);
            }
          }
          
          return content;
        }
      } catch (error) {
        console.error('Download/decryption failed:', error);
        throw error;
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
   * Build decryption credentials for the current user
   * Try multiple access methods in order of preference
   */
  const buildDecryptionCredentials = async (
    userAddress: string,
    publicationId: string
  ): Promise<UserCredentials> => {
    const credentials: UserCredentials = {};

    try {
      // 1. Check if user owns the publication (highest priority)
      const ownedObjects = await suiClient.getOwnedObjects({
        owner: userAddress,
        filter: {
          StructType: `${process.env.NEXT_PUBLIC_PACKAGE_ID}::publication::PublicationOwnerCap`,
        },
        options: { showContent: true },
      });

      for (const obj of ownedObjects.data) {
        if (obj.data?.content && 'fields' in obj.data.content) {
          const fields = obj.data.content.fields as Record<string, unknown>;
          if (fields.publication_id === publicationId) {
            credentials.publicationOwner = {
              ownerCapId: obj.data.objectId,
              publicationId,
            };
            break; // Found owner access, this is preferred
          }
        }
      }

      // 2. Check for contributor access
      if (!credentials.publicationOwner) {
        try {
          // Query publication object to check if user is a contributor
          const publicationObj = await suiClient.getObject({
            id: publicationId,
            options: { showContent: true },
          });

          if (publicationObj.data?.content && 'fields' in publicationObj.data.content) {
            const fields = publicationObj.data.content.fields as Record<string, unknown>;
            const contributors = (fields.contributors as { fields?: { contents?: string[] } })?.fields?.contents || [];

            // Check if current user is in contributors list
            const isContributor = contributors.some((addr: string) => addr === userAddress);
            if (isContributor) {
              credentials.contributor = {
                publicationId,
                // contentPolicyId would be set if we had content policies
              };
            }
          }
        } catch (error) {
          console.log('Could not check contributor status:', error);
        }
      }

      // 3. Check for platform subscription (if no owner/contributor access)
      if (!credentials.publicationOwner && !credentials.contributor) {
        try {
          // Look for active platform subscriptions
          const subscriptions = await suiClient.getOwnedObjects({
            owner: userAddress,
            filter: {
              StructType: `${process.env.NEXT_PUBLIC_PACKAGE_ID}::platform_access::PlatformSubscription`,
            },
            options: { showContent: true },
          });

          if (subscriptions.data.length > 0) {
            const subscription = subscriptions.data[0];
            if (subscription.data?.content && 'fields' in subscription.data.content) {
              const fields = subscription.data.content.fields as Record<string, unknown>;
              credentials.subscription = {
                id: subscription.data.objectId,
                serviceId: (fields.service_id as string) || '0x0', // Platform service ID
              };
            }
          }
        } catch (error) {
          console.log('Could not check subscription status:', error);
        }
      }

      // 4. Check for article NFT ownership
      if (!credentials.publicationOwner && !credentials.contributor && !credentials.subscription) {
        try {
          // Look for article NFTs
          const nfts = await suiClient.getOwnedObjects({
            owner: userAddress,
            filter: {
              StructType: `${process.env.NEXT_PUBLIC_PACKAGE_ID}::article_nft::ArticleNFT`,
            },
            options: { showContent: true },
          });

          // Find NFT for this specific article (would need article ID)
          if (nfts.data.length > 0) {
            const nft = nfts.data[0];
            if (nft.data?.content && 'fields' in nft.data.content) {
              const fields = nft.data.content.fields as Record<string, unknown>;
              credentials.nft = {
                id: nft.data.objectId,
                articleId: (fields.article_id as string) || publicationId, // Fallback
              };
            }
          }
        } catch (error) {
          console.log('Could not check NFT ownership:', error);
        }
      }

      console.log('Built decryption credentials:', {
        hasOwner: !!credentials.publicationOwner,
        hasContributor: !!credentials.contributor,
        hasSubscription: !!credentials.subscription,
        hasNFT: !!credentials.nft,
      });

      return credentials;
    } catch (error) {
      console.error('Failed to build credentials:', error);
      return {}; // Return empty credentials if all checks fail
    }
  };

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
    clearError,
    retry,
  };
};