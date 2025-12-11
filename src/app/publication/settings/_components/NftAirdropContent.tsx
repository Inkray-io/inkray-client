"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  HiDocumentText,
  HiCheckCircle,
  HiChevronRight,
  HiChevronLeft,
  HiSparkles,
  HiUserGroup,
  HiArrowPath,
  HiExclamationTriangle,
  HiExclamationCircle,
  HiLockClosed,
  HiClock,
} from "react-icons/hi2";
import { cn } from "@/lib/utils";
import { useNftAirdrop, NftAirdropStep } from "@/hooks/useNftAirdrop";
import { DATE_PRESETS, DateRange } from "@/lib/followerFilters";
import { PublicationArticle } from "@/types/article";

interface NftAirdropContentProps {
  publicationId: string;
}

// Step indicator component for NFT airdrop
function NftStepIndicator({ currentStep }: { currentStep: NftAirdropStep }) {
  const steps = [
    { num: 1, label: "Select Article", icon: HiDocumentText },
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
                  !isActive && !isCompleted && "bg-gray-100 text-gray-500"
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
                    isActive && "text-gray-900",
                    isCompleted && "text-primary",
                    !isActive && !isCompleted && "text-gray-500"
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
                  isCompleted ? "bg-primary/50" : "bg-gray-100"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Article selector card
function ArticleCard({
  article,
  isSelected,
  onSelect,
}: {
  article: PublicationArticle;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full p-4 rounded-xl border text-left transition-all duration-200",
        "hover:border-primary/50 hover:bg-primary/5",
        isSelected
          ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary/20"
          : "border-gray-200 bg-white"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {article.gated && (
              <Badge variant="secondary" className="text-xs shrink-0">
                <HiLockClosed className="size-3 mr-1" />
                Gated
              </Badge>
            )}
          </div>
          <h4 className="font-medium text-gray-900 line-clamp-2 leading-snug">
            {article.title}
          </h4>
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
            <HiClock className="size-3.5" />
            <span>{article.timeAgo}</span>
            {article.viewCount !== undefined && article.viewCount > 0 && (
              <>
                <span className="text-gray-300">•</span>
                <span>{article.viewCount.toLocaleString()} views</span>
              </>
            )}
          </div>
        </div>
        <div
          className={cn(
            "size-5 rounded-full border-2 shrink-0 mt-1 transition-all duration-200",
            isSelected
              ? "border-primary bg-primary"
              : "border-gray-300"
          )}
        >
          {isSelected && (
            <HiCheckCircle className="size-full text-white" />
          )}
        </div>
      </div>
    </button>
  );
}

// Step 1: Article Selection
function Step1ArticleSelection({
  articles,
  isLoadingArticles,
  selectedArticle,
  onSelectArticle,
  onRefresh,
  onNext,
}: {
  articles: PublicationArticle[];
  isLoadingArticles: boolean;
  selectedArticle: PublicationArticle | null;
  onSelectArticle: (article: PublicationArticle) => void;
  onRefresh: () => void;
  onNext: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Article List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-900">
            Select Article for NFT Airdrop
          </label>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isLoadingArticles}
            className="gap-2 -mr-2"
          >
            <HiArrowPath
              className={cn("size-4", isLoadingArticles && "animate-spin")}
            />
            Refresh
          </Button>
        </div>

        {isLoadingArticles ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 bg-gray-100 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-10 bg-gray-100/30 rounded-xl border border-gray-200">
            <HiDocumentText className="size-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500 font-medium">No articles found</p>
            <p className="text-sm text-gray-400 mt-1">
              Publish an article first to airdrop NFTs
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
            {articles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                isSelected={selectedArticle?.id === article.id}
                onSelect={() => onSelectArticle(article)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Selection Preview */}
      {selectedArticle && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 bg-primary/5 rounded-xl p-4 border border-primary/20">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center size-10 rounded-full bg-primary/10 shrink-0">
              <HiSparkles className="size-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-primary font-medium uppercase tracking-wide mb-1">
                Selected Article
              </p>
              <p className="font-medium text-gray-900 line-clamp-1">
                {selectedArticle.title}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Next Button */}
      <div className="flex justify-end pt-4">
        <Button
          onClick={onNext}
          disabled={!selectedArticle}
          className="gap-2"
        >
          Continue
          <HiChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

// Step 2: Recipient Selection (reused from token airdrop pattern)
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
        <label className="block text-sm font-medium text-gray-900 mb-3">
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
                  : "bg-gray-100 text-gray-500 hover:text-gray-900 hover:bg-gray-100/80"
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Custom Date Range Inputs */}
        {dateRange === "custom" && (
          <div className="mt-4 p-4 bg-gray-100/30 rounded-xl border border-gray-200 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => onSetCustomStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => onSetCustomEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recipients Preview */}
      <div className="bg-gray-100/30 rounded-xl p-5 border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-full bg-primary/10">
              <HiUserGroup className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Recipients Found</p>
              {isLoadingRecipients ? (
                <div className="flex items-center gap-2 mt-1">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                  <span className="text-sm text-gray-500">
                    Loading...
                  </span>
                </div>
              ) : (
                <p className="text-2xl font-bold text-gray-900 tabular-nums">
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
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
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
  selectedArticle,
  recipientCount,
  status,
  error,
  txDigest,
  onExecute,
  onPrev,
  onReset,
}: {
  selectedArticle: PublicationArticle | null;
  recipientCount: number;
  status: string;
  error: string | null;
  txDigest: string | null;
  onExecute: () => void;
  onPrev: () => void;
  onReset: () => void;
}) {
  const isLoading = status === "loading";
  const isSuccess = status === "success";

  if (isSuccess && txDigest) {
    return (
      <div className="text-center py-8 animate-in fade-in zoom-in-95 duration-300">
        <div className="inline-flex items-center justify-center size-20 rounded-full bg-green-500/10 mb-6">
          <HiCheckCircle className="size-10 text-green-500" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          NFT Airdrop Successful!
        </h3>
        <p className="text-gray-500 mb-6">
          Successfully minted and sent {recipientCount} NFTs for &ldquo;{selectedArticle?.title}&rdquo;
        </p>
        <div className="bg-gray-100/50 rounded-lg px-4 py-3 mb-6 inline-block max-w-full">
          <p className="text-xs text-gray-500 mb-1">Transaction ID</p>
          <p className="font-mono text-sm text-gray-900 break-all">
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <HiSparkles className="size-5 text-primary" />
          NFT Airdrop Summary
        </h3>

        <div className="space-y-4">
          <div className="flex justify-between items-start py-3 border-b border-gray-200/50">
            <span className="text-gray-500">Article</span>
            <span className="font-medium text-gray-900 text-right max-w-[60%] line-clamp-2">
              {selectedArticle?.title}
            </span>
          </div>

          <div className="flex justify-between items-center py-3 border-b border-gray-200/50">
            <span className="text-gray-500">NFT Type</span>
            <Badge variant="secondary" className="font-medium">
              Article Access NFT
            </Badge>
          </div>

          <div className="flex justify-between items-center py-3 border-b border-gray-200/50">
            <span className="text-gray-500">Recipients</span>
            <Badge variant="secondary" className="font-semibold tabular-nums">
              {recipientCount.toLocaleString()} wallets
            </Badge>
          </div>

          <div className="flex justify-between items-center py-3 border-b border-gray-200/50">
            <span className="text-gray-500">Mint Price</span>
            <span className="font-medium text-green-600">Free</span>
          </div>

          <div className="flex justify-between items-center py-3 bg-primary/10 -mx-2 px-4 rounded-lg">
            <span className="font-medium text-gray-900">Total NFTs to Mint</span>
            <span className="text-lg font-bold text-primary tabular-nums">
              {recipientCount.toLocaleString()}
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
              This transaction involves minting {recipientCount} NFTs. Gas costs
              may be higher than usual and the transaction may take longer to process.
            </p>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl animate-in fade-in slide-in-from-top-2">
          <HiExclamationCircle className="size-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-600">
              Transaction Failed
            </p>
            <p className="text-sm text-red-600/80">{error}</p>
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
              Minting...
            </>
          ) : (
            <>
              <HiSparkles className="size-4" />
              Send NFT Airdrop
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// Main NFT Airdrop Content Component
export function NftAirdropContent({ publicationId }: NftAirdropContentProps) {
  const {
    step,
    selectedArticle,
    articles,
    isLoadingArticles,
    dateRange,
    customStartDate,
    customEndDate,
    recipientCount,
    isLoadingRecipients,
    status,
    error,
    txDigest,
    nextStep,
    prevStep,
    setSelectedArticle,
    fetchArticles,
    setDateRange,
    setCustomStartDate,
    setCustomEndDate,
    fetchRecipients,
    executeNftAirdrop,
    reset,
  } = useNftAirdrop({ publicationId });

  return (
    <>
      {/* Step Indicator */}
      <NftStepIndicator currentStep={step} />

      {/* Step Content */}
      {step === 1 && (
        <Step1ArticleSelection
          articles={articles}
          isLoadingArticles={isLoadingArticles}
          selectedArticle={selectedArticle}
          onSelectArticle={setSelectedArticle}
          onRefresh={fetchArticles}
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
          selectedArticle={selectedArticle}
          recipientCount={recipientCount}
          status={status}
          error={error}
          txDigest={txDigest}
          onExecute={executeNftAirdrop}
          onPrev={prevStep}
          onReset={reset}
        />
      )}
    </>
  );
}
