import { useDAppKit, useCurrentClient } from '@mysten/dapp-kit-react';
import { Transaction } from '@mysten/sui/transactions';
import { fromBase64 } from '@mysten/sui/utils';
import { log } from '@/lib/utils/Logger';

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
 * Enhanced transaction hook that captures object changes and effects.
 *
 * dApp Kit 2.0: we sign with the wallet (`signTransaction`) then execute via
 * the client (`core.executeTransaction`) with explicit include flags. The
 * built-in `signAndExecuteTransaction` action's fixed include omits
 * `objectTypes`, which callers need to find created objects by Move type.
 *
 * The v2 result exposes created objects as `effects.changedObjects`
 * (idOperation 'Created') with types in the `objectTypes` map — mapped here
 * back into the legacy `objectChanges` shape callers expect.
 */
export const useEnhancedTransaction = () => {
  const dAppKit = useDAppKit();
  const client = useCurrentClient();

  const run = async (
    transaction: Transaction,
  ): Promise<EnhancedTransactionResult> => {
    const signed = await dAppKit.signTransaction({ transaction });

    const result = await client.core.executeTransaction({
      transaction: fromBase64(signed.bytes),
      signatures: [signed.signature],
      include: { effects: true, objectTypes: true },
    });

    // v2 result is a discriminated union { Transaction | FailedTransaction }.
    const tx =
      (result as { Transaction?: unknown }).Transaction ??
      (result as { FailedTransaction?: unknown }).FailedTransaction ??
      result;
    const t = tx as {
      digest: string;
      effects?: {
        status?: { success?: boolean; error?: string | null };
        changedObjects?: Array<{ objectId: string; idOperation?: string }>;
      };
      objectTypes?: Record<string, string>;
      events?: unknown[];
      bcs?: unknown;
    };

    if (!t.effects?.status?.success) {
      throw new Error(t.effects?.status?.error || 'Transaction failed');
    }

    const objectTypes = t.objectTypes ?? {};
    const objectChanges = (t.effects?.changedObjects ?? [])
      .filter((c) => c.idOperation === 'Created')
      .map((c) => ({
        type: 'created',
        objectType: objectTypes[c.objectId],
        objectId: c.objectId,
        sender: undefined,
        owner: undefined,
      }));

    return {
      digest: t.digest,
      objectChanges,
      effects: { objectChanges },
      events: t.events ?? [],
      rawEffects: t.bcs,
    };
  };

  return {
    signAndExecuteTransaction: (
      args: { transaction: Transaction },
      callbacks?: {
        onSuccess?: (result: EnhancedTransactionResult) => void;
        onError?: (error: Error) => void;
      },
    ): void | Promise<EnhancedTransactionResult> => {
      if (callbacks) {
        // Callback pattern — return void
        run(args.transaction).then(
          (r) => callbacks.onSuccess?.(r),
          (e) =>
            callbacks.onError?.(e instanceof Error ? e : new Error(String(e))),
        );
        return;
      }
      // Promise pattern
      return run(args.transaction).then((r) => {
        log.debug('Enhanced transaction success', { r }, 'useEnhancedTransaction');
        return r;
      });
    },
  };
};
