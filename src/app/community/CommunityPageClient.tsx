'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { HiUserGroup, HiCog6Tooth, HiCheckBadge, HiCheck, HiXMark } from 'react-icons/hi2';
import { AppLayout } from '@/components/layout/AppLayout';
import { FeedArticleCard } from '@/components/feed/FeedArticleCard';
import { FeedPostSkeleton } from '@/components/feed/FeedPostSkeleton';
import { TopWriters } from '@/components/widgets/TopWriters';
import { LeaderboardWidget } from '@/components/widgets/LeaderboardWidget';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/Avatar';
import { OwnerIdentity } from '@/components/community/OwnerIdentity';
import { PublicationLink } from '@/components/community/PublicationLink';
import { createPublicationAvatarConfig } from '@/lib/utils/avatar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  useCommunity,
  useCommunityFeed,
  useCommunityMembers,
  CommunityViewerPub,
} from '@/hooks/useCommunities';
import { communitiesAPI } from '@/lib/api';
import { useArticleDeletion } from '@/hooks/useArticleDeletion';
import { ROUTES } from '@/constants/routes';

type Tab = 'feed' | 'members';

export function CommunityPageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const idOrSlug = searchParams.get('id');
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [tab, setTab] = useState<Tab>('feed');
  const [busy, setBusy] = useState(false);

  const { community, isLoading, error, refresh } = useCommunity(idOrSlug);
  const { articles, isLoading: feedLoading, hasMore, loadMore, refresh: refreshFeed } =
    useCommunityFeed(idOrSlug);
  const { members, isLoading: membersLoading } = useCommunityMembers(idOrSlug);

  // Match the normal feed: authors can delete their own posts inline.
  const { deleteArticle, isDeletingArticle } = useArticleDeletion({
    onSuccess: () => refreshFeed(),
    onError: (e) => console.error('Failed to delete article:', e),
  });
  const handleDeleteArticle = (articleId: string, publicationId: string, vaultId: string) =>
    deleteArticle({ articleId, publicationId, vaultId });

  const viewerPubs = community?.viewer?.publications ?? [];
  const invitePub = viewerPubs.find((p) => p.membership === 'pending_invite');
  const memberPubs = viewerPubs.filter((p) => p.membership === 'member');
  const pendingPubs = viewerPubs.filter((p) => p.membership === 'pending_application');
  const eligiblePubs = viewerPubs.filter((p) => p.membership === 'none');

  const act = async (fn: () => Promise<any>, ok: string) => {
    setBusy(true);
    try {
      await fn();
      toast({ title: ok });
      await refresh();
    } catch (e: any) {
      toast({
        title: e?.response?.data?.error?.message || e?.response?.data?.message || 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  };

  if (isLoading) {
    return (
      <AppLayout currentPage="communities">
        <div className="mb-6 h-28 animate-pulse rounded-2xl bg-white" />
        <div className="space-y-5">
          <FeedPostSkeleton />
          <FeedPostSkeleton />
        </div>
      </AppLayout>
    );
  }

  if (error || !community) {
    return (
      <AppLayout currentPage="communities">
        <div className="rounded-2xl bg-white p-10 text-center">
          <HiUserGroup className="mx-auto size-10 text-gray-300" />
          <p className="mt-3 font-semibold text-gray-900">{error || 'Community not found'}</p>
          <Button onClick={() => router.push(ROUTES.COMMUNITIES)} variant="outline" className="mt-4">
            Browse communities
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      currentPage="communities"
      rightSidebar={
        <>
          <TopWriters />
          <LeaderboardWidget />
        </>
      }
    >
      {/* Header / masthead */}
      <div className="mb-5 rounded-2xl bg-white p-6">
        <div className="flex items-start gap-4">
          {community.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={community.avatar} alt={community.name} className="size-16 rounded-2xl object-cover" />
          ) : (
            <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <HiUserGroup className="size-8" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            {/* Title */}
            <div className="flex items-center gap-2">
              <h1 className="truncate text-xl font-bold text-gray-900">{community.name}</h1>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                Beta
              </span>
            </div>

            {/* Owner — one clean line */}
            {community.ownerIdentity?.address && (
              <div className="mt-1 flex flex-wrap items-center gap-x-1.5">
                <span className="text-xs text-gray-400">Owned by</span>
                <OwnerIdentity owner={community.ownerIdentity} variant="inline" />
              </div>
            )}

            {/* Description */}
            {community.description && (
              <p className="mt-2.5 text-sm leading-relaxed text-gray-600">{community.description}</p>
            )}

            {/* Stats */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600">
                <HiUserGroup className="size-3.5 text-gray-400" />
                {community.memberCount} {community.memberCount === 1 ? 'publication' : 'publications'}
              </span>
            </div>
          </div>
          <div className="shrink-0">
            {community.isOwner ? (
              <Link href={ROUTES.COMMUNITY_SETTINGS(community.slug)}>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <HiCog6Tooth className="size-4" /> Manage
                </Button>
              </Link>
            ) : (
              <JoinAction
                busy={busy}
                invitePub={invitePub}
                memberPubs={memberPubs}
                pendingPubs={pendingPubs}
                eligiblePubs={eligiblePubs}
                onApply={(pubId) =>
                  act(() => communitiesAPI.apply(community.slug, pubId), 'Application submitted')
                }
                onAcceptInvite={(inviteId) =>
                  act(() => communitiesAPI.acceptInvite(inviteId), 'Invite accepted')
                }
                onDeclineInvite={(inviteId) =>
                  act(() => communitiesAPI.declineInvite(inviteId), 'Invite declined')
                }
                onNeedPublication={() => {
                  // Gate order mirrors /create: log in first, then create a
                  // publication (feeds are public, so a logged-out viewer can
                  // reach this button too).
                  if (!isAuthenticated) {
                    toast({
                      title: 'Sign in to join',
                      description: 'Connect your wallet, then create a publication to join.',
                    });
                    router.push(ROUTES.AUTH);
                    return;
                  }
                  toast({
                    title: 'Publication required',
                    description: 'Create a publication first — communities are joined as a publication.',
                  });
                  router.push(ROUTES.CREATE_PUBLICATION);
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-5 flex gap-1 rounded-xl bg-white p-1">
        {(['feed', 'members'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium capitalize transition-colors ${
              tab === t ? 'bg-primary/10 text-primary' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            {t === 'members' ? `Members (${community.memberCount})` : 'Feed'}
          </button>
        ))}
      </div>

      {tab === 'feed' && (
        <div className="space-y-5">
          {feedLoading && articles.length === 0 && (
            <>
              <FeedPostSkeleton />
              <FeedPostSkeleton />
            </>
          )}
          {!feedLoading && articles.length === 0 && (
            <div className="rounded-2xl bg-white p-10 text-center text-gray-500">
              No articles from member publications yet.
            </div>
          )}
          {articles.map((article: any) => (
            <FeedArticleCard
              key={article.articleId}
              article={article}
              onDelete={handleDeleteArticle}
              isDeleting={isDeletingArticle(article.articleId)}
            />
          ))}
          {hasMore && (
            <div className="pt-2 text-center">
              <Button onClick={loadMore} variant="outline">
                Load more
              </Button>
            </div>
          )}
        </div>
      )}

      {tab === 'members' && (
        <div className="rounded-2xl bg-white p-4">
          {membersLoading && <p className="p-4 text-sm text-gray-500">Loading members…</p>}
          {!membersLoading && members.length === 0 && (
            <p className="p-4 text-sm text-gray-500">No members yet.</p>
          )}
          <div className="divide-y divide-gray-100">
            {members.map((m) => (
              <div key={m.publicationId} className="flex items-center gap-3 px-2 py-3">
                <PublicationLink publicationId={m.publicationId} className="shrink-0">
                  <Avatar
                    {...createPublicationAvatarConfig(
                      { id: m.publicationId, name: m.name || 'Publication', avatar: m.avatar },
                      'md',
                    )}
                  />
                </PublicationLink>
                <div className="min-w-0 flex-1">
                  <PublicationLink publicationId={m.publicationId} className="inline-flex items-center gap-1">
                    <span className="truncate text-sm font-semibold text-gray-900 hover:text-primary">
                      {m.name || 'Publication'}
                    </span>
                    {m.isVerified && <HiCheckBadge className="size-4 shrink-0 text-primary" />}
                  </PublicationLink>
                  <OwnerIdentity owner={m.ownerIdentity} />
                  <p className="mt-0.5 text-xs text-gray-400">
                    Joined {new Date(m.joinedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </AppLayout>
  );
}

/** State-aware join control based on the viewer's owned publications. */
function JoinAction({
  busy,
  invitePub,
  memberPubs,
  pendingPubs,
  eligiblePubs,
  onApply,
  onAcceptInvite,
  onDeclineInvite,
  onNeedPublication,
}: {
  busy: boolean;
  invitePub?: CommunityViewerPub;
  memberPubs: CommunityViewerPub[];
  pendingPubs: CommunityViewerPub[];
  eligiblePubs: CommunityViewerPub[];
  onApply: (pubId: string) => void;
  onAcceptInvite: (inviteId: string) => void;
  onDeclineInvite: (inviteId: string) => void;
  onNeedPublication: () => void;
}) {
  const [picking, setPicking] = useState(false);

  if (invitePub?.inviteId) {
    return (
      <div className="flex flex-col items-end gap-1.5">
        <span className="text-xs font-medium text-gray-500">Invited</span>
        <div className="flex gap-1.5">
          <Button
            size="sm"
            disabled={busy}
            className="gap-1"
            onClick={() => onAcceptInvite(invitePub.inviteId!)}
          >
            <HiCheck className="size-4" /> Accept
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => onDeclineInvite(invitePub.inviteId!)}
          >
            <HiXMark className="size-4" />
          </Button>
        </div>
      </div>
    );
  }

  if (memberPubs.length > 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-600">
        <HiCheck className="size-4" /> Member
      </span>
    );
  }

  if (pendingPubs.length > 0) {
    return (
      <Button size="sm" variant="outline" disabled>
        Application pending
      </Button>
    );
  }

  // No publication yet — communities are joined as a publication, so send the
  // user to create one (mirrors the "write an article without a publication"
  // flow) instead of leaving a dead, disabled button.
  if (eligiblePubs.length === 0) {
    return (
      <Button size="sm" onClick={onNeedPublication} title="You need a publication to join">
        Apply to join
      </Button>
    );
  }

  if (eligiblePubs.length === 1) {
    return (
      <Button size="sm" disabled={busy} onClick={() => onApply(eligiblePubs[0].publicationId)}>
        Apply to join
      </Button>
    );
  }

  // Multiple eligible publications — pick which one applies.
  if (!picking) {
    return (
      <Button size="sm" disabled={busy} onClick={() => setPicking(true)}>
        Apply to join
      </Button>
    );
  }
  return (
    <div className="flex max-w-[200px] flex-col items-end gap-1">
      <span className="text-xs font-medium text-gray-500">Apply as…</span>
      {eligiblePubs.map((p) => (
        <Button
          key={p.publicationId}
          size="sm"
          variant="outline"
          disabled={busy}
          className="w-full justify-start"
          onClick={() => onApply(p.publicationId)}
        >
          {p.name || 'Publication'}
        </Button>
      ))}
    </div>
  );
}
