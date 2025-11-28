"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  HiPaperAirplane,
  HiCheckCircle,
  HiExclamationCircle,
  HiChevronRight,
  HiChevronLeft,
  HiSparkles,
  HiCube,
  HiUserGroup,
  HiArrowPath,
  HiExclamationTriangle,
} from "react-icons/hi2";
import { cn } from "@/lib/utils";
import { SettingsSection } from "./SettingsSection";
import { SettingsCard } from "./SettingsCard";
import { useAirdrop, AirdropStep } from "@/hooks/useAirdrop";
import { useWalletBalances, formatTokenBalance, TokenBalance } from "@/hooks/useWalletBalances";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { DATE_PRESETS, DateRange } from "@/lib/followerFilters";

interface AirdropSettingsProps {
  publicationId: string;
}

// Step indicator component
function StepIndicator({ currentStep }: { currentStep: AirdropStep }) {
  const steps = [
    { num: 1, label: "Select Token", icon: HiCube },
    { num: 2, label: "Recipients", icon: HiUserGroup },
    { num: 3, label: "Review", icon: HiCheckCircle },
  ];

  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, index) => {
        const isActive = step.num === currentStep;
        const isCompleted = step.num < currentStep;
        const Icon = step.icon;

        return (
          <div key={step.num} className="flex items-center flex-1">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "relative flex items-center justify-center size-10 rounded-full transition-all duration-300",
                  isActive && "bg-primary text-primary-foreground shadow-lg shadow-primary/25",
                  isCompleted && "bg-primary/20 text-primary",
                  !isActive && !isCompleted && "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <HiCheckCircle className="size-5" />
                ) : (
                  <Icon className="size-5" />
                )}
                {isActive && (
                  <span className="absolute inset-0 rounded-full animate-ping bg-primary/30" />
                )}
              </div>
              <div className="hidden sm:block">
                <p
                  className={cn(
                    "text-sm font-medium transition-colors",
                    isActive && "text-foreground",
                    isCompleted && "text-primary",
                    !isActive && !isCompleted && "text-muted-foreground"
                  )}
                >
                  {step.label}
                </p>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 mx-4 rounded-full transition-colors duration-300",
                  isCompleted ? "bg-primary/50" : "bg-muted"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Token selector card
function TokenCard({
  token,
  isSelected,
  onSelect,
}: {
  token: TokenBalance;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const [imageError, setImageError] = useState(false);

  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full p-4 rounded-xl border text-left transition-all duration-200",
        "hover:border-primary/50 hover:bg-primary/5",
        isSelected
          ? "border-primary bg-primary/10 shadow-sm"
          : "border-border bg-card"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex items-center justify-center size-10 rounded-full font-bold text-sm overflow-hidden",
              isSelected
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            {token.iconUrl && !imageError ? (
              <img
                src={token.iconUrl}
                alt={token.symbol}
                className="size-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              token.symbol.slice(0, 2)
            )}
          </div>
          <div>
            <p className="font-medium text-foreground">{token.name}</p>
            <p className="text-sm text-muted-foreground font-mono">
              {token.symbol}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-semibold text-foreground tabular-nums">
            {formatTokenBalance(token.totalBalance, token.decimals)}
          </p>
          <p className="text-xs text-muted-foreground">Available</p>
        </div>
      </div>
    </button>
  );
}

