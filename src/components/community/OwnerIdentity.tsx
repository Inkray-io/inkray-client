'use client';

import Link from 'next/link';
import { SiX } from 'react-icons/si';
import { formatAddress } from '@/utils/address';
import { ROUTES } from '@/constants/routes';
import type { OwnerIdentity as OwnerIdentityData } from '@/hooks/useCommunities';

/**
 * Applicant / member / owner identity so anyone viewing can recognize who's
 * behind a publication: SuiNS name (if any), the wallet address (links to that
 * person's Inkray profile), and their connected/profile X account.
 *
 * - `variant="stacked"` (default): SuiNS on its own line, address + X below.
 *   Best inside list rows under a bold publication name.
 * - `variant="inline"`: a single wrapping row — SuiNS · address · X.
 *   Best on one line next to a label (e.g. "Owned by …").
 */
export function OwnerIdentity({
  owner,
  variant = 'stacked',
  className = '',
}: {
  owner?: OwnerIdentityData | null;
  variant?: 'stacked' | 'inline';
  className?: string;
}) {
  if (!owner?.address) return null;
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  const addressLink = (
    <Link
      href={ROUTES.PROFILE_WITH_ID(owner.address)}
      onClick={stop}
      className="font-mono text-[11px] text-gray-400 hover:text-primary hover:underline"
      title="View profile"
    >
      {formatAddress(owner.address)}
    </Link>
  );
  const xLink = owner.x ? (
    <a
      href={owner.x.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={stop}
      className="inline-flex items-center gap-0.5 text-[11px] text-gray-400 hover:text-gray-900"
      title={`@${owner.x.handle} on X`}
    >
      <SiX className="size-2.5" />
      {owner.x.handle}
    </a>
  ) : null;

  if (variant === 'inline') {
    const dot = <span className="text-gray-300">·</span>;
    return (
      <span className={`inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5 ${className}`}>
        {owner.suinsName && (
          <span className="text-xs font-medium text-gray-700">{owner.suinsName}</span>
        )}
        {owner.suinsName && dot}
        {addressLink}
        {xLink && dot}
        {xLink}
      </span>
    );
  }

  return (
    <div className={`mt-0.5 space-y-0.5 ${className}`}>
      {owner.suinsName && (
        <div className="truncate text-xs font-medium text-gray-700">{owner.suinsName}</div>
      )}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
        {addressLink}
        {xLink}
      </div>
    </div>
  );
}
