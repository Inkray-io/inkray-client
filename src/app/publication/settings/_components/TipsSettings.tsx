"use client";

import { useState } from "react";
import { useUserPublications } from "@/hooks/useUserPublications";
import { usePublication } from "@/hooks/usePublication";
import { useTipBalance } from "@/hooks/useTipBalance";
import { useTipWithdrawal } from "@/hooks/useTipWithdrawal";
import { Button } from "@/components/ui/button";
import { HiCheckCircle, HiExclamationCircle } from "react-icons/hi2";
import { log } from "@/lib/utils/Logger";
import { SettingsSection } from "./SettingsSection";
import { SettingsCard } from "./SettingsCard";
import { SettingsBalanceDisplay } from "./SettingsBalanceDisplay";

interface TipsSettingsProps {
  publicationId: string;
}

export function TipsSettings({ publicationId }: TipsSettingsProps) {
  const { firstPublication } = useUserPublications();
  const { refresh: refreshPublication } = usePublication(publicationId);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);

  // Get owner cap ID from user publications
  const ownerCapId = firstPublication?.ownerCapId;

  // Fetch tip balance from blockchain
  const {
    balance,
    balanceInSui,
    totalTipsReceived,
    totalAmountReceivedInSui,
    isLoading: isLoadingBalance,
    error: balanceError,
    refresh: refreshBalance,
    hasBalance,
  } = useTipBalance({
    publicationId,
    enabled: !!publicationId,
  });

  // Withdrawal hook
  const {
    isWithdrawing,
    error: withdrawalError,
    success: withdrawalSuccess,
    canWithdraw,
    withdrawAllTips,
    clearError: clearWithdrawalError,
    clearSuccess: clearWithdrawalSuccess,
  } = useTipWithdrawal({
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

  const handleWithdraw = async () => {
    if (!canWithdraw) {
      return;
    }

    try {
      await withdrawAllTips();
    } catch (err) {
      // Error handling is done in the hook
      log.error('Failed to withdraw tips', { error: err }, 'TipsSettings');
    }
  };

  if (!ownerCapId || !publicationId) {
    return (
      <SettingsSection
        title="Tips"
        description="View and withdraw accumulated tips from your publication."
      >
        <SettingsCard className="bg-red-50 border-red-200">
          <p className="text-red-800 font-medium">Unable to load tip settings</p>
          <div className="text-red-600 text-sm mt-2 space-y-1">
            {!ownerCapId && <p>• Missing publication owner capability</p>}
            {!publicationId && <p>• Missing publication ID</p>}
          </div>
          <p className="text-red-600 text-sm mt-2">
            Please ensure you own this publication and try refreshing the page.
          </p>
        </SettingsCard>
      </SettingsSection>
    );
  }

  return (
    <SettingsSection
      title="Tips"
      description="View and withdraw accumulated tips from your publication."
    >
      {/* Tip Balance Card */}
      <SettingsCard
        title="Tip Balance"
        description="Accumulated tips from readers who appreciate your content"
      >
        <div className="space-y-4">
          {/* Balance Display */}
          <SettingsBalanceDisplay
            balance={balanceInSui.toFixed(4)}
            currency="SUI"
            isLoading={isLoadingBalance}
            error={balanceError}
            stats={[
              { label: "Total Tips", value: totalTipsReceived },
              { label: "Lifetime Earnings", value: `${totalAmountReceivedInSui.toFixed(2)} SUI` },
            ]}
          />

          {/* Withdrawal Success Message */}
          {withdrawalSuccess && (
            <div role="alert" className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
              <HiCheckCircle className="size-5 text-green-600 flex-shrink-0" />
              <p className="text-green-800">
                Tips withdrawn successfully! Funds have been transferred to your wallet.
              </p>
            </div>
          )}

          {/* Withdrawal Error Message */}
          {withdrawalError && (
            <div role="alert" className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
              <HiExclamationCircle className="size-5 text-red-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-red-800 font-medium">Failed to withdraw tips</p>
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
              Withdraw All Tips
            </Button>
          )}

          {/* Withdrawal Confirmation Dialog */}
          {showWithdrawDialog && (
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 space-y-4">
              <div>
                <p className="text-gray-900 font-medium">Confirm Withdrawal</p>
                <p className="text-gray-500 text-sm mt-1">
                  You are about to withdraw <strong className="text-gray-900">{balanceInSui.toFixed(4)} SUI</strong> from your publication tips balance.
                  All accumulated tips will be transferred to your connected wallet.
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
