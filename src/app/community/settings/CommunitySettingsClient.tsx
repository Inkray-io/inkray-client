'use client';

import { useMemo, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  HiUserGroup,
  HiCheck,
  HiXMark,
  HiTrash,
  HiCheckBadge,
  HiArrowLeft,
} from 'react-icons/hi2';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/Avatar';
import { OwnerIdentity } from '@/components/community/OwnerIdentity';
import { PublicationLink } from '@/components/community/PublicationLink';
import { createPublicationAvatarConfig } from '@/lib/utils/avatar';
import { useToast } from '@/hooks/use-toast';
import { useWalletConnection } from '@/hooks/useWalletConnection';
import {
  useCommunity,
  useCommunityMembers,
  useCommunityApplications,
  useCommunityInvites,
  CommunitySentInvite,
} from '@/hooks/useCommunities';
import { communitiesAPI } from '@/lib/api';
import { addressesEqual } from '@/utils/address';
import { ROUTES } from '@/constants/routes';

type Tab = 'info' | 'applications' | 'members' | 'invites';
const TABS: { id: Tab; label: string }[] = [
  { id: 'info', label: 'Info' },
  { id: 'applications', label: 'Applications' },
  { id: 'members', label: 'Members' },
  { id: 'invites', label: 'Invites' },
];

