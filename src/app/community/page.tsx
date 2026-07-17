import { Metadata } from 'next';
import { Suspense } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { FeedPostSkeleton } from '@/components/feed/FeedPostSkeleton';
import { CommunityPageClient } from './CommunityPageClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://inkray.xyz';

type CommunityInfo = {
  name: string;
  slug: string;
  description?: string | null;
  memberCount?: number;
};

async function fetchCommunity(id: string): Promise<CommunityInfo | null> {
  try {
    const res = await fetch(`${API_URL}/communities/${id}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}): Promise<Metadata> {
  const { id } = await searchParams;
  if (!id) return { title: 'Community | Inkray' };

  const community = await fetchCommunity(id);
  if (!community) return { title: 'Community | Inkray' };

  const title = `${community.name} | Inkray`;
  const description =
    community.description ||
    `${community.name} — a community of publications on Inkray. Follow the shared feed of independent, permanent writing.`;
  // Canonical uses the slug so shared links are stable.
  const handle = community.slug || id;
  const url = `${APP_URL}/community?id=${handle}`;
  const ogImageUrl = `${API_URL}/communities/og/${handle}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      title,
      description,
      url,
      siteName: 'Inkray',
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      site: '@inkray_io',
      images: [ogImageUrl],
    },
  };
}

export default function CommunityPage() {
  return (
    <Suspense
      fallback={
        <AppLayout currentPage="communities">
          <div className="mb-6 h-28 animate-pulse rounded-2xl bg-white" />
          <div className="space-y-5">
            <FeedPostSkeleton />
            <FeedPostSkeleton />
          </div>
        </AppLayout>
      }
    >
      <CommunityPageClient />
    </Suspense>
  );
}
