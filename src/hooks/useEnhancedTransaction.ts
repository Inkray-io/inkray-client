import { useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';

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
      transaction: Transaction;
    }, callbacks?: {
      onSuccess?: (result: EnhancedTransactionResult) => void;
      onError?: (error: Error) => void;
    }): void | Promise<EnhancedTransactionResult> => {
      if (callbacks) {
        // Callback pattern - return void
        return signAndExecuteTransaction(args, {
          onSuccess: (data) => {
            const enhancedResult: EnhancedTransactionResult = {
              digest: data.digest,
              objectChanges: data.objectChanges?.map(change => ({
                type: change.type,
                objectType: 'objectType' in change ? change.objectType : undefined,
                objectId: 'objectId' in change ? change.objectId : undefined,
                sender: 'sender' in change ? change.sender : undefined,
                owner: 'owner' in change ? change.owner : undefined,
              })) || [],
              effects: data.effects ? {
                objectChanges: data.effects.created?.map((created: { objectType?: string; objectId?: string; sender?: string; owner?: unknown }) => ({
                  type: 'created',
                  objectType: created.objectType,
                  objectId: created.objectId,
                  sender: created.sender,
                  owner: created.owner,
                })) || []
              } : undefined,
              events: data.events || [],
              rawEffects: data.rawEffects || undefined
            };
            callbacks.onSuccess?.(enhancedResult);
          },
          onError: callbacks.onError
        });
      } else {
        // Promise pattern - return Promise
        return new Promise<EnhancedTransactionResult>((resolve, reject) => {
          signAndExecuteTransaction(args, {
            onSuccess: (data) => {
              console.log('Enhanced transaction success:', data);
              const enhancedResult: EnhancedTransactionResult = {
                digest: data.digest,
                objectChanges: data.objectChanges?.map(change => ({
                  type: change.type,
                  objectType: 'objectType' in change ? change.objectType : undefined,
                  objectId: 'objectId' in change ? change.objectId : undefined,
                  sender: 'sender' in change ? change.sender : undefined,
                  owner: 'owner' in change ? change.owner : undefined,
                })) || [],
                effects: data.effects ? {
                  objectChanges: data.effects.created?.map((created: { objectType?: string; objectId?: string; sender?: string; owner?: unknown }) => ({
                    type: 'created',
                    objectType: created.objectType,
                    objectId: created.objectId,
                    sender: created.sender,
                    owner: created.owner,
                  })) || []
                } : undefined,
                events: data.events || [],
                rawEffects: data.rawEffects || undefined
              };
              resolve(enhancedResult);
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