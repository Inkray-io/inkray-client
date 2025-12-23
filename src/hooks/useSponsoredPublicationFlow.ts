import { useState, useCallback } from 'react';
import { Transaction } from '@mysten/sui/transactions';
import { useCurrentAccount, useSuiClient, useSignTransaction } from '@mysten/dapp-kit';
import { toBase64 } from '@mysten/sui/utils';
import { INKRAY_CONFIG } from '@/lib/sui-clients';
import { sponsorAPI } from '@/lib/sponsor-api';
import { useAuth } from '@/contexts/AuthContext';
import { log } from '@/lib/utils/Logger';

/**
 * Result of successful sponsored publication creation
 */
export interface SponsoredPublicationResult {
  /** Unique ID of the created publication */
  publicationId: string;
  /** ID of the associated vault for encrypted content */
  vaultId: string;
  /** Owner capability object ID for publication management */
  ownerCapId: string;
  /** Transaction digest of the creation transaction */
  transactionDigest: string;
  /** Address of the publication creator */
  creatorAddress: string;
}

/**
 * Current step in the sponsored transaction flow
 */
export type SponsorStep =
  | 'idle'
  | 'building'
  | 'sponsoring'
  | 'signing'
  | 'executing';

interface SponsoredPublicationState {
  isCreating: boolean;
  error: string | null;
  step: SponsorStep;
}

/**
 * Hook for creating publications with Enoki sponsorship (gasless).
 *
 * This hook handles the full sponsored transaction flow:
 * 1. Build the transaction (onlyTransactionKind)
 * 2. Request sponsorship from backend
 * 3. Get user signature via wallet
 * 4. Execute via backend
 * 5. Parse and return results
 */
export const useSponsoredPublicationFlow = () => {
  const [state, setState] = useState<SponsoredPublicationState>({
    isCreating: false,
    error: null,
    step: 'idle',
  });

  const { isAuthenticated } = useAuth();
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutateAsync: signTransaction } = useSignTransaction();

  /**
   * Create a publication with sponsorship (gasless)
   */
  const createSponsoredPublication = useCallback(
    async (publicationName: string): Promise<SponsoredPublicationResult> => {
      if (!currentAccount) {
        throw new Error('Wallet not connected');
      }

      if (!isAuthenticated) {
        throw new Error('User not authenticated. Please sign in first.');
      }

      setState({ isCreating: true, error: null, step: 'building' });

      try {
        // Step 1: Build the transaction (transaction kind only)
        log.debug(
          'Building publication transaction',
          {
            name: publicationName,
            sender: currentAccount.address,
          },
          'useSponsoredPublicationFlow'
        );

        const tx = new Transaction();
        const [ownerCap] = tx.moveCall({
          target: `${INKRAY_CONFIG.PACKAGE_ID}::publication::create`,
          arguments: [tx.pure.string(publicationName)],
        });
        tx.transferObjects([ownerCap], currentAccount.address);

        // Build with onlyTransactionKind to get just the transaction kind bytes
        const txBytes = await tx.build({
          client: suiClient,
          onlyTransactionKind: true,
        });

        const transactionKindBytes = toBase64(txBytes);

        log.debug(
          'Transaction built',
          {
            bytesLength: transactionKindBytes.length,
          },
          'useSponsoredPublicationFlow'
        );

        // Step 2: Request sponsorship from backend
        setState((prev) => ({ ...prev, step: 'sponsoring' }));

        log.debug(
          'Requesting sponsorship from backend',
          {},
          'useSponsoredPublicationFlow'
        );

        const sponsorResponse = await sponsorAPI.createSponsoredTransaction({
          transactionKindBytes,
          sender: currentAccount.address,
        });

        log.debug(
          'Sponsorship received',
          {
            digest: sponsorResponse.digest,
          },
          'useSponsoredPublicationFlow'
        );

        // Step 3: Sign the transaction
        setState((prev) => ({ ...prev, step: 'signing' }));

        log.debug(
          'Requesting user signature',
          {},
          'useSponsoredPublicationFlow'
        );

        // Create a transaction from the sponsored bytes for signing
        const signResult = await signTransaction({
          transaction: Transaction.from(sponsorResponse.bytes),
        });

        log.debug('Transaction signed', {}, 'useSponsoredPublicationFlow');

        // Step 4: Execute via backend
        setState((prev) => ({ ...prev, step: 'executing' }));

        log.debug(
          'Executing sponsored transaction',
          {
            digest: sponsorResponse.digest,
          },
          'useSponsoredPublicationFlow'
        );

        const executeResponse = await sponsorAPI.executeSponsoredTransaction({
          digest: sponsorResponse.digest,
          signature: signResult.signature,
        });

        log.debug(
          'Transaction executed',
          {
            finalDigest: executeResponse.digest,
          },
          'useSponsoredPublicationFlow'
        );

        // Step 5: Parse results
        const objectChanges = executeResponse.objectChanges || [];
        let publicationId = '';
        let vaultId = '';
        let ownerCapId = '';

        for (const change of objectChanges) {
          if (change.type === 'created' && change.objectType) {
            const objectType = change.objectType;
            if (
              objectType ===
              `${INKRAY_CONFIG.PACKAGE_ID}::publication::Publication`
            ) {
              publicationId = change.objectId!;
            } else if (
              objectType ===
              `${INKRAY_CONFIG.PACKAGE_ID}::vault::PublicationVault`
            ) {
              vaultId = change.objectId!;
            } else if (
              objectType ===
              `${INKRAY_CONFIG.PACKAGE_ID}::publication::PublicationOwnerCap`
            ) {
              ownerCapId = change.objectId!;
            }
          }
        }

        if (!publicationId || !vaultId || !ownerCapId) {
          throw new Error(
            `Failed to extract object IDs: publication=${publicationId}, vault=${vaultId}, ownerCap=${ownerCapId}`
          );
        }

        const result: SponsoredPublicationResult = {
          publicationId,
          vaultId,
          ownerCapId,
          transactionDigest: executeResponse.digest,
          creatorAddress: currentAccount.address,
        };

        log.debug(
          'Sponsored publication created successfully',
          result,
          'useSponsoredPublicationFlow'
        );

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        log.error(
          'Sponsored publication creation failed',
          { error },
          'useSponsoredPublicationFlow'
        );
        setState((prev) => ({ ...prev, error: errorMessage }));
        throw error;
      } finally {
        setState((prev) => ({ ...prev, isCreating: false, step: 'idle' }));
      }
    },
    [currentAccount, isAuthenticated, suiClient, signTransaction]
  );

  /**
   * Clear any error state
   */
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    // State
    isCreating: state.isCreating,
    error: state.error,
    step: state.step,

    // Actions
    createSponsoredPublication,
    clearError,
  };
};
