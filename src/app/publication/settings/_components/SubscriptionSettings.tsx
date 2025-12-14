"use client";

import { useEffect, useState } from "react";
import { useUserPublications } from "@/hooks/useUserPublications";
import { usePublication } from "@/hooks/usePublication";
import { useSubscriptionSettings } from "@/hooks/useSubscriptionSettings";
import { useSubscriptionBalance } from "@/hooks/useSubscriptionBalance";
import { useSubscriptionWithdrawal } from "@/hooks/useSubscriptionWithdrawal";
import { Button } from "@/components/ui/button";
import { HiCheckCircle, HiExclamationCircle } from "react-icons/hi2";
import { cn } from "@/lib/utils";
import { log } from "@/lib/utils/Logger";
import { SettingsSection } from "./SettingsSection";
import { SettingsCard } from "./SettingsCard";
import { SettingsToggle } from "./SettingsToggle";
import { SettingsBalanceDisplay } from "./SettingsBalanceDisplay";

interface SubscriptionSettingsProps {
  publicationId: string;
}

export function SubscriptionSettings({ publicationId }: SubscriptionSettingsProps) {
  const { firstPublication } = useUserPublications();
  const { publication, refresh: refreshPublication } = usePublication(publicationId);
  const [isEnabled, setIsEnabled] = useState(false);
  const [priceInput, setPriceInput] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);

  // Get owner cap ID from user publications
  const ownerCapId = firstPublication?.ownerCapId;

  // Get current subscription price from publication data (in MIST)
  const currentPrice = publication?.subscriptionPrice || 0;

  const {
    isSaving,
    error,
    success,
    isSubscriptionEnabled,
    currentPriceInSui,
    canUpdate,
    enableSubscription,
    disableSubscription,
    clearError,
    clearSuccess,
  } = useSubscriptionSettings({
    publicationId,
    ownerCapId,
    currentPrice,
    onSuccess: () => {
      // Refresh publication data to get updated subscription price
      refreshPublication();
      // Clear success message after 3 seconds
      setTimeout(clearSuccess, 3000);
    },
  });

  // Fetch subscription balance from blockchain
  const {
    balance,
    balanceInSui,
    isLoading: isLoadingBalance,
    error: balanceError,
    refresh: refreshBalance,
    hasBalance,
  } = useSubscriptionBalance({
    publicationId,
    enabled: !!publicationId,
  });

  // Withdrawal hook
  const {
    isWithdrawing,
    error: withdrawalError,
    success: withdrawalSuccess,
    canWithdraw,
    withdrawFullBalance,
    clearError: clearWithdrawalError,
    clearSuccess: clearWithdrawalSuccess,
  } = useSubscriptionWithdrawal({
    publicationId,
    ownerCapId,
    currentBalance: balance,
    onSuccess: () => {
      setShowWithdrawDialog(false);
      // Wait 1 second before refreshing to allow blockchain indexing
      setTimeout(() => {
        refreshBalance();
        refreshPublication();
      }, 1000);
      // Clear success message after 3 seconds
      setTimeout(clearWithdrawalSuccess, 3000);
    },
  });

  // Initialize form state based on current subscription settings
  useEffect(() => {
    setIsEnabled(isSubscriptionEnabled);
    if (isSubscriptionEnabled && currentPriceInSui > 0) {
      setPriceInput(currentPriceInSui.toString());
    }
  }, [isSubscriptionEnabled, currentPriceInSui]);


  const validatePrice = (value: string): string | null => {
    if (!value.trim()) {
      return "Price is required when subscription is enabled";
    }

    const price = parseFloat(value);
    if (isNaN(price)) {
      return "Please enter a valid number";
    }

    if (price <= 0) {
      return "Price must be greater than 0";
    }

    if (price > 1000) {
      return "Price cannot exceed 1000 SUI";
    }

    return null;
  };

  const handleToggleChange = (enabled: boolean) => {
    setIsEnabled(enabled);
    clearError();
    clearSuccess();
    setInputError(null);

    if (!enabled) {
      setPriceInput("");
    }
  };

  const handlePriceChange = (value: string) => {
    setPriceInput(value);
    setInputError(null);
    clearError();
  };

  const handleSave = async () => {
    if (!canUpdate) {
      return;
    }

    try {
      if (isEnabled) {
        // Validate price input
        const validationError = validatePrice(priceInput);
        if (validationError) {
          setInputError(validationError);
          return;
        }

        const price = parseFloat(priceInput);
        await enableSubscription(price);
      } else {
        await disableSubscription();
      }
    } catch (err) {
      // Error handling is done in the hook
      log.error('Failed to save subscription settings', { error: err }, 'SubscriptionSettings');
    }
  };

  const handleWithdraw = async () => {
    if (!canWithdraw) {
      return;
    }

    try {
      await withdrawFullBalance();
    } catch (err) {
      // Error handling is done in the hook
      log.error('Failed to withdraw subscription balance', { error: err }, 'SubscriptionSettings');
    }
  };

  if (!canUpdate) {
    return (
      <SettingsSection
        title="Subscription Settings"
        description="Manage subscription pricing and access controls for your publication."
      >
        <SettingsCard className="bg-destructive/10 border-destructive/20">
          <p className="text-destructive font-medium">Unable to load subscription settings</p>
          <div className="text-destructive/80 text-sm mt-2 space-y-1">
            {!ownerCapId && <p>• Missing publication owner capability</p>}
            {!publicationId && <p>• Missing publication ID</p>}
            {!firstPublication && <p>• No publication found for this user</p>}
          </div>
          <p className="text-destructive/80 text-sm mt-2">
            Please ensure you own this publication and try refreshing the page.
          </p>
        </SettingsCard>
      </SettingsSection>
    );
  }

  return (
    <SettingsSection
      title="Subscription Settings"
      description="Manage subscription pricing and access controls for your publication."
    >
      {/* Success Message */}
      {success && (
        <div role="alert" className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
          <HiCheckCircle className="size-5 text-green-600 flex-shrink-0" />
          <p className="text-green-800">
            Subscription settings updated successfully! Changes may take a moment to appear.
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div role="alert" className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
          <HiExclamationCircle className="size-5 text-red-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-red-800 font-medium">Failed to update subscription settings</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearError}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            Dismiss
          </Button>
        </div>
      )}

      <SettingsCard>
        <div className="space-y-6">
          {/* Subscription Toggle */}
          <SettingsToggle
            label="Enable Subscription"
            description="Require readers to pay a monthly subscription to access your content"
            checked={isEnabled}
            onChange={handleToggleChange}
            disabled={isSaving}
          />

          {/* Price Input (only shown when enabled) */}
          {isEnabled && (
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Monthly Subscription Price (SUI)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={priceInput}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  disabled={isSaving}
                  className={cn(
                    "w-full px-3 py-2 border rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent transition-colors",
                    inputError
                      ? "border-red-300 focus:ring-red-200"
                      : "border-gray-200 focus:ring-primary/50",
                    isSaving && "opacity-50 cursor-not-allowed"
                  )}
                  placeholder="0.00"
                />
                {inputError && (
                  <p className="text-red-600 text-sm mt-1">{inputError}</p>
                )}
                <p className="text-gray-500 text-sm mt-1">
                  Readers will pay this amount monthly to access your content
                </p>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="pt-4 border-t border-gray-100">
            <Button
              onClick={handleSave}
              disabled={isSaving || (!isEnabled && !isSubscriptionEnabled)}
              className="bg-primary hover:bg-primary/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  Saving...
                </>
              ) : (
                'Save Subscription Settings'
              )}
            </Button>

            {/* Current Status */}
            <p className="text-sm text-gray-500 mt-2">
              Current status: {isSubscriptionEnabled
                ? `Subscription enabled (${currentPriceInSui} SUI/month)`
                : 'Subscription disabled (free access)'
              }
            </p>
          </div>
        </div>
      </SettingsCard>

      {/* Subscription Balance Section - Separate Card */}
      <SettingsCard
        title="Subscription Balance"
        description="View and withdraw accumulated subscription payments"
      >
        <div className="space-y-4">
          {/* Balance Display */}
          <SettingsBalanceDisplay
            balance={balanceInSui.toFixed(4)}
            currency="SUI"
            isLoading={isLoadingBalance}
            error={balanceError}
          />

          {/* Withdrawal Success Message */}
          {withdrawalSuccess && (
            <div role="alert" className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
              <HiCheckCircle className="size-5 text-green-600 flex-shrink-0" />
              <p className="text-green-800">
                Balance withdrawn successfully! Funds have been transferred to your wallet.
              </p>
            </div>
          )}

          {/* Withdrawal Error Message */}
          {withdrawalError && (
            <div role="alert" className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
              <HiExclamationCircle className="size-5 text-red-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-red-800 font-medium">Failed to withdraw balance</p>
                <p className="text-red-600 text-sm mt-1">{withdrawalError}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearWithdrawalError}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Dismiss
              </Button>
            </div>
          )}

          {/* Withdraw Button */}
          {!showWithdrawDialog && (
            <Button
              onClick={() => setShowWithdrawDialog(true)}
              disabled={!hasBalance || isLoadingBalance || isWithdrawing}
              className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Withdraw Balance
            </Button>
          )}

          {/* Withdrawal Confirmation Dialog */}
          {showWithdrawDialog && (
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 space-y-4">
              <div>
                <p className="text-gray-900 font-medium">Confirm Withdrawal</p>
                <p className="text-gray-500 text-sm mt-1">
                  You are about to withdraw <strong className="text-gray-900">{balanceInSui.toFixed(4)} SUI</strong> from your publication subscription balance.
                  The funds will be transferred to your connected wallet.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleWithdraw}
                  disabled={isWithdrawing}
                  className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                >
                  {isWithdrawing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    'Confirm Withdrawal'
                  )}
                </Button>
                <Button
                  onClick={() => setShowWithdrawDialog(false)}
                  disabled={isWithdrawing}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </SettingsCard>
    </SettingsSection>
  );
}
