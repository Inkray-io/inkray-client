import { useState } from 'react';
import { api } from '@/lib/api-client';
import { useWalletConnection } from '@/hooks/useWalletConnection';
import { log } from '@/lib/utils/Logger';

interface UseArticleDeletionProps {
  onSuccess?: (articleId: string) => void;
  onError?: (error: string, articleId: string) => void;
}

interface ArticleDeletionData {
  articleId: string;
  // Kept for call-site compatibility; no longer needed now that deletion is a
  // server-side hide rather than an on-chain transaction.
  publicationId?: string;
  vaultId?: string;
}

/**
 * Deletes ("hides") an article via the backend.
 *
 * Previously this signed an on-chain `delete_article` transaction with the
 * user's wallet. That destroyed the on-chain Article/Blob objects and refunded
 * the Sui storage rebate — which the PLATFORM paid at publish time — to the
 * user, an exploitable fund drain. Deletion is now a server-side soft-delete:
 * the article is hidden from every surface, no transaction is made, and there
 * is nothing to extract.
 */
export const useArticleDeletion = ({ onSuccess, onError }: UseArticleDeletionProps = {}) => {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const { address } = useWalletConnection();

  const deleteArticle = async (deletionData: ArticleDeletionData) => {
    const { articleId } = deletionData;

    try {
      setIsDeleting(articleId);
      log.debug('Starting article deletion (soft-delete)', { articleId }, 'useArticleDeletion');

      if (!address) {
        throw new Error('Wallet not connected');
      }

      await api.articles.delete(articleId);

      log.debug('Article deletion successful', { articleId }, 'useArticleDeletion');
      setIsDeleting(null);
      onSuccess?.(articleId);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error during deletion';
      log.error('Article deletion failed', { error: errorMessage, articleId }, 'useArticleDeletion');
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
