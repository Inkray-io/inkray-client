import { useState } from 'react';
import { useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useWalletConnection } from '@/hooks/useWalletConnection';
import { log } from '@/lib/utils/Logger';

interface UseArticleDeletionProps {
  onSuccess?: (articleId: string) => void;
  onError?: (error: string, articleId: string) => void;
}

interface ArticleDeletionData {
  articleId: string;
  publicationId: string;
  vaultId: string;
}

export const useArticleDeletion = ({ onSuccess, onError }: UseArticleDeletionProps = {}) => {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const suiClient = useSuiClient();
  const { address } = useWalletConnection();

  const deleteArticle = async (deletionData: ArticleDeletionData) => {
    const { articleId, publicationId, vaultId } = deletionData;

    if (!process.env.NEXT_PUBLIC_PACKAGE_ID) {
      const error = 'Package ID not configured';
      log.error('Article deletion failed: Package ID not configured', {}, 'useArticleDeletion');
      onError?.(error, articleId);
      return;
    }

    if (!process.env.NEXT_PUBLIC_WALRUS_SYSTEM_OBJECT_ID) {
      const error = 'Walrus System Object ID not configured';
      log.error('Article deletion failed: Walrus System Object ID not configured', {}, 'useArticleDeletion');
      onError?.(error, articleId);
      return;
    }

    try {
      setIsDeleting(articleId);
      log.debug('Starting article deletion', { articleId, publicationId, vaultId }, 'useArticleDeletion');

      // Check if wallet is connected
      if (!address) {
        throw new Error('Wallet not connected');
      }

      // Find the PublicationOwnerCap for this publication
      const ownedObjects = await suiClient.getOwnedObjects({
        owner: address,
        filter: {
          StructType: `${process.env.NEXT_PUBLIC_PACKAGE_ID}::publication::PublicationOwnerCap`
        },
        options: {
          showContent: true,
          showType: true,
        }
      });
      console.log(ownedObjects.data)
      const ownerCap = ownedObjects.data.find((obj) => {
        const content = obj.data?.content;
        if (content && 'fields' in content) {
          const fields = content.fields as { publication_id: string };
          return fields.publication_id === publicationId;
        }
        return false;
      });

      if (!ownerCap) {
        throw new Error('You do not own this publication');
      }

      // Create transaction for article deletion
      const txb = new Transaction();

      // Call delete_article function
      txb.moveCall({
        target: `${process.env.NEXT_PUBLIC_PACKAGE_ID}::articles::delete_article`,
        arguments: [
          txb.object(ownerCap.data!.objectId), // PublicationOwnerCap
          txb.object(publicationId), // Publication object
          txb.object(vaultId), // PublicationVault object
          txb.object(articleId), // Article object to delete
          txb.object(process.env.NEXT_PUBLIC_WALRUS_SYSTEM_OBJECT_ID), // Walrus System object
        ],
      });

      log.debug('Executing article deletion transaction', {
        ownerCapId: ownerCap.data!.objectId,
        publicationId,
        vaultId,
        articleId
      }, 'useArticleDeletion');

      // Sign and execute the transaction
      signAndExecute(
        {
          transaction: txb,
        },
        {
          onSuccess: (result) => {
            log.debug('Article deletion successful', {
              digest: result.digest,
              articleId
            }, 'useArticleDeletion');

            setIsDeleting(null);
            onSuccess?.(articleId);
          },
          onError: (error) => {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error during deletion';
            log.error('Article deletion transaction failed', {
              error: errorMessage,
              articleId
            }, 'useArticleDeletion');

            setIsDeleting(null);
            onError?.(errorMessage, articleId);
          },
        }
      );

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log.error('Article deletion failed', {
        error: errorMessage,
        articleId
      }, 'useArticleDeletion');

      setIsDeleting(null);
      onError?.(errorMessage, articleId);
    }
  };

  return {
    deleteArticle,
    isDeleting,
    isDeletingArticle: (articleId: string) => isDeleting === articleId,
  };
};