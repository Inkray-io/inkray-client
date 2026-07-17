'use client';

import { Suspense } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { CommunitySettingsClient } from './CommunitySettingsClient';

export default function CommunitySettingsPage() {
  return (
    <Suspense
      fallback={
        <AppLayout currentPage="communities">
          <div className="h-64 animate-pulse rounded-2xl bg-white" />
        </AppLayout>
      }
    >
      <CommunitySettingsClient />
    </Suspense>
  );
}