// Step 1: Token Selection
function Step1TokenSelection({
  balances,
  isLoadingBalances,
  selectedCoinType,
  totalAmount,
  onSelectToken,
  onSetAmount,
  onNext,
}: {
  balances: TokenBalance[];
  isLoadingBalances: boolean;
  selectedCoinType: string | null;
  totalAmount: string;
  onSelectToken: (coinType: string) => void;
  onSetAmount: (amount: string) => void;
  onNext: () => void;
}) {
  const selectedToken = balances.find((b) => b.coinType === selectedCoinType);
  const maxBalance = selectedToken
    ? formatTokenBalance(selectedToken.totalBalance, selectedToken.decimals)
    : "0";

  const isValidAmount =
    totalAmount &&
    parseFloat(totalAmount) > 0 &&
    parseFloat(totalAmount) <= parseFloat(maxBalance);

  return (
    <div className="space-y-6">
      {/* Token List */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          Select Token to Airdrop
        </label>
        {isLoadingBalances ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 bg-muted rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : balances.length === 0 ? (
          <div className="text-center py-8 bg-muted/30 rounded-xl border border-border">
            <HiCube className="size-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              No tokens found in your wallet
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {balances.map((token) => (
              <TokenCard
                key={token.coinType}
                token={token}
                isSelected={selectedCoinType === token.coinType}
                onSelect={() => onSelectToken(token.coinType)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Amount Input */}
      {selectedCoinType && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <label className="block text-sm font-medium text-foreground mb-3">
            Total Airdrop Amount
          </label>
          <div className="relative">
            <input
              type="number"
              value={totalAmount}
              onChange={(e) => onSetAmount(e.target.value)}
              placeholder="0.00"
              min="0"
              step="any"
              className={cn(
                "w-full px-4 py-3 pr-24 border rounded-xl bg-background text-foreground",
                "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
                "placeholder:text-muted-foreground tabular-nums text-lg font-medium",
                !isValidAmount && totalAmount && "border-destructive focus:ring-destructive/50"
              )}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <button
                onClick={() => onSetAmount(maxBalance)}
                className="px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10 rounded transition-colors"
              >
                MAX
              </button>
              <span className="text-sm font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
                {selectedToken?.symbol}
              </span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Available: {maxBalance} {selectedToken?.symbol}
          </p>
          {totalAmount && !isValidAmount && (
            <p className="text-sm text-destructive mt-1">
              {parseFloat(totalAmount) > parseFloat(maxBalance)
                ? "Amount exceeds available balance"
                : "Please enter a valid amount"}
            </p>
          )}
        </div>
      )}

      {/* Next Button */}
      <div className="flex justify-end pt-4">
        <Button
          onClick={onNext}
          disabled={!selectedCoinType || !isValidAmount}
          className="gap-2"
        >
          Continue
          <HiChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

// Step 2: Recipient Selection
function Step2RecipientSelection({
  dateRange,
  customStartDate,
  customEndDate,
  recipientCount,
  isLoadingRecipients,
  onSetDateRange,
  onSetCustomStartDate,
  onSetCustomEndDate,
  onFetchRecipients,
  onPrev,
  onNext,
}: {
  dateRange: DateRange;
  customStartDate: string;
  customEndDate: string;
  recipientCount: number;
  isLoadingRecipients: boolean;
  onSetDateRange: (range: DateRange) => void;
  onSetCustomStartDate: (date: string) => void;
  onSetCustomEndDate: (date: string) => void;
  onFetchRecipients: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  // Fetch recipients when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      onFetchRecipients();
    }, 300);
    return () => clearTimeout(timer);
  }, [dateRange, customStartDate, customEndDate, onFetchRecipients]);

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          Filter by Follow Date
        </label>
        <div className="flex flex-wrap gap-2">
          {DATE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => onSetDateRange(preset.id)}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-full transition-all",
                dateRange === preset.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Custom Date Range Inputs */}
        {dateRange === "custom" && (
          <div className="mt-4 p-4 bg-muted/30 rounded-xl border border-border animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => onSetCustomStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => onSetCustomEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recipients Preview */}
      <div className="bg-muted/30 rounded-xl p-5 border border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-full bg-primary/10">
              <HiUserGroup className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Recipients Found</p>
              {isLoadingRecipients ? (
                <div className="flex items-center gap-2 mt-1">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                  <span className="text-sm text-muted-foreground">
                    Loading...
                  </span>
                </div>
              ) : (
                <p className="text-2xl font-bold text-foreground tabular-nums">
                  {recipientCount.toLocaleString()}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onFetchRecipients}
            disabled={isLoadingRecipients}
            className="gap-2"
          >
            <HiArrowPath
              className={cn("size-4", isLoadingRecipients && "animate-spin")}
            />
            Refresh
          </Button>
        </div>

        {!isLoadingRecipients && recipientCount === 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              {dateRange === "custom" && (!customStartDate || !customEndDate)
                ? "Select a date range to see recipients"
                : "No followers match the selected criteria"}
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onPrev} className="gap-2">
          <HiChevronLeft className="size-4" />
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={recipientCount === 0 || isLoadingRecipients}
          className="gap-2"
        >
          Continue
          <HiChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

// Step 3: Review & Send
function Step3Review({
  selectedToken,
  totalAmount,
  recipientCount,
  amountPerRecipient,
  status,
  error,
  txDigest,
  onExecute,
  onPrev,
  onReset,
}: {
  selectedToken: TokenBalance | undefined;
  totalAmount: string;
  recipientCount: number;
  amountPerRecipient: number;
  status: string;
  error: string | null;
  txDigest: string | null;
  onExecute: () => void;
  onPrev: () => void;
  onReset: () => void;
}) {
  const [imageError, setImageError] = useState(false);
  const isLoading = status === "loading";
  const isSuccess = status === "success";

  if (isSuccess && txDigest) {
    return (
      <div className="text-center py-8 animate-in fade-in zoom-in-95 duration-300">
        <div className="inline-flex items-center justify-center size-20 rounded-full bg-green-500/10 mb-6">
          <HiCheckCircle className="size-10 text-green-500" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Airdrop Successful!
        </h3>
        <p className="text-muted-foreground mb-6">
          Successfully sent {totalAmount} {selectedToken?.symbol} to{" "}
          {recipientCount} recipients
        </p>
        <div className="bg-muted/50 rounded-lg px-4 py-3 mb-6 inline-block">
          <p className="text-xs text-muted-foreground mb-1">Transaction ID</p>
          <p className="font-mono text-sm text-foreground break-all">
            {txDigest}
          </p>
        </div>
        <div>
          <Button onClick={onReset} className="gap-2">
            <HiSparkles className="size-4" />
            Start New Airdrop
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 rounded-xl p-6 border border-primary/20">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <HiSparkles className="size-5 text-primary" />
          Airdrop Summary
        </h3>

        <div className="space-y-4">
          <div className="flex justify-between items-center py-3 border-b border-border/50">
            <span className="text-muted-foreground">Token</span>
            <span className="font-medium text-foreground flex items-center gap-2">
              <span className="inline-flex items-center justify-center size-6 rounded-full bg-primary/20 text-primary text-xs font-bold overflow-hidden">
                {selectedToken?.iconUrl && !imageError ? (
                  <img
                    src={selectedToken.iconUrl}
                    alt={selectedToken.symbol}
                    className="size-full object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  selectedToken?.symbol.slice(0, 2)
                )}
              </span>
              {selectedToken?.name}
            </span>
          </div>

          <div className="flex justify-between items-center py-3 border-b border-border/50">
            <span className="text-muted-foreground">Total Amount</span>
            <span className="font-semibold text-foreground tabular-nums">
              {totalAmount} {selectedToken?.symbol}
            </span>
          </div>

          <div className="flex justify-between items-center py-3 border-b border-border/50">
            <span className="text-muted-foreground">Recipients</span>
            <Badge variant="secondary" className="font-semibold tabular-nums">
              {recipientCount.toLocaleString()} wallets
            </Badge>
          </div>

          <div className="flex justify-between items-center py-3 bg-primary/10 -mx-2 px-4 rounded-lg">
            <span className="font-medium text-foreground">Per Recipient</span>
            <span className="text-lg font-bold text-primary tabular-nums">
              {amountPerRecipient.toFixed(6)} {selectedToken?.symbol}
            </span>
          </div>
        </div>
      </div>

      {/* Warning for large airdrops */}
      {recipientCount > 100 && (
        <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <HiExclamationTriangle className="size-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
              Large Airdrop
            </p>
            <p className="text-sm text-amber-600/80 dark:text-amber-400/80">
              This transaction involves {recipientCount} transfers. Gas costs
              may be higher than usual.
            </p>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-xl animate-in fade-in slide-in-from-top-2">
          <HiExclamationCircle className="size-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-destructive">
              Transaction Failed
            </p>
            <p className="text-sm text-destructive/80">{error}</p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button
          variant="outline"
          onClick={onPrev}
          disabled={isLoading}
          className="gap-2"
        >
          <HiChevronLeft className="size-4" />
          Back
        </Button>
        <Button
          onClick={onExecute}
          disabled={isLoading}
          className="gap-2 min-w-[160px]"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
              Sending...
            </>
          ) : (
            <>
              <HiPaperAirplane className="size-4" />
              Send Airdrop
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// Main component
export function AirdropSettings({ publicationId }: AirdropSettingsProps) {
  const { address } = useWalletConnection();
  const { balances, isLoading: isLoadingBalances, refresh: refreshBalances } = useWalletBalances(address);

  const {
    step,
    selectedCoinType,
    totalAmount,
    dateRange,
    customStartDate,
    customEndDate,
    recipientCount,
    isLoadingRecipients,
    status,
    error,
    txDigest,
    amountPerRecipient,
    nextStep,
    prevStep,
    setSelectedCoinType,
    setTotalAmount,
    setDateRange,
    setCustomStartDate,
    setCustomEndDate,
    fetchRecipients,
    executeAirdrop,
    reset,
  } = useAirdrop({ publicationId });

  const selectedToken = balances.find((b) => b.coinType === selectedCoinType);

  const handleExecute = async () => {
    await executeAirdrop(selectedToken?.decimals || 9);
  };

  // Tab selection for airdrop type (token vs NFT)
  const [airdropType, setAirdropType] = useState<"token" | "nft">("token");

  return (
    <SettingsSection
      title="Airdrop"
      description="Distribute tokens or NFTs to your followers."
    >
      <SettingsCard>
        {/* Airdrop Type Selector */}
        <div className="mb-8">
          <div className="inline-flex rounded-lg bg-muted p-1">
            <button
              onClick={() => setAirdropType("token")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all",
                airdropType === "token"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <HiCube className="size-4" />
              Token Airdrop
            </button>
            <button
              onClick={() => setAirdropType("nft")}
              disabled
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all",
                airdropType === "nft"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
                "opacity-50 cursor-not-allowed"
              )}
            >
              <HiSparkles className="size-4" />
              NFT Airdrop
              <Badge variant="secondary" className="text-xs ml-1">
                Soon
              </Badge>
            </button>
          </div>
        </div>

        {/* Step Indicator */}
        <StepIndicator currentStep={step} />

        {/* Step Content */}
        {step === 1 && (
          <Step1TokenSelection
            balances={balances}
            isLoadingBalances={isLoadingBalances}
            selectedCoinType={selectedCoinType}
            totalAmount={totalAmount}
            onSelectToken={setSelectedCoinType}
            onSetAmount={setTotalAmount}
            onNext={nextStep}
          />
        )}

        {step === 2 && (
          <Step2RecipientSelection
            dateRange={dateRange}
            customStartDate={customStartDate}
            customEndDate={customEndDate}
            recipientCount={recipientCount}
            isLoadingRecipients={isLoadingRecipients}
            onSetDateRange={setDateRange}
            onSetCustomStartDate={setCustomStartDate}
            onSetCustomEndDate={setCustomEndDate}
            onFetchRecipients={fetchRecipients}
            onPrev={prevStep}
            onNext={nextStep}
          />
        )}

        {step === 3 && (
          <Step3Review
            selectedToken={selectedToken}
            totalAmount={totalAmount}
            recipientCount={recipientCount}
            amountPerRecipient={amountPerRecipient}
            status={status}
            error={error}
            txDigest={txDigest}
            onExecute={handleExecute}
            onPrev={prevStep}
            onReset={reset}
          />
        )}
      </SettingsCard>

      {/* Info Note */}
      <div className="bg-muted/30 rounded-xl p-4 border border-border">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">How it works:</strong> Select a
          token from your wallet, choose how much to distribute, filter which
          followers receive the airdrop, and sign the transaction. The total
          amount will be split equally among all recipients.
        </p>
      </div>
    </SettingsSection>
  );
}
