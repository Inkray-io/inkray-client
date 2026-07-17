import { useState, useEffect, useCallback } from 'react';
import { communitiesAPI } from '@/lib/api';
import { log } from '@/lib/utils/Logger';

export interface CommunitySummary {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  avatar: string | null;
  owner: string;
  memberCount: number;
  createdAt: string;
}

export interface CommunityViewerPub {
  publicationId: string;
  name: string | null;
  avatar: string | null;
  membership: 'member' | 'pending_application' | 'pending_invite' | 'none';
  inviteId: string | null;
}

export interface CommunityDetail extends CommunitySummary {
  isOwner: boolean;
  ownerIdentity?: OwnerIdentity;
  viewer: { publications: CommunityViewerPub[] } | null;
}

export interface OwnerIdentity {
  address: string | null;
  suinsName: string | null;
  x: { handle: string; url: string } | null;
}

export interface CommunityMember {
  publicationId: string;
  name: string | null;
  avatar: string | null;
  owner: string | null;
  isVerified: boolean;
  joinedVia: string;
  joinedAt: string;
  ownerIdentity?: OwnerIdentity;
}

export interface CommunityApplication {
  applicationId: string;
  status: string;
  message: string | null;
  createdAt: string;
  decidedAt: string | null;
  publication: {
    publicationId: string;
    name: string | null;
    avatar: string | null;
    owner: string | null;
    isVerified: boolean;
  };
  owner: OwnerIdentity;
}

export interface CommunityInvite {
  inviteId: string;
  community: { id: string; slug: string; name: string; avatar: string | null } | null;
  publication: { publicationId: string; name: string | null; avatar: string | null };
  createdAt: string;
}

const unwrap = (res: any) => res?.data?.data ?? res?.data;

/** Directory list, sorted by member count. */
export function useCommunities() {
  const [communities, setCommunities] = useState<CommunitySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = unwrap(await communitiesAPI.list());
      setCommunities(data?.communities ?? []);
    } catch (e) {
      log.error('Failed to load communities', e, 'useCommunities');
      setError('Failed to load communities');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);
  return { communities, isLoading, error, refresh: load };
}

/** Single community + viewer membership context. */
export function useCommunity(idOrSlug: string | null) {
  const [community, setCommunity] = useState<CommunityDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!idOrSlug) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      setCommunity(unwrap(await communitiesAPI.get(idOrSlug)));
    } catch (e: any) {
      log.error('Failed to load community', e, 'useCommunity');
      setError(e?.response?.status === 404 ? 'Community not found' : 'Failed to load community');
    } finally {
      setIsLoading(false);
    }
  }, [idOrSlug]);

  useEffect(() => {
    load();
  }, [load]);
  return { community, isLoading, error, refresh: load };
}

/** Public member (publication) list. */
export function useCommunityMembers(idOrSlug: string | null) {
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!idOrSlug) return;
    setIsLoading(true);
    try {
      const data = unwrap(await communitiesAPI.getMembers(idOrSlug));
      setMembers(data?.members ?? []);
    } catch (e) {
      log.error('Failed to load members', e, 'useCommunityMembers');
    } finally {
      setIsLoading(false);
    }
  }, [idOrSlug]);

  useEffect(() => {
    load();
  }, [load]);
  return { members, isLoading, refresh: load };
}

/** Community feed with cursor "load more" (endpoint returns a raw feed response). */
export function useCommunityFeed(idOrSlug: string | null) {
  const [articles, setArticles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(false);

  const fetchPage = useCallback(
    async (nextCursor?: string) => {
      if (!idOrSlug) return;
      setIsLoading(true);
      try {
        const res = await communitiesAPI.getFeed(idOrSlug, { cursor: nextCursor, limit: 20 });
        const feed = res.data; // raw feed response (not the {success,data} envelope)
        const items = feed?.articles ?? [];
        setArticles((prev) => (nextCursor ? [...prev, ...items] : items));
        setHasMore(!!feed?.meta?.hasMore);
        setCursor(feed?.meta?.nextCursor ?? undefined);
      } catch (e) {
        log.error('Failed to load community feed', e, 'useCommunityFeed');
      } finally {
        setIsLoading(false);
      }
    },
    [idOrSlug],
  );

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (hasMore && cursor) fetchPage(cursor);
  }, [hasMore, cursor, fetchPage]);

  return { articles, isLoading, hasMore, loadMore, refresh: () => fetchPage() };
}

/** Owner-only: applications to this community. */
export function useCommunityApplications(idOrSlug: string | null, enabled: boolean) {
  const [applications, setApplications] = useState<CommunityApplication[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    if (!idOrSlug || !enabled) return;
    setIsLoading(true);
    try {
      const data = unwrap(await communitiesAPI.getApplications(idOrSlug));
      setApplications(data?.applications ?? []);
    } catch (e) {
      log.error('Failed to load applications', e, 'useCommunityApplications');
    } finally {
      setIsLoading(false);
    }
  }, [idOrSlug, enabled]);

  useEffect(() => {
    load();
  }, [load]);
  return { applications, isLoading, refresh: load };
}

export interface CommunitySentInvite {
  inviteId: string;
  status: string;
  createdAt: string;
  publication: {
    publicationId: string;
    name: string | null;
    avatar: string | null;
    owner: string | null;
    isVerified: boolean;
  };
  owner: OwnerIdentity;
}

/** Owner-only: invites this community has sent (default: pending). */
export function useCommunityInvites(idOrSlug: string | null, enabled: boolean) {
  const [invites, setInvites] = useState<CommunitySentInvite[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    if (!idOrSlug || !enabled) return;
    setIsLoading(true);
    try {
      const data = unwrap(await communitiesAPI.getInvites(idOrSlug));
      setInvites(data?.invites ?? []);
    } catch (e) {
      log.error('Failed to load community invites', e, 'useCommunityInvites');
    } finally {
      setIsLoading(false);
    }
  }, [idOrSlug, enabled]);

  useEffect(() => {
    load();
  }, [load]);
  return { invites, isLoading, refresh: load };
}

/** Pending community invites across publications the current user owns. */
export function useMyCommunityInvites(enabled = true) {
  const [invites, setInvites] = useState<CommunityInvite[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    if (!enabled) return;
    setIsLoading(true);
    try {
      const data = unwrap(await communitiesAPI.myInvites());
      setInvites(data?.invites ?? []);
    } catch (e) {
      log.error('Failed to load community invites', e, 'useMyCommunityInvites');
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    load();
  }, [load]);
  return { invites, isLoading, refresh: load };
}
