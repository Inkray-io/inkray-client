'use client';

import Link from 'next/link';
import { HiUserGroup, HiArrowRight } from 'react-icons/hi2';
import { AppLayout } from '@/components/layout/AppLayout';
import { useCommunities } from '@/hooks/useCommunities';
import { ROUTES } from '@/constants/routes';

function CommunityAvatar({ avatar, name }: { avatar: string | null; name: string }) {
  if (avatar) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={avatar} alt={name} className="size-12 rounded-xl object-cover" />;
  }
  return (
    <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
      <HiUserGroup className="size-6" />
    </div>
  );
}

export default function CommunitiesPage() {
  const { communities, isLoading, error } = useCommunities();

  return (
    <AppLayout currentPage="communities">
      <div className="mb-6">
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-bold text-gray-900">Communities</h1>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
            Beta
          </span>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Publications grouped around a shared topic or interest.
        </p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-white" />
          ))}
        </div>
      )}

      {!isLoading && error && (
        <div className="rounded-2xl bg-white p-8 text-center text-red-600">{error}</div>
      )}

      {!isLoading && !error && communities.length === 0 && (
        <div className="rounded-2xl bg-white p-10 text-center">
          <HiUserGroup className="mx-auto size-10 text-gray-300" />
          <p className="mt-3 font-semibold text-gray-900">No communities yet</p>
          <p className="mt-1 text-sm text-gray-500">Check back soon — communities are in beta.</p>
        </div>
      )}

      <div className="space-y-3">
        {communities.map((c) => (
          <Link
            key={c.id}
            href={ROUTES.COMMUNITY_WITH_ID(c.slug)}
            className="group flex items-center gap-4 rounded-2xl bg-white p-4 transition-colors hover:bg-gray-50"
          >
            <CommunityAvatar avatar={c.avatar} name={c.name} />
            <div className="min-w-0 flex-1">
              <h2 className="truncate font-semibold text-gray-900">{c.name}</h2>
              {c.description && (
                <p className="mt-0.5 line-clamp-1 text-sm text-gray-500">{c.description}</p>
              )}
              <p className="mt-1 text-xs font-medium text-gray-400">
                {c.memberCount} {c.memberCount === 1 ? 'publication' : 'publications'}
              </p>
            </div>
            <HiArrowRight className="size-4 shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
          </Link>
        ))}
      </div>
    </AppLayout>
  );
}
