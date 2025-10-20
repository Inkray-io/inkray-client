"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { useEnhancedTransaction } from "@/hooks/useEnhancedTransaction";
import { Transaction } from "@mysten/sui/transactions";
import { INKRAY_CONFIG } from "@/lib/sui-clients";
import { Lock, Loader2, Clock, Check } from "lucide-react";
import { MIST_PER_SUI } from "@/constants/tipping";
import { ConnectButton } from "@mysten/dapp-kit";

interface SubscriptionInfo {
  id: string;
  subscriptionPrice: number; // in MIST
  subscriptionPeriod: number; // in days
  publicationName?: string;
}

interface SubscriptionButtonProps {
  publicationId: string;
  subscriptionInfo: SubscriptionInfo;
  isSubscribed?: boolean;
  subscriptionExpiresAt?: Date;
  onSubscriptionSuccess?: () => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  variant?: "button" | "inline"; // button shows trigger, inline is dialog only
}

export function SubscriptionButton({ 
  publicationId, 
  subscriptionInfo, 
  isSubscribed = false,
  subscriptionExpiresAt,
  onSubscriptionSuccess, 
  isOpen, 
  onOpenChange,
  variant = "button"
}: SubscriptionButtonProps) {
  const { isConnected, account } = useWalletConnection();
  const { signAndExecuteTransaction } = useEnhancedTransaction();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);

  // Use controlled state if provided, otherwise use internal state
  const dialogOpen = isOpen !== undefined ? isOpen : internalIsOpen;
  const setDialogOpen = onOpenChange || setInternalIsOpen;
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);

  const handleSubscribe = async () => {
    if (!isConnected || !account) {
      return;
    }

    try {
      setIsSubscribing(true);
      setSubscriptionError(null);

      // Build subscription transaction
      const tx = new Transaction();
      
      // Reference publication object
      const publication = tx.object(publicationId);
      
      // Create payment coin
      const [coin] = tx.splitCoins(tx.gas, [subscriptionInfo.subscriptionPrice]);
      
      // Call subscribe_to_publication function
      tx.moveCall({
        target: `${INKRAY_CONFIG.PACKAGE_ID}::publication_subscription::subscribe_to_publication`,
        arguments: [
          publication,  // &mut Publication
          coin,         // Coin<SUI> - payment amount
        ],
      });

      // Execute transaction
      const result = await signAndExecuteTransaction({
        transaction: tx,
      });

      console.log("Subscription successful:", result);
      
      // Close dialog and call success callback
      setDialogOpen(false);
      onSubscriptionSuccess?.();
      
    } catch (error) {
      setSubscriptionError(error instanceof Error ? error.message : "Failed to subscribe. Please try again.");
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleExtendSubscription = async () => {
    if (!isConnected || !account) {
      return;
    }

    try {
      setIsSubscribing(true);
      setSubscriptionError(null);

      // Build extend subscription transaction
      const tx = new Transaction();
      
      // Reference publication object
      const publication = tx.object(publicationId);
      
      // Create payment coin
      const [coin] = tx.splitCoins(tx.gas, [subscriptionInfo.subscriptionPrice]);
      
      // Call extend_subscription function (assuming subscription exists)
      tx.moveCall({
        target: `${INKRAY_CONFIG.PACKAGE_ID}::publication_subscription::extend_subscription`,
        arguments: [
          publication,  // &mut Publication
          coin,         // Coin<SUI> - payment amount
        ],
      });

      // Execute transaction
      const result = await signAndExecuteTransaction({
        transaction: tx,
      });

      console.log("Subscription extension successful:", result);
      
      // Close dialog and call success callback
      setDialogOpen(false);
      onSubscriptionSuccess?.();
      
    } catch (error) {
      setSubscriptionError(error instanceof Error ? error.message : "Failed to extend subscription. Please try again.");
    } finally {
      setIsSubscribing(false);
    }
  };

  const formatPrice = (priceInMist: number) => {
    return (priceInMist / MIST_PER_SUI).toFixed(2);
  };

  const formatExpiryDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const isExpiringSoon = subscriptionExpiresAt && subscriptionExpiresAt.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000; // 7 days

  if (!isConnected) {
    return variant === "button" ? (
      <div className="flex items-center gap-2">
        <ConnectButton 
          connectText="Connect to Subscribe"
          className="text-sm"
        />
      </div>
    ) : null;
  }

  // If variant is inline (dialog only), don't show trigger button
  if (variant === "inline") {
    return (
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Subscribe to {subscriptionInfo.publicationName || "Publication"}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {isSubscribed 
                ? "Extend your subscription to continue accessing premium content"
                : "Subscribe to access premium content and support the creator"
              }
            </p>
          </DialogHeader>

          <div className="space-y-4">
            {/* Subscription Details */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Monthly Price:</span>
                  <span className="text-sm font-semibold">{formatPrice(subscriptionInfo.subscriptionPrice)} SUI</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Access Period:</span>
                  <span className="text-sm">{subscriptionInfo.subscriptionPeriod} days</span>
                </div>
                {isSubscribed && subscriptionExpiresAt && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Current Expiry:</span>
                    <span className={`text-sm ${isExpiringSoon ? 'text-orange-600 font-medium' : ''}`}>
                      {formatExpiryDate(subscriptionExpiresAt)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Current Status */}
            {isSubscribed && (
              <div className={`flex items-center gap-2 p-3 rounded-lg ${
                isExpiringSoon ? 'bg-orange-50 text-orange-800' : 'bg-green-50 text-green-800'
              }`}>
                {isExpiringSoon ? (
                  <>
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-medium">Expires soon</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    <span className="text-sm font-medium">Active subscription</span>
                  </>
                )}
              </div>
            )}

            {/* Subscribe/Extend Button */}
            <Button
              onClick={isSubscribed ? handleExtendSubscription : handleSubscribe}
              disabled={isSubscribing}
              className="w-full"
            >
              {isSubscribing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  {isSubscribed ? "Extending..." : "Subscribing..."}
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  {isSubscribed ? "Extend Subscription" : "Subscribe"}
                </>
              )}
            </Button>

            {/* Error display */}
            {subscriptionError && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                {subscriptionError}
              </div>
            )}

            {/* Info */}
            <div className="text-xs text-muted-foreground space-y-1 border-t pt-3">
              <p>• Subscription gives access to all premium content</p>
              <p>• Payment processed on the Sui blockchain</p>
              <p>• Supports the publication creator directly</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Show button trigger for subscribed users
  if (isSubscribed) {
    return (
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className={`gap-2 ${
              isExpiringSoon 
                ? 'text-orange-600 border-orange-200 hover:bg-orange-50' 
                : 'text-green-600 border-green-200 hover:bg-green-50'
            }`}
          >
            <Check className="w-4 h-4" />
            Subscribed
          </Button>
        </DialogTrigger>
        
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Subscription Status
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              You're subscribed to {subscriptionInfo.publicationName || "this publication"}
            </p>
          </DialogHeader>

          <div className="space-y-4">
            {/* Subscription Details */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Monthly Price:</span>
                  <span className="text-sm font-semibold">{formatPrice(subscriptionInfo.subscriptionPrice)} SUI</span>
                </div>
                {subscriptionExpiresAt && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Expires:</span>
                    <span className={`text-sm ${isExpiringSoon ? 'text-orange-600 font-medium' : ''}`}>
                      {formatExpiryDate(subscriptionExpiresAt)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Status */}
            <div className={`flex items-center gap-2 p-3 rounded-lg ${
              isExpiringSoon ? 'bg-orange-50 text-orange-800' : 'bg-green-50 text-green-800'
            }`}>
              {isExpiringSoon ? (
                <>
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">Expires in less than 7 days</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span className="text-sm font-medium">Active subscription</span>
                </>
              )}
            </div>

            {/* Extend Button */}
            {isExpiringSoon && (
              <Button
                onClick={handleExtendSubscription}
                disabled={isSubscribing}
                className="w-full"
              >
                {isSubscribing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Extending...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Extend Subscription
                  </>
                )}
              </Button>
            )}

            {/* Error display */}
            {subscriptionError && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                {subscriptionError}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Show subscribe button for non-subscribed users
  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 text-blue-600 border-blue-200 hover:bg-blue-50">
          <Lock className="w-4 h-4" />
          Subscribe
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Subscribe to {subscriptionInfo.publicationName || "Publication"}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Subscribe to access premium content and support the creator
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Subscription Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Monthly Price:</span>
                <span className="text-sm font-semibold">{formatPrice(subscriptionInfo.subscriptionPrice)} SUI</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Access Period:</span>
                <span className="text-sm">{subscriptionInfo.subscriptionPeriod} days</span>
              </div>
            </div>
          </div>

          {/* Subscribe Button */}
          <Button
            onClick={handleSubscribe}
            disabled={isSubscribing}
            className="w-full"
          >
            {isSubscribing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Subscribing...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 mr-2" />
                Subscribe for {formatPrice(subscriptionInfo.subscriptionPrice)} SUI
              </>
            )}
          </Button>

          {/* Error display */}
          {subscriptionError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
              {subscriptionError}
            </div>
          )}

          {/* Info */}
          <div className="text-xs text-muted-foreground space-y-1 border-t pt-3">
            <p>• Access all premium content from this publication</p>
            <p>• Transaction will be processed on the Sui blockchain</p>
            <p>• Your subscription supports the content creator</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}