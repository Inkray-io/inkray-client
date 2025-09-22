import { useState, useCallback } from 'react';
import { useCurrentAccount, useSuiClient, useSignPersonalMessage } from '@mysten/dapp-kit';
import { createSealService, type DecryptionParams } from '@/lib/services/SealService';

export interface UseContentDecryptionReturn {
  decryptContent: (params: DecryptionParams) => Promise<string>;
  isDecrypting: boolean;
  decryptionError: string | null;
  clearError: () => void;
}

/**
 * Hook for decrypting Seal-encrypted content using the unified SealService
 * Handles session key creation, message signing, and content decryption
 */
export const useContentDecryption = (): UseContentDecryptionReturn => {
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptionError, setDecryptionError] = useState<string | null>(null);

  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutate: signPersonalMessage } = useSignPersonalMessage();

  /**
   * Create a Promise wrapper around the callback-based signPersonalMessage
   */
  const signMessage = useCallback((message: Uint8Array): Promise<string> => {
    return new Promise((resolve, reject) => {
      signPersonalMessage(
        { message },
        {
          onSuccess: (result) => {
            resolve(result.signature);
          },
          onError: (error) => {
            reject(new Error(`Failed to sign message: ${error.message || 'Unknown error'}`));
          },
        }
      );
    });
  }, [signPersonalMessage]);

  /**
   * Decrypt content using the SealService
   */
  const decryptContent = useCallback(async (params: DecryptionParams): Promise<string> => {
    if (!currentAccount) {
      throw new Error('Wallet connection required to decrypt content');
    }

    if (!suiClient) {
      throw new Error('Sui client not available');
    }

    setIsDecrypting(true);
    setDecryptionError(null);

    try {
      // Create SealService instance
      const sealService = createSealService(suiClient, currentAccount);

      // Use the service to decrypt content
      const decryptedContent = await sealService.decryptContent(params, signMessage);

      return decryptedContent;
    } catch (error) {
      let errorMessage = 'Failed to decrypt content';

      if (error instanceof Error) {
        if (error.message.includes('key server')) {
          errorMessage = 'Decryption service temporarily unavailable. Please try again later.';
        } else if (error.message.includes('threshold')) {
          errorMessage = 'Insufficient key servers available for decryption.';
        } else if (error.message.includes('session')) {
          errorMessage = 'Authentication failed. Please reconnect your wallet.';
        } else if (error.message.includes('approve_free')) {
          errorMessage = 'Access denied. Content may not support free access.';
        } else if (error.message.includes('sign')) {
          errorMessage = 'Failed to sign authentication message. Please try again.';
        } else {
          errorMessage = error.message;
        }
      }

      setDecryptionError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsDecrypting(false);
    }
  }, [currentAccount, suiClient, signMessage]);

  /**
   * Clear any decryption error
   */
  const clearError = useCallback(() => {
    setDecryptionError(null);
  }, []);

  return {
    decryptContent,
    isDecrypting,
    decryptionError,
    clearError,
  };
};