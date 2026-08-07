"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useCurrentClient } from "@mysten/dapp-kit-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ConnectButton } from "@/components/wallet/connect";
import { SuiIcon } from "@/components/ui/SuiIcon";
import { ArrowDown, Heart, Loader2 } from "lucide-react";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { useEnhancedTransaction } from "@/hooks/useEnhancedTransaction";
import {
  useWalletBalances,
  formatTokenBalance,
  parseAmountToSmallestUnit,
  type TokenBalance,
} from "@/hooks/useWalletBalances";
import { useToast } from "@/hooks/use-toast";
import { MIN_TIP_AMOUNT, MIST_PER_SUI } from "@/constants/tipping";
import {
  buildTipTransaction,
  getTipQuote,
  isSuiCoinType,
  isTipSwapSupported,
  SUI_COIN_TYPE,
  type TipQuote,
} from "@/lib/tip-swap";
import { log } from "@/lib/utils/Logger";

interface TipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  publicationId: string;
  /** What the tip supports, shown in the subtitle (article title / publication name). */
  supportLabel: string;
  /** Who receives it, used in body copy. e.g. "the writer" / "this publication". */
  recipientLabel: string;
  onTipSuccess?: () => void;
}

const SUI_PRESETS = ["0.1", "0.5", "1", "5"] as const;
const PERCENT_PRESETS = [25, 50, 100] as const;
const QUOTE_DEBOUNCE_MS = 450;

