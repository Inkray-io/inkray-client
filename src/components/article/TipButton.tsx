"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { useEnhancedTransaction } from "@/hooks/useEnhancedTransaction";
import { Transaction } from "@mysten/sui/transactions";
import { INKRAY_CONFIG } from "@/lib/sui-clients";
import { Heart, Loader2, Wallet } from "lucide-react";
import { TIP_AMOUNTS, MIST_PER_SUI } from "@/constants/tipping";

interface TipButtonProps {
  articleId: string;
  publicationId: string;
  articleTitle: string;
  onTipSuccess?: () => void;
}

export function TipButton({ articleId, publicationId, articleTitle, onTipSuccess }: TipButtonProps) {
  const { isConnected, connect, account } = useWalletConnection();
  const { signAndExecuteTransaction } = useEnhancedTransaction();
  const [isOpen, setIsOpen] = useState(false);
  const [isTipping, setIsTipping] = useState(false);
  const [tipError, setTipError] = useState<string | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");

  const handleTip = async (amount: number) => {
    if (!isConnected || !account) {
      connect();
      return;
    }

    try {
      setIsTipping(true);
      setTipError(null);

      // Starting article tip transaction

      // Build tip transaction
      const tx = new Transaction();
      
      // Reference article and publication objects
      const article = tx.object(articleId);
      const publication = tx.object(publicationId);
      
      // Create payment coin
      const [coin] = tx.splitCoins(tx.gas, [amount]);
      
      // Call tip_article function with embedded treasury
      // Tips are stored directly in the publication object (embedded treasury)
      tx.moveCall({
        target: `${INKRAY_CONFIG.PACKAGE_ID}::platform_economics::tip_article`,
        arguments: [
          article,      // &Article - article being tipped
          publication,  // &mut Publication - publication with embedded treasury
          coin,         // Coin<SUI> - payment amount
        ],
      });

      // Execute transaction
      const result = await signAndExecuteTransaction({
        transaction: tx,
      });

      console.log("Tip successful:", result);
      
      // Close dialog and call success callback
      setIsOpen(false);
      onTipSuccess?.();
      
    } catch (error) {
      // Handle tip transaction error
      setTipError(error instanceof Error ? error.message : "Failed to tip. Please try again.");
    } finally {
      setIsTipping(false);
    }
  };

  const handleCustomTip = () => {
    const amount = parseFloat(customAmount);
    if (isNaN(amount) || amount <= 0) {
      setTipError("Please enter a valid amount");
      return;
    }
    
    // Convert SUI to MIST using constant
    const amountInMist = Math.floor(amount * MIST_PER_SUI);
    handleTip(amountInMist);
  };

  if (!isConnected) {
    return (
      <Button 
        onClick={() => connect()}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <Wallet className="w-4 h-4" />
        Connect to Tip
      </Button>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 text-red-600 border-red-200 hover:bg-red-50">
          <Heart className="w-4 h-4" />
          Tip Article
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">Tip This Article</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Send a tip to support "{articleTitle}"
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preset amounts */}
          <div>
            <h4 className="text-sm font-medium mb-3">Choose an amount:</h4>
            <div className="grid grid-cols-2 gap-2">
              {TIP_AMOUNTS.map((tip) => (
                <Button
                  key={tip.value}
                  variant={selectedAmount === tip.value ? "default" : "outline"}
                  onClick={() => {
                    setSelectedAmount(tip.value);
                    setCustomAmount("");
                    handleTip(tip.value);
                  }}
                  disabled={isTipping}
                  className="justify-center"
                >
                  {isTipping && selectedAmount === tip.value ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    tip.label
                  )}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom amount */}
          <div>
            <h4 className="text-sm font-medium mb-2">Or enter custom amount:</h4>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  placeholder="0.0"
                  step="0.1"
                  min="0"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  disabled={isTipping}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  SUI
                </span>
              </div>
              <Button
                onClick={handleCustomTip}
                disabled={isTipping || !customAmount || parseFloat(customAmount) <= 0}
                className="px-4"
              >
                {isTipping && !selectedAmount ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Tip"
                )}
              </Button>
            </div>
          </div>

          {/* Error display */}
          {tipError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
              {tipError}
            </div>
          )}

          {/* Info */}
          <div className="text-xs text-muted-foreground space-y-1 border-t pt-3">
            <p>• Tips go directly to the publication owner</p>
            <p>• Transaction will be processed on the Sui blockchain</p>
            <p>• Your tip helps support content creators</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}