export function CommunitySettingsClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const idOrSlug = searchParams.get('id');
  const tabParam = (searchParams.get('tab') as Tab) || 'info';
  const { toast } = useToast();
  const { address } = useWalletConnection();
  const [busy, setBusy] = useState(false);

  const { community, isLoading, refresh } = useCommunity(idOrSlug);
  const isOwner = useMemo(
    () => !!community && !!address && addressesEqual(community.owner, address),
    [community, address],
  );

  const { applications, refresh: refreshApps } = useCommunityApplications(idOrSlug, isOwner);
  const { members, refresh: refreshMembers } = useCommunityMembers(idOrSlug);
  const { invites: sentInvites, refresh: refreshInvites } = useCommunityInvites(idOrSlug, isOwner);

  const setTab = (t: Tab) =>
    router.push(ROUTES.COMMUNITY_SETTINGS(idOrSlug || '', t === 'info' ? undefined : t));

  const act = async (fn: () => Promise<any>, ok: string, after?: () => void) => {
    setBusy(true);
    try {
      await fn();
      toast({ title: ok });
      after?.();
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
        <div className="h-64 animate-pulse rounded-2xl bg-white" />
      </AppLayout>
    );
  }

  if (!community || !isOwner) {
    return (
      <AppLayout currentPage="communities">
        <div className="rounded-2xl bg-white p-10 text-center">
          <HiUserGroup className="mx-auto size-10 text-gray-300" />
          <p className="mt-3 font-semibold text-gray-900">
            {!community ? 'Community not found' : 'Only the owner can manage this community'}
          </p>
          <Button onClick={() => router.push(ROUTES.COMMUNITIES)} variant="outline" className="mt-4">
            Back to communities
          </Button>
        </div>
      </AppLayout>
    );
  }

  const pendingApps = applications.filter((a) => a.status === 'pending');
  const decidedApps = applications.filter((a) => a.status !== 'pending');

  return (
    <AppLayout currentPage="communities">
      <button
        onClick={() => router.push(ROUTES.COMMUNITY_WITH_ID(community.slug))}
        className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
      >
        <HiArrowLeft className="size-4" /> {community.name}
      </button>
      <h1 className="mb-4 text-2xl font-bold text-gray-900">Manage community</h1>

      <div className="mb-5 flex gap-1 overflow-x-auto rounded-xl bg-white p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tabParam === t.id ? 'bg-primary/10 text-primary' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            {t.label}
            {t.id === 'applications' && pendingApps.length > 0 && (
              <span className="ml-1.5 rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">
                {pendingApps.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {tabParam === 'info' && (
        <InfoTab
          community={community}
          busy={busy}
          onSave={(data) => act(() => communitiesAPI.update(community.slug, data), 'Community updated', refresh)}
        />
      )}

      {tabParam === 'applications' && (
        <div className="space-y-6">
          <Section title={`Pending (${pendingApps.length})`}>
            {pendingApps.length === 0 && <Empty>No pending applications.</Empty>}
            {pendingApps.map((a) => (
              <div key={a.applicationId} className="flex items-center gap-3 px-2 py-3">
                <PubAvatar publicationId={a.publication.publicationId} name={a.publication.name} avatar={a.publication.avatar} />
                <div className="min-w-0 flex-1">
                  <PubName publicationId={a.publication.publicationId} name={a.publication.name} verified={a.publication.isVerified} />
                  <OwnerIdentity owner={a.owner} />
                  {a.message && <p className="mt-1 line-clamp-2 text-xs text-gray-500">{a.message}</p>}
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <Button
                    size="sm"
                    disabled={busy}
                    className="gap-1"
                    onClick={() =>
                      act(() => communitiesAPI.acceptApplication(community.slug, a.applicationId), 'Accepted', () => {
                        refreshApps();
                        refreshMembers();
                        refresh();
                      })
                    }
                  >
                    <HiCheck className="size-4" /> Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() =>
                      act(() => communitiesAPI.rejectApplication(community.slug, a.applicationId), 'Rejected', refreshApps)
                    }
                  >
                    <HiXMark className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </Section>
          {decidedApps.length > 0 && (
            <Section title="Decided">
              {decidedApps.map((a) => (
                <div key={a.applicationId} className="flex items-center gap-3 px-2 py-3">
                  <PubAvatar publicationId={a.publication.publicationId} name={a.publication.name} avatar={a.publication.avatar} />
                  <div className="min-w-0 flex-1">
                    <PubName publicationId={a.publication.publicationId} name={a.publication.name} verified={a.publication.isVerified} />
                    <OwnerIdentity owner={a.owner} />
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                      a.status === 'accepted' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {a.status}
                  </span>
                </div>
              ))}
            </Section>
          )}
        </div>
      )}

      {tabParam === 'members' && (
        <Section title={`Members (${community.memberCount})`}>
          {members.length === 0 && <Empty>No members yet.</Empty>}
          {members.map((m) => (
            <div key={m.publicationId} className="flex items-center gap-3 px-2 py-3">
              <PubAvatar publicationId={m.publicationId} name={m.name} avatar={m.avatar} />
              <div className="min-w-0 flex-1">
                <PubName publicationId={m.publicationId} name={m.name} verified={m.isVerified} />
                <OwnerIdentity owner={m.ownerIdentity} />
                <p className="mt-0.5 text-xs text-gray-400">via {m.joinedVia}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                className="shrink-0 gap-1 text-red-600 hover:bg-red-50"
                onClick={() =>
                  act(() => communitiesAPI.removeMember(community.slug, m.publicationId), 'Member removed', () => {
                    refreshMembers();
                    refresh();
                  })
                }
              >
                <HiTrash className="size-4" /> Remove
              </Button>
            </div>
          ))}
        </Section>
      )}

      {tabParam === 'invites' && (
        <InviteTab
          busy={busy}
          invites={sentInvites}
          onInvite={(pubId) =>
            act(() => communitiesAPI.invite(community.slug, pubId), 'Invite sent', refreshInvites)
          }
          onRevoke={(inviteId) =>
            act(() => communitiesAPI.revokeInvite(community.slug, inviteId), 'Invite revoked', refreshInvites)
          }
        />
      )}
    </AppLayout>
  );
}

function InfoTab({
  community,
  busy,
  onSave,
}: {
  community: { name: string; description: string | null; avatar: string | null };
  busy: boolean;
  onSave: (data: { name: string; description: string; avatar?: string }) => void;
}) {
  const [name, setName] = useState(community.name);
  const [description, setDescription] = useState(community.description || '');
  const [avatar, setAvatar] = useState<string | undefined>(undefined);
  const [preview, setPreview] = useState<string | null>(community.avatar);
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      setAvatar(url);
      setPreview(url);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-5 rounded-2xl bg-white p-6">
      <div className="flex items-center gap-4">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="avatar" className="size-16 rounded-2xl object-cover" />
        ) : (
          <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <HiUserGroup className="size-8" />
          </div>
        )}
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => onFile(e.target.files?.[0])}
          />
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            Change avatar
          </Button>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={1000}
          rows={4}
          className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
        <p className="mt-1 text-right text-xs text-gray-400">{description.length}/1000</p>
      </div>
      <Button
        disabled={busy || name.trim().length < 2}
        onClick={() => onSave({ name: name.trim(), description: description.trim(), avatar })}
      >
        Save changes
      </Button>
    </div>
  );
}