/** MIST (bigint) → trimmed SUI string, max 4 decimals. */
function formatSui(mist: bigint): string {
  const sui = Number(mist) / MIST_PER_SUI;
  return sui.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

/** Base units (bigint) → full-precision decimal string. */
function baseUnitsToDecimalString(base: bigint, decimals: number): string {
  const divisor = BigInt(10) ** BigInt(decimals);
  const whole = base / divisor;
  const frac = base % divisor;
  if (frac === BigInt(0)) return whole.toString();
  const fracStr = frac.toString().padStart(decimals, "0").replace(/0+$/, "");
  return `${whole}.${fracStr}`;
}

const SYNTHETIC_SUI: TokenBalance = {
  coinType: SUI_COIN_TYPE,
  symbol: "SUI",
  name: "Sui",
  totalBalance: BigInt(0),
  decimals: 9,
};

export function TipDialog({
  open,
  onOpenChange,
  publicationId,
  supportLabel,
  recipientLabel,
  onTipSuccess,
}: TipDialogProps) {
  const { account, address } = useWalletConnection();
  const client = useCurrentClient();
  const { signAndExecuteTransaction } = useEnhancedTransaction();
  const { toast } = useToast();
  const { balances } = useWalletBalances(open ? address : undefined);

  const [payCoinType, setPayCoinType] = useState<string>(SUI_COIN_TYPE);
  const [amountStr, setAmountStr] = useState("");
  const [isTipping, setIsTipping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live token→SUI quote (only when paying with a non-SUI token).
  const [quote, setQuote] = useState<TipQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteMissing, setQuoteMissing] = useState(false);
  const quoteReq = useRef(0);

  // Reset to a clean slate whenever the dialog opens.
  useEffect(() => {
    if (open) {
      setPayCoinType(SUI_COIN_TYPE);
      setAmountStr("");
      setError(null);
      setQuote(null);
      setQuoteMissing(false);
    }
  }, [open]);

  // The list of tokens the reader can pay with. Always offer SUI, even at 0
  // balance, so the default path is never missing. Non-SUI tokens require the 7K
  // swap, which is mainnet-only — elsewhere we restrict to SUI.
  const swapSupported = isTipSwapSupported();
  const payOptions = useMemo<TokenBalance[]>(() => {
    const withSui = balances.some((b) => isSuiCoinType(b.coinType))
      ? balances
      : [SYNTHETIC_SUI, ...balances];
    return swapSupported ? withSui : withSui.filter((b) => isSuiCoinType(b.coinType));
  }, [balances, swapSupported]);

  const payToken = useMemo<TokenBalance>(
    () =>
      payOptions.find((b) => b.coinType === payCoinType) ?? SYNTHETIC_SUI,
    [payOptions, payCoinType],
  );

  const isSui = isSuiCoinType(payToken.coinType);

  const amountInBase = useMemo<bigint>(() => {
    if (!amountStr) return BigInt(0);
    try {
      return parseAmountToSmallestUnit(amountStr, payToken.decimals);
    } catch {
      return BigInt(0);
    }
  }, [amountStr, payToken.decimals]);

  const exceedsBalance = amountInBase > payToken.totalBalance;

  // SUI they receive: 1:1 when paying SUI, otherwise the swap output.
  const receiveMist: bigint | null = isSui
    ? amountInBase
    : quote?.amountOut ?? null;

  // Fetch a quote (debounced) when swapping a non-SUI token.
  useEffect(() => {
    if (!open || isSui || amountInBase <= BigInt(0) || exceedsBalance) {
      setQuote(null);
      setQuoteLoading(false);
      setQuoteMissing(false);
      return;
    }
    const req = ++quoteReq.current;
    setQuoteLoading(true);
    setQuoteMissing(false);
    const timer = setTimeout(async () => {
      try {
        const result = await getTipQuote({
          client,
          coinTypeIn: payToken.coinType,
          amountIn: amountInBase,
          signer: address,
        });
        if (req !== quoteReq.current) return;
        setQuote(result);
        setQuoteMissing(result === null);
      } catch (err) {
        if (req !== quoteReq.current) return;
        log.debug("Tip quote failed", { err }, "TipDialog");
        setQuote(null);
        setQuoteMissing(true);
      } finally {
        if (req === quoteReq.current) setQuoteLoading(false);
      }
    }, QUOTE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [open, isSui, amountInBase, exceedsBalance, payToken.coinType, client, address]);

  // Why the primary action is blocked (null = good to go).
  const blockReason: string | null = (() => {
    if (amountInBase <= BigInt(0)) return null; // just empty, no error styling
    if (exceedsBalance) return `Not enough ${payToken.symbol}`;
    if (isSui) {
      if (amountInBase < BigInt(MIN_TIP_AMOUNT)) return "Minimum tip is 0.01 SUI";
      return null;
    }
    if (quoteLoading) return null;
    if (quoteMissing) return `${payToken.symbol} can't be swapped right now`;
    if (quote && quote.amountOut < BigInt(MIN_TIP_AMOUNT))
      return "Too small — they'd receive under 0.01 SUI";
    return null;
  })();

  const canSubmit =
    !!account &&
    amountInBase > BigInt(0) &&
    !exceedsBalance &&
    !isTipping &&
    !blockReason &&
    (isSui || (!!quote && !quoteLoading));

  const handlePercent = (pct: number) => {
    const base = (payToken.totalBalance * BigInt(pct)) / BigInt(100);
    setAmountStr(baseUnitsToDecimalString(base, payToken.decimals));
  };

  const handleAmountChange = (raw: string) => {
    // Allow only a decimal number.
    if (raw === "" || /^\d*\.?\d*$/.test(raw)) setAmountStr(raw);
  };

  const handleSubmit = async () => {
    if (!account || !address || !canSubmit) return;
    setIsTipping(true);
    setError(null);
    try {
      let activeQuote = quote?.quote;
      if (!isSui) {
        // Re-quote right before building so we swap on a fresh route/price.
        const fresh = await getTipQuote({
          client,
          coinTypeIn: payToken.coinType,
          amountIn: amountInBase,
          signer: address,
        });
        if (!fresh) throw new Error("Couldn't get a price for this token. Try again.");
        activeQuote = fresh.quote;
      }

      const tx = await buildTipTransaction({
        client,
        publicationId,
        coinTypeIn: payToken.coinType,
        amountIn: amountInBase,
        signer: address,
        quote: activeQuote,
      });

      const result = await signAndExecuteTransaction({ transaction: tx });
      log.debug("Tip successful", { result }, "TipDialog");

      toast({
        title: "Tip sent!",
        description: `Thanks for supporting ${recipientLabel}.`,
      });
      onOpenChange(false);
      onTipSuccess?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't send the tip. Please try again.",
      );
    } finally {
      setIsTipping(false);
    }
  };

  const submitLabel = isTipping
    ? "Sending…"
    : quoteLoading && !isSui && amountInBase > BigInt(0)
      ? "Finding best price…"
      : isSui
        ? "Send tip"
        : "Swap & send tip";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
              <Heart className="h-5 w-5" fill="currentColor" />
            </span>
            <div className="min-w-0">
              <DialogTitle className="text-lg leading-tight">Send a tip</DialogTitle>
              <p className="truncate text-sm text-muted-foreground">
                Support {supportLabel}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 pt-1">
          {/* Amount */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="tip-amount" className="text-sm font-medium">
                Amount
              </label>
              {!isSui && (
                <span className="text-xs text-muted-foreground">
                  Balance: {formatTokenBalance(payToken.totalBalance, payToken.decimals)}{" "}
                  {payToken.symbol}
                </span>
              )}
            </div>

            <div className="relative">
              <input
                id="tip-amount"
                type="text"
                inputMode="decimal"
                placeholder="0.0"
                value={amountStr}
                onChange={(e) => handleAmountChange(e.target.value)}
                disabled={isTipping}
                className="no-spinner h-12 w-full rounded-lg border border-input bg-transparent px-3 pr-20 text-lg font-medium outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1.5 text-sm font-medium text-muted-foreground">
                <TokenGlyph token={payToken} />
                {payToken.symbol}
              </span>
            </div>

            {/* Quick amounts */}
            <div className="grid grid-cols-4 gap-2">
              {isSui
                ? SUI_PRESETS.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setAmountStr(v)}
                      disabled={isTipping}
                      className={presetClass(amountStr === v)}
                    >
                      {v}
                    </button>
                  ))
                : PERCENT_PRESETS.map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => handlePercent(pct)}
                      disabled={isTipping || payToken.totalBalance === BigInt(0)}
                      className={presetClass(false) + " col-span-1 last:col-span-2"}
                    >
                      {pct === 100 ? "Max" : `${pct}%`}
                    </button>
                  ))}
            </div>
          </div>

          {/* Pay with — only when there's a real choice (mainnet + other tokens held) */}
          {payOptions.length > 1 && (
          <div className="space-y-2">
            <label htmlFor="tip-token" className="text-sm font-medium">
              Pay with
            </label>
            <div className="relative">
              <select
                id="tip-token"
                value={payToken.coinType}
                onChange={(e) => {
                  setPayCoinType(e.target.value);
                  setAmountStr("");
                }}
                disabled={isTipping}
                className="h-11 w-full appearance-none rounded-lg border border-input bg-transparent px-3 pr-9 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50"
              >
                {payOptions.map((t) => (
                  <option key={t.coinType} value={t.coinType}>
                    {t.symbol}
                    {t.totalBalance > BigInt(0)
                      ? ` — ${formatTokenBalance(t.totalBalance, t.decimals)} available`
                      : ""}
                  </option>
                ))}
              </select>
              <ArrowDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>
          )}

          {/* Conversion — the "what actually happens" card */}
          {!isSui && amountInBase > BigInt(0) && !exceedsBalance && (
            <div className="rounded-xl border bg-muted/40 p-3">
              <Row
                label="You pay"
                value={`${amountStr} ${payToken.symbol}`}
                glyph={<TokenGlyph token={payToken} />}
              />
              <div className="my-1 flex items-center gap-2 pl-1 text-xs text-muted-foreground">
                <ArrowDown className="h-3.5 w-3.5" />
                swapped to SUI via 7K
              </div>
              <Row
                label={`${capitalize(recipientLabel)} receives`}
                value={
                  quoteLoading
                    ? "…"
                    : receiveMist != null
                      ? `≈ ${formatSui(receiveMist)} SUI`
                      : "—"
                }
                glyph={<SuiIcon size={16} />}
                emphasize
              />
            </div>
          )}

          {/* SUI path: quiet reassurance line */}
          {isSui && amountInBase > BigInt(0) && !exceedsBalance && !blockReason && (
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <SuiIcon size={14} />
              {capitalize(recipientLabel)} receives {formatSui(amountInBase)} SUI
            </p>
          )}

          {/* Block reason / error */}
          {blockReason && amountInBase > BigInt(0) && (
            <p className="text-sm text-amber-600">{blockReason}</p>
          )}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Action */}
          {account ? (
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="h-11 w-full bg-rose-600 text-white hover:bg-rose-700"
            >
              {isTipping || (quoteLoading && !isSui && amountInBase > BigInt(0)) ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Heart className="mr-2 h-4 w-4" fill="currentColor" />
              )}
              {submitLabel}
            </Button>
          ) : (
            <div className="flex flex-col items-stretch gap-2">
              <p className="text-center text-sm text-muted-foreground">
                Connect your wallet to send a tip.
              </p>
              <ConnectButton />
            </div>
          )}

          <p className="text-center text-xs text-muted-foreground">
            Pay with any token in your wallet — creators always receive SUI.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({
  label,
  value,
  glyph,
  emphasize,
}: {
  label: string;
  value: string;
  glyph: React.ReactNode;
  emphasize?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={
          "flex items-center gap-1.5 " +
          (emphasize ? "text-base font-semibold" : "text-sm font-medium")
        }
      >
        {glyph}
        {value}
      </span>
    </div>
  );
}

function TokenGlyph({ token }: { token: TokenBalance }) {
  if (isSuiCoinType(token.coinType)) return <SuiIcon size={16} />;
  if (token.iconUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={token.iconUrl}
        alt=""
        className="h-4 w-4 rounded-full object-cover"
      />
    );
  }
  return (
    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-muted-foreground/20 text-[9px] font-bold">
      {token.symbol.slice(0, 1)}
    </span>
  );
}

function presetClass(active: boolean): string {
  return (
    "rounded-lg border px-2 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 " +
    (active
      ? "border-rose-600 bg-rose-50 text-rose-700"
      : "border-input hover:bg-muted")
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
