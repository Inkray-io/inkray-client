'use client';

import { useEffect, useState } from 'react';
import { HiUserGroup } from 'react-icons/hi2';
import { communitiesAPI } from '@/lib/api';
import { log } from '@/lib/utils/Logger';

interface PublishableCommunity {
  id: string;
  name: string;
}

/**
 * Publish-time community selector. Lists the communities the author's publication
 * is a member of; picking one tags the post into that community's feed (it still
 * shows in the normal feeds). Renders nothing if the publication can't publish
 * into any community.
 */
export function CommunityPublishSelector({
  publicationId,
  value,
  onChange,
}: {
  publicationId?: string;
  value: string | null;
  onChange: (communityId: string | null) => void;
}) {
  const [communities, setCommunities] = useState<PublishableCommunity[]>([]);

  useEffect(() => {
    if (!publicationId) return;
    let active = true;
    communitiesAPI
      .getPublishable(publicationId)
      .then((r) => {
        const data = r.data?.data ?? r.data;
        if (active) setCommunities(data?.communities ?? []);
      })
      .catch((e) => {
        log.warn('Failed to load publishable communities', e, 'CommunityPublishSelector');
        if (active) setCommunities([]);
      });
    return () => {
      active = false;
    };
  }, [publicationId]);

  // Nothing to offer — keep the toolbar clean.
  if (communities.length === 0) return null;

  return (
    <div
      className="flex min-h-[38px] items-center gap-1.5 rounded-lg border border-gray-200 pl-2.5 pr-1"
      title="Also publish this post into a community"
    >
      <HiUserGroup className="size-4 shrink-0 text-gray-400" />
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        className="max-w-[150px] cursor-pointer truncate bg-transparent py-1 pr-1 text-sm text-gray-700 focus:outline-none"
      >
        <option value="">No community</option>
        {communities.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}
