import { Metadata } from 'next';
import PublicationPageClient from './PublicationPageClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://inkray.xyz';

type PublicationInfo = {
  name: string;
  description?: string | null;
  followerCount?: number;
  articleCount?: number;
};

async function fetchPublication(id: string): Promise<PublicationInfo | null> {
  try {
    const res = await fetch(`${API_URL}/publications/${id}`, {
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
  if (!id) return { title: 'Publication | Inkray' };

  const publication = await fetchPublication(id);
  if (!publication) return { title: 'Publication | Inkray' };

  const title = `${publication.name} | Inkray`;
  const description =
    publication.description ||
    `Read ${publication.name} on Inkray — permanent, independent publishing.`;
  const url = `${APP_URL}/publication?id=${id}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'profile',
      title,
      description,
      url,
      siteName: 'Inkray',
    },
    twitter: {
      card: 'summary',
      title,
      description,
      site: '@inkray_io',
    },
  };
}

export default function PublicationPage() {
  return <PublicationPageClient />;
}
