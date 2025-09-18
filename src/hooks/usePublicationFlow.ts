import { useState, useCallback } from 'react';
import { Transaction } from '@mysten/sui/transactions';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { INKRAY_CONFIG } from '@/lib/sui-clients';
import { useEnhancedTransaction, type EnhancedTransactionResult } from './useEnhancedTransaction';

export interface PublicationResult {
  publicationId: string;
  vaultId: string;
  ownerCapId: string;
  transactionDigest: string;
  creatorAddress: string;
}

export interface ContributorResult {
  transactionDigest: string;
  contributorAddress: string;
}

interface PublicationState {
  isCreating: boolean;
  isAddingContributor: boolean;
  error: string | null;
}

/**
 * Hook for managing publication creation and contributor management
 * Adapted from contracts/scripts/src/workflows/publication-flow.ts
 */
export const usePublicationFlow = () => {
  const [state, setState] = useState<PublicationState>({
    isCreating: false,
    isAddingContributor: false,
    error: null,
  });

  const { signAndExecuteTransaction } = useEnhancedTransaction();
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();

  /**
   * Create a new publication
   */
  const createPublication = useCallback(
    async (publicationName: string): Promise<PublicationResult> => {
      if (!currentAccount) {
        throw new Error('Wallet not connected');
      }

      setState(prev => ({ ...prev, isCreating: true, error: null }));

      try {
        console.log('Creating publication:', {
          name: publicationName,
          creator: currentAccount.address,
          packageId: INKRAY_CONFIG.PACKAGE_ID,
        });

        // Build transaction
        const tx = new Transaction();
        const [ownerCap] = tx.moveCall({
          target: `${INKRAY_CONFIG.PACKAGE_ID}::publication::create`,
          arguments: [tx.pure.string(publicationName)],
        });

        // Transfer the owner capability to the caller
        tx.transferObjects([ownerCap], currentAccount.address);

        // Execute transaction
        const result = await new Promise<EnhancedTransactionResult>((resolve, reject) => {
          signAndExecuteTransaction(
            {
              transaction: tx,
            },
            {
              onSuccess: (data) => {
                console.log('Publication creation successful:', data);
                resolve(data);
              },
              onError: (error) => {
                console.error('Publication creation failed:', error);
                reject(error);
              },
            }
          );
        });

        // Extract object IDs from transaction response
        const objectChanges = result.objectChanges || [];

        let publicationId = '';
        let vaultId = '';
        let ownerCapId = '';

        console.log(`Analyzing ${objectChanges.length} object changes...`);

        for (const change of objectChanges) {
          if (change.type === 'created' && change.objectType) {
            const objectType = change.objectType;
            console.log(`Created: ${objectType} -> ${change.objectId}`);

            // Match exact fully qualified type names
            if (objectType === `${INKRAY_CONFIG.PACKAGE_ID}::publication::Publication`) {
              publicationId = change.objectId!;
            } else if (objectType === `${INKRAY_CONFIG.PACKAGE_ID}::vault::PublicationVault`) {
              vaultId = change.objectId!;
            } else if (objectType === `${INKRAY_CONFIG.PACKAGE_ID}::publication::PublicationOwnerCap`) {
              ownerCapId = change.objectId!;
            }
          } else if (change.type === 'transferred' && change.objectType) {
            const objectType = change.objectType;
            if (objectType === `${INKRAY_CONFIG.PACKAGE_ID}::publication::PublicationOwnerCap`) {
              ownerCapId = change.objectId!;
            }
          }
        }

        if (!publicationId || !vaultId || !ownerCapId) {
          throw new Error(`Failed to extract required object IDs: publication=${publicationId}, vault=${vaultId}, ownerCap=${ownerCapId}`);
        }

        const publicationResult: PublicationResult = {
          publicationId,
          vaultId,
          ownerCapId,
          transactionDigest: result.digest,
          creatorAddress: currentAccount.address,
        };

        console.log('Publication created successfully:', publicationResult);
        return publicationResult;

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        setState(prev => ({ ...prev, error: errorMessage }));
        throw error;
      } finally {
        setState(prev => ({ ...prev, isCreating: false }));
      }
    },
    [currentAccount, signAndExecuteTransaction]
  );

  /**
   * Add a contributor to the publication
   */
  const addContributor = useCallback(
    async (
      ownerCapId: string,
      publicationId: string,
      contributorAddress: string
    ): Promise<ContributorResult> => {
      if (!currentAccount) {
        throw new Error('Wallet not connected');
      }

      setState(prev => ({ ...prev, isAddingContributor: true, error: null }));

      try {
        console.log('Adding contributor:', {
          contributor: contributorAddress,
          publication: publicationId,
          owner: currentAccount.address,
        });

        // Build transaction
        const tx = new Transaction();
        tx.moveCall({
          target: `${INKRAY_CONFIG.PACKAGE_ID}::publication::add_contributor`,
          arguments: [
            tx.object(ownerCapId),
            tx.object(publicationId),
            tx.pure.address(contributorAddress),
          ],
        });

        // Execute transaction
        const result = await new Promise<unknown>((resolve, reject) => {
          signAndExecuteTransaction(
            {
              transaction: tx,
            },
            {
              onSuccess: (data) => {
                console.log('Contributor addition successful:', data);
                resolve(data);
              },
              onError: (error) => {
                console.error('Contributor addition failed:', error);
                reject(error);
              },
            }
          );
        });

        const contributorResult: ContributorResult = {
          transactionDigest: (result as { digest: string }).digest,
          contributorAddress,
        };

        console.log('Contributor added successfully:', contributorResult);
        return contributorResult;

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        setState(prev => ({ ...prev, error: errorMessage }));
        throw error;
      } finally {
        setState(prev => ({ ...prev, isAddingContributor: false }));
      }
    },
    [currentAccount, signAndExecuteTransaction]
  );

  /**
   * Get publication information
   */
  const getPublicationInfo = useCallback(
    async (publicationId: string) => {
      try {
        console.log('Getting publication info:', publicationId);

        const publicationObject = await suiClient.getObject({
          id: publicationId,
          options: { showContent: true },
        });

        if (!publicationObject.data) {
          throw new Error('Publication not found');
        }

        console.log('Publication info retrieved:', publicationObject.data);
        return publicationObject.data;
      } catch (error) {
        console.error('Failed to get publication info:', error);
        throw error;
      }
    },
    [suiClient]
  );

  /**
   * Check if user owns any publications
   */
  const getUserPublications = useCallback(
    async (): Promise<string[]> => {
      if (!currentAccount) {
        return [];
      }

      try {
        // Query for PublicationOwnerCap objects owned by the current account
        const ownedObjects = await suiClient.getOwnedObjects({
          owner: currentAccount.address,
          filter: {
            StructType: `${INKRAY_CONFIG.PACKAGE_ID}::publication::PublicationOwnerCap`,
          },
          options: {
            showContent: true,
          },
        });

        console.log(`Found ${ownedObjects.data.length} publication owner caps`);

        // Extract publication IDs from the owner caps
        const publicationIds: string[] = [];
        for (const obj of ownedObjects.data) {
          if (obj.data?.content && 'fields' in obj.data.content) {
            const fields = obj.data.content.fields as Record<string, unknown>;
            if (fields.publication_id) {
              publicationIds.push(fields.publication_id as string);
            }
          }
        }

        return publicationIds;
      } catch (error) {
        console.error('Failed to get user publications:', error);
        return [];
      }
    },
    [currentAccount, suiClient]
  );

  /**
   * Clear any error state
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    // State
    isCreating: state.isCreating,
    isAddingContributor: state.isAddingContributor,
    error: state.error,

    // Actions
    createPublication,
    addContributor,
    getPublicationInfo,
    getUserPublications,
    clearError,
  };
};