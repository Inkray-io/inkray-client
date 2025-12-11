"use client"

import { useTopWriters } from '@/hooks/useTopWriters';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/constants/routes';

interface Publication {
  rank: number
  id: string
  name: string
  subscribers: string
  avatar: string
  avatarConfig: {
    src: string | null;
    alt: string;
    fallbackText: string;
    gradientColors: string;
    size: 'md';
  };
}

interface TopPublicationsProps {
  publications?: Publication[]
}

export function TopWriters({ publications: propsPublications }: TopPublicationsProps) {
  const { writers: apiPublications, isLoading, error, refetch } = useTopWriters();
  const router = useRouter();

  // Use props publications if provided, otherwise use API data
  const displayPublications = propsPublications || apiPublications;

  const handlePublicationClick = (publicationId: string) => {
    router.push(ROUTES.PUBLICATION_WITH_ID(publicationId));
  };

  // Loading state
  if (isLoading && displayPublications.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-5">
        <div className="mb-4">
          <h3 className="font-semibold text-black text-lg">Top publications</h3>
        </div>

        <div className="space-y-4">
          {[1, 2, 3].map((rank) => (
            <div key={rank} className="flex items-center gap-3">
              {/* Rank number skeleton */}
              <div className="w-6 text-center">
                <Skeleton className="w-4 h-4 mx-auto" />
              </div>
              {/* Avatar skeleton */}
              <Skeleton className="w-10 h-10 rounded-full" />
              {/* Publication info skeleton */}
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>

        <Skeleton className="h-6 mt-4 w-28" />
      </div>
    );
  }

  // Error state
  if (error && displayPublications.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-5">
        <div className="mb-4">
          <h3 className="font-semibold text-black text-lg">Top publications</h3>
        </div>

        <div className="text-center py-4 space-y-3">
          <AlertCircle className="w-6 h-6 text-gray-400 mx-auto" />
          <p className="text-sm text-gray-500">Failed to load top publications</p>
          <button
            onClick={refetch}
            className="text-[#005efc] hover:underline text-sm flex items-center gap-1 mx-auto"
          >
            <RefreshCw className="w-3 h-3" />
            Try again
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (displayPublications.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-5">
        <div className="mb-4">
          <h3 className="font-semibold text-black text-lg">Top publications</h3>
        </div>

        <div className="text-center py-4">
          <p className="text-sm text-gray-500">No publications found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-5">
      <div className="mb-4">
        <h3 className="font-semibold text-black text-lg">Top publications</h3>
      </div>
      
      <div className="space-y-4">
        {displayPublications.map((publication) => (
          <div
            key={publication.rank}
            className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors"
            onClick={() => handlePublicationClick(publication.id)}
          >
            {/* Rank number */}
            <div className="w-6 text-center">
              <span className="text-black font-medium text-sm">
                {publication.rank}
              </span>
            </div>
            {/* Avatar */}
            <Avatar
              {...publication.avatarConfig}
            />
            {/* Publication info */}
            <div className="flex-1">
              <div className="font-semibold text-black text-sm">
                {publication.name}
              </div>
              <div className="text-gray-500 text-xs mt-0.5">
                {publication.subscribers}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-primary text-sm font-medium cursor-pointer hover:underline pt-4">
        View the entire list
      </div>
    </div>
  )
}