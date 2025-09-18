import { useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';

export interface EnhancedTransactionResult {
  digest: string;
  objectChanges?: Array<{
    type: string;
    objectType?: string;
    objectId?: string;
    sender?: string;
    owner?: unknown;
  }>;
  effects?: {
    objectChanges?: Array<{
      type: string;
      objectType?: string;
      objectId?: string;
      sender?: string;
      owner?: unknown;
    }>;
  };
  events?: Array<unknown>;
  rawEffects?: unknown;
}

/**
 * Enhanced transaction hook that captures object changes and effects
 * 
 * This hook wraps the standard useSignAndExecuteTransaction with enhanced options to:
 * - Always capture object changes for result processing
 * - Include raw effects for wallet reporting
 * - Provide consistent transaction execution interface
 * - Better error handling and TypeScript support
 */
export const useEnhancedTransaction = () => {
  const suiClient = useSuiClient();
  
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction({
    execute: async ({ bytes, signature }) =>
      await suiClient.executeTransactionBlock({
        transactionBlock: bytes,
        signature,
        options: {
          // Raw effects are required so the effects can be reported back to the wallet
          showRawEffects: true,
          // Select additional data to return for better result processing
          showObjectChanges: true,
          showEffects: true,
          showEvents: true,
          showInput: false, // Usually not needed, saves bandwidth
          showBalanceChanges: false, // Can be enabled if needed
        },
      }),
  });

  return { 
    signAndExecuteTransaction: (args: {
      transaction: any;
    }, callbacks?: {
      onSuccess?: (result: EnhancedTransactionResult) => void;
      onError?: (error: Error) => void;
    }): void | Promise<EnhancedTransactionResult> => {
      if (callbacks) {
        // Callback pattern - return void
        return signAndExecuteTransaction(args, callbacks);
      } else {
        // Promise pattern - return Promise
        return new Promise<EnhancedTransactionResult>((resolve, reject) => {
          signAndExecuteTransaction(args, {
            onSuccess: (data) => {
              console.log('Enhanced transaction success:', data);
              resolve(data);
            },
            onError: (error) => {
              console.error('Enhanced transaction error:', error);
              reject(error);
            },
          });
        });
      }
    }
  };
};