"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useSuiNS } from '@/hooks/useSuiNS';
import { formatAddress, copyToClipboard } from '@/utils/address';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/lib/utils';
import { HiClipboardDocument, HiCheck } from 'react-icons/hi2';

export type AddressDisplayVariant = 'full' | 'compact' | 'minimal';

interface AddressDisplayProps {
  address: string;
  variant?: AddressDisplayVariant;
  /** Pre-resolved SuiNS name (skips API call if provided) */
  suiNSName?: string;
  /** Whether to show a loading skeleton while resolving */
  isLoading?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Show copy button (only for full variant) */
  showCopyButton?: boolean;
  /** Make the name a link to the profile */
  linkToProfile?: boolean;
  /** Custom text size class */
  textSize?: string;
}

/**
 * AddressDisplay - Displays wallet addresses with SuiNS name resolution
 *
 * Variants:
 * - full: Shows SuiNS name prominently with address below (for profiles)
 * - compact: Shows SuiNS name only with fallback to short address (for feeds)
 * - minimal: Shows first 2 characters uppercase (for avatars)
 */
export function AddressDisplay({
  address,
  variant = 'compact',
  suiNSName: providedName,
  isLoading: externalLoading = false,
  className,
  showCopyButton = false,
  linkToProfile = false,
  textSize,
}: AddressDisplayProps) {
  const [copied, setCopied] = useState(false);

  // Only fetch SuiNS if not provided
  const { name: resolvedName, loading: suiNSLoading } = useSuiNS(
    providedName === undefined ? address : undefined
  );

  const displayName = providedName ?? resolvedName;
  const shortAddress = formatAddress(address);
  const isLoading = externalLoading || (providedName === undefined && suiNSLoading);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await copyToClipboard(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  // Minimal variant - just initials
  if (variant === 'minimal') {
    const initials = (displayName || shortAddress).slice(0, 2).toUpperCase();
    return (
      <span className={cn("font-medium", className)}>
        {isLoading ? (
          <Skeleton className="w-5 h-4 inline-block" />
        ) : (
          initials
        )}
      </span>
    );
  }

  // Full variant - name on top, address below
  if (variant === 'full') {
    const content = (
      <div className={cn("flex flex-col", className)}>
        {isLoading ? (
          <>
            <Skeleton className="h-5 w-24 mb-1" />
            <Skeleton className="h-3 w-20" />
          </>
        ) : (
          <>
            <span className={cn("font-semibold text-gray-900", textSize || "text-base")}>
              {displayName || shortAddress}
            </span>
            {displayName && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs text-gray-400 font-mono">
                  {shortAddress}
                </span>
                {showCopyButton && (
                  <button
                    onClick={handleCopy}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title="Copy address"
                  >
                    {copied ? (
                      <HiCheck className="w-3 h-3 text-green-500" />
                    ) : (
                      <HiClipboardDocument className="w-3 h-3" />
                    )}
                  </button>
                )}
              </div>
            )}
            {!displayName && showCopyButton && (
              <button
                onClick={handleCopy}
                className="text-gray-400 hover:text-gray-600 transition-colors mt-0.5 flex items-center gap-1 text-xs"
                title="Copy address"
              >
                {copied ? (
                  <>
                    <HiCheck className="w-3 h-3 text-green-500" />
                    <span className="text-green-500">Copied</span>
                  </>
                ) : (
                  <>
                    <HiClipboardDocument className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            )}
          </>
        )}
      </div>
    );

    if (linkToProfile && !isLoading) {
      return (
        <Link href={ROUTES.PROFILE_WITH_ID(address)} className="hover:opacity-80 transition-opacity">
          {content}
        </Link>
      );
    }

    return content;
  }

  // Compact variant - single line, name or short address
  const compactContent = (
    <span className={cn("truncate", textSize || "text-sm", className)}>
      {isLoading ? (
        <Skeleton className="h-4 w-20 inline-block" />
      ) : (
        displayName || shortAddress
      )}
    </span>
  );

  if (linkToProfile && !isLoading) {
    return (
      <Link
        href={ROUTES.PROFILE_WITH_ID(address)}
        className="hover:underline hover:text-primary transition-colors"
      >
        {compactContent}
      </Link>
    );
  }

  return compactContent;
}

export default AddressDisplay;
