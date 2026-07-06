import { Metadata } from 'next';
import ProfilePageClient from './ProfilePageClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://inkray.xyz';

type PublicProfile = {
  username?: string | null;
  description?: string | null;
  publicKey?: string;
};

async function fetchProfile(address: string): Promise<PublicProfile | null> {
  try {
    const res = await fetch(`${API_URL}/users/profile/${address}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data || null;
  } catch {
    return null;
  }
}

async function fetchSuinsName(address: string): Promise<string | null> {
  try {
    const res = await fetch(`${API_URL}/suins/${address}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const data = json?.data ?? json;
    return data?.name ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}): Promise<Metadata> {
  const { id: address } = await searchParams;
  // Own-profile view (no id) is private — generic metadata
  if (!address) return { title: 'Profile | Inkray' };

  const [profile, suinsName] = await Promise.all([
    fetchProfile(address),
    fetchSuinsName(address),
  ]);
  const shortAddress = `${address.slice(0, 6)}…${address.slice(-4)}`;
  // Same display priority as the in-app header and the OG image
  const displayName = suinsName || profile?.username || shortAddress;

  const title = `${displayName} | Inkray`;
  const description =
    profile?.description ||
    `Read ${displayName}'s writing on Inkray — permanent, independent publishing.`;
  const url = `${APP_URL}/profile?id=${address}`;
  const ogImageUrl = `${API_URL}/users/og/${address}`;

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

export default function ProfilePage() {
  return <ProfilePageClient />;
}
