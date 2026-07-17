import { Metadata } from 'next';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://inkray.xyz';

const title = 'Communities | Inkray';
const description =
  'Publications grouped around a shared topic or interest. Explore communities on Inkray — permanent, independent publishing.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${APP_URL}/communities` },
  openGraph: {
    type: 'website',
    title,
    description,
    url: `${APP_URL}/communities`,
    siteName: 'Inkray',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    site: '@inkray_io',
  },
};

export default function CommunitiesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
