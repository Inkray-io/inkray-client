import { useState, useCallback } from 'react';
import { Transaction } from '@mysten/sui/transactions';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { createSealClient } from '@/lib/seal-client';
import { createWalrusClient } from '@/lib/walrus-client';
import { generateArticleSlug, INKRAY_CONFIG } from '@/lib/sui-clients';
import { useEnhancedTransaction } from './useEnhancedTransaction';

export interface ArticleCreationState {
  isEncrypting: boolean;
  isUploading: boolean;
  isPublishing: boolean;
  uploadProgress: number;
  error: string | null;
}

export interface ArticleUploadResult {
  articleId: string;
  contentId: Uint8Array;
  blobId: string;
  slug: string;
  encryptedSize: number;
  originalSize: number;
  transactionDigest: string;
}

interface PublicationInfo {
  publicationId: string;
  vaultId: string;
  ownerCapId: string;
  name: string;
}

interface UserRole {
  isOwner: boolean;
  isContributor: boolean;
  ownerCapId?: string;
}

/**
 * Hook for article creation with encryption and upload
 * Adapted from contracts/scripts/src/workflows/article-upload-flow.ts
 */
export const useArticleCreation = () => {
  const [state, setState] = useState<ArticleCreationState>({
    isEncrypting: false,
    isUploading: false,
    isPublishing: false,
    uploadProgress: 0,
    error: null,
  });

  const { signAndExecuteTransaction } = useEnhancedTransaction();
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();

  /**
   * Check user's role in a publication (owner, contributor, or neither)
   */
  const getUserRoleInPublication = useCallback(async (publicationId: string): Promise<UserRole> => {
    if (!currentAccount) {
      return { isOwner: false, isContributor: false };
    }

    try {
      // 1. Check if user owns a PublicationOwnerCap for this publication
      const ownedObjects = await suiClient.getOwnedObjects({
        owner: currentAccount.address,
        filter: {
          StructType: `${INKRAY_CONFIG.PACKAGE_ID}::publication::PublicationOwnerCap`,
        },
        options: { showContent: true },
      });

      let ownerCapId: string | undefined;
      let isOwner = false;

      for (const obj of ownedObjects.data) {
        if (obj.data?.content && 'fields' in obj.data.content) {
          const fields = obj.data.content.fields as Record<string, unknown>;
          if (fields.publication_id === publicationId) {
            isOwner = true;
            ownerCapId = obj.data.objectId;
            break;
          }
        }
      }

      // 2. If not owner, check if user is a contributor
      let isContributor = false;
      if (!isOwner) {
        const publicationObject = await suiClient.getObject({
          id: publicationId,
          options: { showContent: true },
        });

        if (publicationObject.data?.content && 'fields' in publicationObject.data.content) {
          const pubFields = publicationObject.data.content.fields as Record<string, unknown>;
          const contributors = pubFields.contributors as string[] || [];
          isContributor = contributors.includes(currentAccount.address);
        }
      }

      return {
        isOwner,
        isContributor,
        ownerCapId,
      };
    } catch (error) {
      console.error('Failed to check user role:', error);
      return { isOwner: false, isContributor: false };
    }
  }, [currentAccount, suiClient]);

  /**
   * Get user's publication info from localStorage or query blockchain
   */
  const getUserPublication = useCallback(async (): Promise<PublicationInfo | null> => {
    // First try localStorage
    const stored = localStorage.getItem('inkray-user-publication');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.error('Failed to parse stored publication:', error);
      }
    }

    // If not in localStorage, query blockchain
    if (!currentAccount) return null;

    try {
      const ownedObjects = await suiClient.getOwnedObjects({
        owner: currentAccount.address,
        filter: {
          StructType: `${INKRAY_CONFIG.PACKAGE_ID}::publication::PublicationOwnerCap`,
        },
        options: { showContent: true },
      });

      if (ownedObjects.data.length > 0) {
        const ownerCap = ownedObjects.data[0];
        if (ownerCap.data?.content && 'fields' in ownerCap.data.content) {
          const fields = ownerCap.data.content.fields as Record<string, unknown>;

          // Debug: Log the actual fields from PublicationOwnerCap
          console.log('🔍 Debug: PublicationOwnerCap fields:', fields);

          const publicationId = fields.publication_id as string;
          if (!publicationId) {
            throw new Error('PublicationOwnerCap missing publication_id field');
          }

          // Query the Publication object to get the vault_id
          console.log('🔍 Debug: Querying Publication object for vault_id...');
          const publicationObject = await suiClient.getObject({
            id: publicationId,
            options: { showContent: true },
          });

          if (!publicationObject.data?.content || !('fields' in publicationObject.data.content)) {
            throw new Error(`Publication object not found or invalid: ${publicationId}`);
          }

          const pubFields = publicationObject.data.content.fields as Record<string, unknown>;
          console.log('🔍 Debug: Publication object fields:', pubFields);

          const publicationInfo = {
            publicationId: publicationId,
            vaultId: (pubFields.vault_id as string) || '',
            ownerCapId: ownerCap.data.objectId,
            name: (pubFields.name as string) || 'My Publication',
          };

          console.log('🔍 Debug: Final publication info:', publicationInfo);

          if (!publicationInfo.vaultId) {
            throw new Error(`Publication is missing vault_id: ${JSON.stringify(pubFields)}`);
          }

          return publicationInfo;
        }
      }
    } catch (error) {
      console.error('Failed to query user publications:', error);
    }

    return null;
  }, [currentAccount, suiClient]);

  /**
   * Create and publish an article with encryption
   */
  const createAndPublishArticle = useCallback(
    async (
      title: string,
      content: string,
      isGated: boolean = false // For now, all articles are free (false)
    ): Promise<ArticleUploadResult> => {
      if (!currentAccount) {
        throw new Error('Wallet not connected');
      }

      setState(prev => ({ ...prev, error: null }));

      try {
        // 1. Get user's publication
        const publication = await getUserPublication();
        if (!publication) {
          throw new Error('No publication found. Please create a publication first.');
        }

        // 2. Check user's role in the publication
        const userRole = await getUserRoleInPublication(publication.publicationId);
        if (!userRole.isOwner && !userRole.isContributor) {
          throw new Error('You are not authorized to publish articles in this publication. You must be either the owner or a contributor.');
        }

        console.log('Publishing article:', {
          title,
          contentLength: content.length,
          publication: publication.name,
          userRole: userRole.isOwner ? 'owner' : 'contributor',
          isGated,
        });

        // 2. Generate slug and content analysis
        const slug = generateArticleSlug(title);

        // === CONTENT ANALYSIS LOGGING ===
        console.log('📝 Content Analysis:');
        console.log(`  Original content length: ${content.length} chars`);
        console.log(`  Content preview: "${content.substring(0, 100).replace(/\n/g, '\\n')}${content.length > 100 ? '...' : ''}"`);
        console.log(`  Contains HTML: ${/<[^>]*>/.test(content)}`);
        console.log(`  Contains base64: ${/data:[a-zA-Z]+\/[a-zA-Z]+;base64,/.test(content)}`);
        console.log(`  Contains binary chars: ${/[\x00-\x08\x0E-\x1F\x7F]/.test(content)}`);

        const contentBytes = new TextEncoder().encode(content);
        const originalSize = contentBytes.length;
        console.log(`  After UTF-8 encoding: ${originalSize} bytes`);

        // 3. Encrypt content (if gated) or prepare for upload
        setState(prev => ({ ...prev, isEncrypting: true }));

        let contentToUpload: Uint8Array;
        let contentId: Uint8Array;

        if (isGated) {
          const sealClient = createSealClient(suiClient, currentAccount);

          // Generate BCS-encoded IdV1 content ID using publication ID and title
          contentId = sealClient.generateArticleContentId(publication.publicationId, title);

          // Encrypt content using the content-identity based encryption
          contentToUpload = await sealClient.encryptContent(contentBytes, {
            contentId, // BCS-encoded Uint8Array
            packageId: INKRAY_CONFIG.PACKAGE_ID,
            threshold: 2, // Require 2 key servers for decryption
          });

          console.log('Content encrypted with Seal:', {
            originalSize: contentBytes.length,
            encryptedSize: contentToUpload.length,
            contentIdLength: contentId.length,
          });
        } else {
          // For free articles, use plain content and a simple content ID
          contentToUpload = contentBytes;
          contentId = new TextEncoder().encode(`free_article_${slug}_${Date.now()}`);
        }

        const encryptedSize = contentToUpload.length;
        setState(prev => ({ ...prev, isEncrypting: false, isUploading: true }));

        // === FINAL UPLOAD CONTENT ANALYSIS ===
        console.log('🚀 Final Upload Content:');
        console.log(`  Processing: ${originalSize} bytes → ${encryptedSize} bytes`);
        console.log(`  Content type: ${isGated ? 'Encrypted' : 'Plain text'}`);
        console.log(`  First 50 bytes as hex: ${Array.from(contentToUpload.slice(0, 50)).map(b => b.toString(16).padStart(2, '0')).join(' ')}`);
        console.log(`  Appears to be binary: ${contentToUpload.some(b => b < 32 && b !== 10 && b !== 13 && b !== 9)}`);
        console.log('=====================================');

        // 4. Upload to Walrus
        // Create wrapper function that returns the correct format
        const walrusSignAndExecute = async (args: { transaction: unknown }) => {
          console.log('🔐 Executing transaction for Walrus...');
          const result = await signAndExecuteTransaction({ transaction: args.transaction as Transaction });
          console.log('✅ Transaction result:', result);

          if (!result?.digest) {
            console.error('❌ No digest in transaction result:', result);
            throw new Error('Transaction failed: No digest returned');
          }

          return { digest: result.digest };
        };

        const walrusClient = createWalrusClient(suiClient, currentAccount, walrusSignAndExecute);
        const filename = `${isGated ? 'encrypted' : 'article'}_${slug}_${Date.now()}.md`;

        const walrusResult = await walrusClient.uploadBlob(contentToUpload, filename, {
          epochs: 1, // Reduced to minimize cost
          onProgress: (step, progress) => {
            // Convert step progress to overall progress (each step is 25% of upload)
            const stepWeights = { encode: 0.1, register: 0.3, upload: 0.4, certify: 0.2 };
            const stepOffsets = { encode: 0, register: 10, upload: 40, certify: 80 };
            const overallProgress = stepOffsets[step] + (progress * stepWeights[step] * 100);
            setState(prev => ({ ...prev, uploadProgress: Math.round(overallProgress) }));
          }
        });

        setState(prev => ({
          ...prev,
          isUploading: false,
          isPublishing: true,
          uploadProgress: 100
        }));

        console.log('Walrus upload successful:', {
          blobId: walrusResult.blobId,
          size: walrusResult.size,
        });

        // Debug: Log all object IDs before using them in transaction
        console.log('🔍 Debug: Object IDs for smart contract:', {
          ownerCapId: publication.ownerCapId,
          publicationId: publication.publicationId,
          vaultId: publication.vaultId,
          walrusBlobObjectId: walrusResult.blobObjectId,
          contentIdLength: contentId.length,
        });

        // Validate all required object IDs
        const requiredObjects = {
          ownerCapId: publication.ownerCapId,
          publicationId: publication.publicationId,
          vaultId: publication.vaultId,
          walrusBlobObjectId: walrusResult.blobObjectId,
        };

        for (const [name, objectId] of Object.entries(requiredObjects)) {
          if (!objectId || objectId === '0x0000000000000000000000000000000000000000000000000000000000000000') {
            throw new Error(`Invalid ${name}: ${objectId}. Cannot proceed with article creation.`);
          }
        }

        // 5. Create article on blockchain using correct smart contract API
        const tx = new Transaction();

        // Step 5.1: Create Access enum (gated or free)  
        console.log(`Creating Access enum (${isGated ? 'gated' : 'free'})...`);
        const gatingAccess = tx.moveCall({
          target: `${INKRAY_CONFIG.PACKAGE_ID}::vault::${isGated ? 'access_gated' : 'access_free'}`,
          arguments: [],
        });

        // Step 5.2: Create empty vector for additional asset blobs
        console.log('Creating empty blob vector...');
        const emptyBlobsVec = tx.moveCall({
          target: `${INKRAY_CONFIG.PACKAGE_ID}::vault::empty_blob_vector`,
          arguments: [],
        });

        // Step 5.3: Create Article using role-appropriate function
        const articleFunction = userRole.isOwner ? 'post_as_owner' : 'post';
        console.log(`Creating Article object using ${articleFunction}...`);

        let article;
        if (userRole.isOwner) {
          // Owner version: requires owner capability
          article = tx.moveCall({
            target: `${INKRAY_CONFIG.PACKAGE_ID}::articles::post_as_owner`,
            arguments: [
              tx.object(userRole.ownerCapId!),       // &PublicationOwnerCap
              tx.object(publication.publicationId),  // &Publication
              tx.object(publication.vaultId),        // &mut PublicationVault
              tx.pure.string(title),                 // String title
              gatingAccess,                          // Access enum
              tx.object(walrusResult.blobObjectId),  // walrus::blob::Blob (body)
              emptyBlobsVec,                         // vector<walrus::blob::Blob> (assets)
            ],
          });
        } else {
          // Contributor version: no owner capability needed
          article = tx.moveCall({
            target: `${INKRAY_CONFIG.PACKAGE_ID}::articles::post`,
            arguments: [
              tx.object(publication.publicationId),  // &Publication
              tx.object(publication.vaultId),        // &mut PublicationVault
              tx.pure.string(title),                 // String title
              gatingAccess,                          // Access enum
              tx.object(walrusResult.blobObjectId),  // walrus::blob::Blob (body)
              emptyBlobsVec,                         // vector<walrus::blob::Blob> (assets)
            ],
          });
        }

        // Step 5.4: Transfer Article to sender  
        console.log('Transferring Article to sender...');
        tx.transferObjects([article], currentAccount.address);

        // Execute transaction
        const result = await signAndExecuteTransaction(
          {
            transaction: tx,
          },
          {
            onSuccess: (data) => {
              console.log('Article creation successful:', data);
            },
            onError: (error) => {
              console.error('Article creation failed:', error);
              throw error;
            },
          }
        );

        // Extract article ID from transaction effects
        console.log('🔍 Debug: Transaction result:', result);
        const resultWithEffects = result as { effects?: { objectChanges?: Array<{ type: string; objectType?: string; objectId?: string }> } };
        const objectChanges = resultWithEffects.effects?.objectChanges || [];
        let articleId = '';

        console.log('🔍 Debug: Looking for Article object in changes...');

        for (const change of objectChanges) {
          console.log(`🔍 Debug: Change type=${change.type}, objectType=${change.objectType}`);

          // Look for the exact Article type
          if (change.type === 'created' &&
            change.objectType === `${INKRAY_CONFIG.PACKAGE_ID}::articles::Article`) {
            articleId = change.objectId!;
            console.log('✅ Found Article object:', articleId);
            break;
          }
        }

        if (!articleId) {
          console.error('❌ No Article object found in transaction changes');
          console.log('Available object types:', objectChanges.map(c => c.objectType));
          throw new Error('Failed to extract article ID from transaction');
        }

        const uploadResult: ArticleUploadResult = {
          articleId,
          contentId,
          blobId: walrusResult.blobId,
          slug,
          encryptedSize,
          originalSize,
          transactionDigest: result.digest,
        };

        console.log('Article published successfully:', uploadResult);
        return uploadResult;

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        setState(prev => ({ ...prev, error: errorMessage }));
        throw error;
      } finally {
        setState(prev => ({
          ...prev,
          isEncrypting: false,
          isUploading: false,
          isPublishing: false,
        }));
      }
    },
    [currentAccount, suiClient, signAndExecuteTransaction, getUserPublication, getUserRoleInPublication]
  );


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
      isEncrypting: false,
      isUploading: false,
      isPublishing: false,
      uploadProgress: 0,
      error: null,
    });
  }, []);

  return {
    // State
    ...state,
    isProcessing: state.isEncrypting || state.isUploading || state.isPublishing,

    // Actions
    createAndPublishArticle,
    getUserPublication,
    getUserRoleInPublication,
    clearError,
    reset,
  };
};