"use client";

import { useState } from "react";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { useEnhancedTransaction } from "@/hooks/useEnhancedTransaction";
import { ConnectButton } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { INKRAY_CONFIG } from "@/lib/sui-clients";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { log } from "@/lib/utils/Logger";

interface MintButtonProps {
  articleId: string;
  articleTitle: string;
  onMintSuccess?: () => void;
}

export function MintButton({ articleId, onMintSuccess }: MintButtonProps) {
  const { isConnected, account } = useWalletConnection();
  const { signAndExecuteTransaction } = useEnhancedTransaction();
  const [isMinting, setIsMinting] = useState(false);
  const [mintError, setMintError] = useState<string | null>(null);

  const handleMint = async () => {
    if (!isConnected || !account) {
      // Will be handled by showing ConnectButton instead
      return;
    }

    try {
      setIsMinting(true);
      setMintError(null);

      log.debug("Starting NFT mint transaction", {
        articleId,
        userAddress: account.address,
        packageId: INKRAY_CONFIG.PACKAGE_ID,
      }, "MintButton");

      // Build NFT mint transaction
      const tx = new Transaction();
      
      // Reference article object directly by ID
      const article = tx.object(articleId);
      
      // Get MintConfig shared object ID from configuration
      const mintConfig = tx.object(INKRAY_CONFIG.NFT_MINT_CONFIG_ID);
      
      // Create zero payment coin since minting is free
      const [coin] = tx.splitCoins(tx.gas, [0]);
      
      // Call NFT mint function
      const [nft] = tx.moveCall({
        target: `${INKRAY_CONFIG.PACKAGE_ID}::nft::mint`,
        arguments: [
          tx.pure.address(account.address), // recipient
          article,                          // article reference
          mintConfig,                       // mint config
          coin,                            // payment (zero SUI)
        ],
      });

      // Transfer NFT to user
      tx.transferObjects([nft], account.address);

      // Execute transaction
      const result = await signAndExecuteTransaction({
        transaction: tx,
      });

      log.debug("NFT mint successful", { result }, "MintButton");

      // On successful mint, call the success callback
      onMintSuccess?.();

    } catch (error) {
      log.error("Error minting NFT", { error }, "MintButton");
      setMintError(error instanceof Error ? error.message : "Failed to mint NFT. Please try again.");
    } finally {
      setIsMinting(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="w-full">
        <ConnectButton />
      </div>
    );
  }

  return (
    <div className="relative flex flex-col">
      <button
        onClick={handleMint}
        disabled={isMinting}
        className={cn(
          "w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200",
          isMinting 
            ? "bg-gray-50 text-gray-400 cursor-not-allowed"
            : "bg-blue-50 text-primary hover:bg-blue-100"
        )}
      >
        {isMinting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Minting...
          </>
        ) : (
          "Mint"
        )}
      </button>

      {mintError && (
        <div className="mt-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
          {mintError}
        </div>
      )}
    </div>
  );
}