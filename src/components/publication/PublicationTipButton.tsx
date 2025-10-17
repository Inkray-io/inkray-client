"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { useEnhancedTransaction } from "@/hooks/useEnhancedTransaction";
import { Transaction } from "@mysten/sui/transactions";
import { INKRAY_CONFIG } from "@/lib/sui-clients";
import { Heart, Loader2 } from "lucide-react";
import { ConnectButton } from "@mysten/dapp-kit";
import { TIP_AMOUNTS, MIST_PER_SUI } from "@/constants/tipping";
import { cn } from "@/lib/utils";

interface PublicationTipButtonProps {
  publicationId: string;
  publicationName: string;
  onTipSuccess?: () => void;
}

export function PublicationTipButton({ 
  publicationId, 
  publicationName, 
  onTipSuccess
}: PublicationTipButtonProps) {
  const { isConnected, account } = useWalletConnection();
  const { signAndExecuteTransaction } = useEnhancedTransaction();
  const [isOpen, setIsOpen] = useState(false);
  const [isTipping, setIsTipping] = useState(false);
  const [tipError, setTipError] = useState<string | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");

  const handleTip = async (amount: number) => {
    if (!isConnected || !account) {
      // Will be handled by showing ConnectButton instead
      return;
    }

    try {
      setIsTipping(true);
      setTipError(null);

      // Starting publication tip transaction

      // Build tip transaction
      const tx = new Transaction();
      
      // Reference publication object
      const publication = tx.object(publicationId);
      
      // Create payment coin
      const [coin] = tx.splitCoins(tx.gas, [amount]);
      
      // Call tip_publication function with embedded treasury
      // Tips are stored directly in the publication object (embedded treasury)
      tx.moveCall({
        target: `${INKRAY_CONFIG.PACKAGE_ID}::platform_economics::tip_publication`,
        arguments: [
          publication,  // &mut Publication - publication with embedded treasury
          coin,         // Coin<SUI> - payment amount
        ],
      });

      // Execute transaction
      const result = await signAndExecuteTransaction({
        transaction: tx,
      });

      // Publication tip transaction successful
      
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
    
    // Convert SUI to MIST (multiply by 10^9)
    const amountInMist = Math.floor(amount * MIST_PER_SUI);
    handleTip(amountInMist);
  };

  if (!isConnected) {
    return <ConnectButton />;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button 
          className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 text-xs font-semibold rounded-lg transition-all duration-200 hover:bg-red-100"
        >
          <Heart className="w-3 h-3" />
          Tip
        </button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">Tip This Publication</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Send a tip to support &ldquo;{publicationName}&rdquo;
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