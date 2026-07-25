'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { CreatorBubbleMap } from '@/components/creators/CreatorBubbleMap';

export default function CreatorsPage() {
  return (
    <AppLayout currentPage="creators">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900">Creators</h1>
        <p className="mt-1 text-sm text-gray-500">
          Discover the publications shaping Inkray. The more a creator publishes and the more readers they
          reach, the bigger their bubble. Tap any bubble to explore their work.
        </p>
      </div>
      <CreatorBubbleMap />
    </AppLayout>
  );
}
