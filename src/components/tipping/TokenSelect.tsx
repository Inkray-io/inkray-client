"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { SuiIcon } from "@/components/ui/SuiIcon";
import { formatTokenBalance, type TokenBalance } from "@/hooks/useWalletBalances";
import { isSuiCoinType } from "@/lib/tip-swap";
import { cn } from "@/lib/utils";

interface TokenSelectProps {
  tokens: TokenBalance[];
  /** Selected coin type. Matched leniently so short/normalized SUI both resolve. */
  value: string;
  onChange: (coinType: string) => void;
  disabled?: boolean;
}

/** SUI always first, then everything else by balance, largest first. */
function sortTokens(tokens: TokenBalance[]): TokenBalance[] {
  return [...tokens].sort((a, b) => {
    const aSui = isSuiCoinType(a.coinType);
    const bSui = isSuiCoinType(b.coinType);
    if (aSui !== bSui) return aSui ? -1 : 1;
    if (a.totalBalance === b.totalBalance) return 0;
    return a.totalBalance > b.totalBalance ? -1 : 1;
  });
}

function resolveSelected(
  tokens: TokenBalance[],
  value: string,
): TokenBalance | undefined {
  return (
    tokens.find((t) => t.coinType === value) ??
    (isSuiCoinType(value)
      ? tokens.find((t) => isSuiCoinType(t.coinType))
      : undefined) ??
    tokens[0]
  );
}

/**
 * Token picker for the tip flow. Shows each token's icon, name, and available
 * balance — SUI pinned first, the rest ordered by balance — so paying with any
 * coin reads like glancing at your wallet.
 */
export function TokenSelect({
  tokens,
  value,
  onChange,
  disabled,
}: TokenSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const sorted = useMemo(() => sortTokens(tokens), [tokens]);
  const selected = resolveSelected(sorted, value);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Move focus into the list when it opens, starting on the selected row.
  useEffect(() => {
    if (!open) return;
    const items = listRef.current?.querySelectorAll<HTMLButtonElement>(
      "[data-token-option]",
    );
    if (!items?.length) return;
    const selectedIdx = Math.max(
      0,
      sorted.findIndex((t) => t.coinType === selected?.coinType),
    );
    items[selectedIdx]?.focus();
  }, [open, sorted, selected?.coinType]);

  const moveFocus = (dir: 1 | -1) => {
    const items = Array.from(
      listRef.current?.querySelectorAll<HTMLButtonElement>(
        "[data-token-option]",
      ) ?? [],
    );
    if (!items.length) return;
    const current = items.indexOf(
      document.activeElement as HTMLButtonElement,
    );
    const next = (current + dir + items.length) % items.length;
    items[next]?.focus();
  };

  const pick = (coinType: string) => {
    onChange(coinType);
    setOpen(false);
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className="flex h-14 w-full items-center gap-3 rounded-lg border border-input bg-transparent px-3 text-left outline-none transition-colors hover:bg-muted/50 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50"
      >
        {selected && <TokenAvatar token={selected} size={30} />}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold leading-tight">
            {selected?.symbol ?? "—"}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {selected?.name ?? "Select a token"}
          </span>
        </span>
        {selected && (
          <span className="text-right">
            <span className="block text-sm font-medium leading-tight tabular-nums">
              {formatTokenBalance(selected.totalBalance, selected.decimals)}
            </span>
            <span className="block text-[11px] text-muted-foreground">
              available
            </span>
          </span>
        )}
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div
          ref={listRef}
          role="listbox"
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              moveFocus(1);
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              moveFocus(-1);
            }
          }}
          className="absolute z-50 mt-1.5 max-h-64 w-full overflow-auto rounded-xl border bg-background p-1 shadow-lg"
        >
          {sorted.map((token) => {
            const isSelected = token.coinType === selected?.coinType;
            return (
              <button
                key={token.coinType}
                type="button"
                data-token-option
                role="option"
                aria-selected={isSelected}
                onClick={() => pick(token.coinType)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left outline-none transition-colors focus-visible:ring-[2px] focus-visible:ring-ring/50",
                  isSelected ? "bg-rose-50" : "hover:bg-muted",
                )}
              >
                <TokenAvatar token={token} size={30} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold leading-tight">
                    {token.symbol}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {token.name}
                  </span>
                </span>
                <span className="text-right">
                  <span className="block text-sm font-medium leading-tight tabular-nums">
                    {formatTokenBalance(token.totalBalance, token.decimals)}
                  </span>
                  <span className="block text-[11px] text-muted-foreground">
                    available
                  </span>
                </span>
                <Check
                  className={cn(
                    "h-4 w-4 shrink-0 text-rose-600",
                    isSelected ? "opacity-100" : "opacity-0",
                  )}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TokenAvatar({ token, size }: { token: TokenBalance; size: number }) {
  const cls = "shrink-0 rounded-full";
  if (isSuiCoinType(token.coinType)) {
    return (
      <span
        className={cn(cls, "flex items-center justify-center bg-muted")}
        style={{ width: size, height: size }}
      >
        <SuiIcon size={Math.round(size * 0.62)} />
      </span>
    );
  }
  if (token.iconUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={token.iconUrl}
        alt=""
        className={cn(cls, "object-cover")}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className={cn(
        cls,
        "flex items-center justify-center bg-muted-foreground/15 font-bold text-muted-foreground",
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
    >
      {token.symbol.slice(0, 1)}
    </span>
  );
}
