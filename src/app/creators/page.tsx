'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { CreatorBubbleMap } from '@/components/creators/CreatorBubbleMap';

export default function CreatorsPage() {
  return (
    <AppLayout currentPage="creators">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900">Creators</h1>
        <p className="mt-1 text-sm text-gray-500">
          Every publication as a bubble — the bigger the creator, the bigger the bubble. Size blends content
          volume, quality, engagement and audience. Tap a bubble to visit the publication.
        </p>
      </div>
      <CreatorBubbleMap />
    </AppLayout>
  );
}