function InviteTab({
  busy,
  invites,
  onInvite,
  onRevoke,
}: {
  busy: boolean;
  invites: CommunitySentInvite[];
  onInvite: (pubId: string) => void;
  onRevoke: (inviteId: string) => void;
}) {
  const [pubId, setPubId] = useState('');
  const valid = /^0x[a-fA-F0-9]{64}$/.test(pubId.trim());
  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-white p-6">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Invite a publication
        </label>
        <p className="mb-2 text-xs text-gray-500">
          Paste the publication address (0x…). The publication owner will get an invite to accept.
        </p>
        <div className="flex gap-2">
          <input
            value={pubId}
            onChange={(e) => setPubId(e.target.value)}
            placeholder="0x…"
            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 font-mono text-sm focus:border-primary focus:outline-none"
          />
          <Button
            disabled={busy || !valid}
            onClick={() => {
              onInvite(pubId.trim());
              setPubId('');
            }}
          >
            Invite
          </Button>
        </div>
        {pubId && !valid && (
          <p className="mt-1 text-xs text-red-500">Enter a valid 0x publication address.</p>
        )}
      </div>

      <Section title={`Pending invites (${invites.length})`}>
        {invites.length === 0 && <Empty>No pending invites.</Empty>}
        {invites.map((i) => (
          <div key={i.inviteId} className="flex items-center gap-3 px-2 py-3">
            <PubAvatar publicationId={i.publication.publicationId} name={i.publication.name} avatar={i.publication.avatar} />
            <div className="min-w-0 flex-1">
              <PubName publicationId={i.publication.publicationId} name={i.publication.name} verified={i.publication.isVerified} />
              <OwnerIdentity owner={i.owner} />
              <p className="mt-0.5 text-xs text-gray-400">
                Invited {new Date(i.createdAt).toLocaleDateString()}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              className="shrink-0 gap-1 text-red-600 hover:bg-red-50"
              onClick={() => onRevoke(i.inviteId)}
            >
              <HiXMark className="size-4" /> Revoke
            </Button>
          </div>
        ))}
      </Section>
    </div>
  );
}

// ── Small presentational helpers ──────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <h3 className="px-2 pb-2 text-sm font-semibold text-gray-900">{title}</h3>
      <div className="divide-y divide-gray-100">{children}</div>
    </div>
  );
}
function Empty({ children }: { children: React.ReactNode }) {
  return <p className="px-2 py-6 text-center text-sm text-gray-400">{children}</p>;
}
function PubAvatar({
  publicationId,
  name,
  avatar,
}: {
  publicationId: string;
  name: string | null;
  avatar: string | null;
}) {
  return (
    <PublicationLink publicationId={publicationId} className="shrink-0">
      <Avatar
        {...createPublicationAvatarConfig(
          { id: publicationId, name: name || 'Publication', avatar },
          'md',
        )}
      />
    </PublicationLink>
  );
}
function PubName({
  publicationId,
  name,
  verified,
}: {
  publicationId: string;
  name: string | null;
  verified: boolean;
}) {
  return (
    <PublicationLink publicationId={publicationId} className="inline-flex items-center gap-1">
      <span className="truncate text-sm font-semibold text-gray-900 hover:text-primary">
        {name || 'Publication'}
      </span>
      {verified && <HiCheckBadge className="size-4 shrink-0 text-primary" />}
    </PublicationLink>
  );
}

