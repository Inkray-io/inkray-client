"use client"

import { useTopWriters } from '@/hooks/useTopWriters';
import { AlertCircle, RefreshCw, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/constants/routes';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { WidgetHeader } from '@/components/widgets/WidgetHeader';

interface Publication {
  rank: number
  id: string
  name: string
  subscribers: string
  avatar: string
  isVerified: boolean
  avatarConfig: {
    src: string | null;
    alt: string;
    fallbackText: string;
    gradientColors: string;
    size: 'md';
    seed?: string;
  };
}

interface TopPublicationsProps {
  publications?: Publication[]
}

export function TopWriters({ publications: propsPublications }: TopPublicationsProps) {
  const { writers: apiPublications, isLoading, error, refetch } = useTopWriters();
  const router = useRouter();

  const displayPublications = propsPublications || apiPublications;

  const handlePublicationClick = (publicationId: string) => {
    router.push(ROUTES.PUBLICATION_WITH_ID(publicationId));
  };

  if (isLoading && displayPublications.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-4">
        <WidgetHeader title="Top publications" />
        <div className="space-y-1">
          {[1, 2, 3].map((rank) => (
            <div key={rank} className="flex items-center gap-2.5 py-1">
              <Skeleton className="w-5 h-3.5" />
              <Skeleton className="h-3.5 w-28 flex-1" />
              <Skeleton className="h-3 w-14" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error && displayPublications.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-4">
        <WidgetHeader title="Top publications" />
        <div className="text-center py-3 space-y-2">
          <AlertCircle className="w-5 h-5 text-gray-400 mx-auto" />
          <p className="text-xs text-gray-500">Couldn&apos;t load publications</p>
          <button
            onClick={refetch}
            className="text-primary hover:underline text-xs flex items-center gap-1 mx-auto"
          >
            <RefreshCw className="w-3 h-3" />
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (displayPublications.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-4">
        <WidgetHeader title="Top publications" />
        <p className="text-xs text-gray-500 py-2">No publications yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-4">
      <WidgetHeader
        title="Top publications"
        onViewAll={() => router.push('/publications')}
      />

      <div className="space-y-1">
        {displayPublications.map((publication) => (
          <button
            key={publication.rank}
            onClick={() => handlePublicationClick(publication.id)}
            className="w-full flex items-center gap-2.5 text-left rounded-lg px-1.5 py-1 -mx-1.5 hover:bg-gray-50 transition-colors"
          >
            <span className="w-5 shrink-0 text-center text-gray-400 font-semibold text-xs tabular-nums">
              {publication.rank}
            </span>
            <div className="flex items-center gap-1 flex-1 min-w-0">
              <span className="text-sm font-medium text-foreground truncate">
                {publication.name}
              </span>
              {publication.isVerified && <VerifiedBadge size="sm" />}
            </div>
            <span
              className="flex items-center gap-1 text-gray-500 text-[11px] tabular-nums shrink-0"
              title={`${publication.subscribers} followers`}
            >
              <Users className="size-3 shrink-0" aria-hidden="true" />
              {publication.subscribers}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
