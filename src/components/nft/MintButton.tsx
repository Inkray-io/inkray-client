"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { useEnhancedTransaction } from "@/hooks/useEnhancedTransaction";
import { ConnectButton } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { INKRAY_CONFIG } from "@/lib/sui-clients";
import { Coins, Loader2 } from "lucide-react";

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

      console.log("Starting NFT mint transaction:", {
        articleId,
        userAddress: account.address,
        packageId: INKRAY_CONFIG.PACKAGE_ID,
      });

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

      console.log("NFT mint successful:", result);
      
      // On successful mint, call the success callback
      onMintSuccess?.();
      
    } catch (error) {
      console.error("Error minting NFT:", error);
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
    <div className="space-y-3">
      <Button 
        onClick={handleMint}
        disabled={isMinting}
        className="w-full gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
        size="lg"
      >
        {isMinting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Minting NFT...
          </>
        ) : (
          <>
            <Coins className="w-4 h-4" />
            Mint NFT (Free)
          </>
        )}
      </Button>

      {mintError && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
          {mintError}
        </div>
      )}

      <div className="text-xs text-gray-500 space-y-1">
        <p>• Mint this article as an NFT for permanent access</p>
        <p>• NFT minting is completely free</p>
        <p>• You&apos;ll own a unique collectible</p>
      </div>
    </div>
  );
}