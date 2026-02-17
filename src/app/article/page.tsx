import { Metadata } from 'next';
import ArticlePageClient from './ArticlePageClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://inkray.xyz';

type ArticleData = {
  title: string;
  summary: string;
  createdAt: string;
  category?: { id: string; slug: string; name: string };
  followInfo?: {
    publicationName: string;
    publicationAvatar: string | null;
    isVerified: boolean;
  };
  readTimeMinutes?: number | null;
};

async function fetchArticle(slug: string): Promise<ArticleData | null> {
  try {
    const res = await fetch(`${API_URL}/articles/${slug}`, {
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
  const { id: slug } = await searchParams;
  if (!slug) return { title: 'Article | Inkray' };

  const article = await fetchArticle(slug);
  if (!article) return { title: 'Article | Inkray' };

  const title = article.title;
  const description = article.summary || `Read "${article.title}" on Inkray`;
  const ogImageUrl = `${API_URL}/articles/og/${slug}`;
  const articleUrl = `${APP_URL}/article?id=${slug}`;

  return {
    title: `${title} | Inkray`,
    description,
    openGraph: {
      type: 'article',
      title,
      description,
      url: articleUrl,
      siteName: 'Inkray',
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: title }],
      publishedTime: article.createdAt,
      authors: [article.followInfo?.publicationName || 'Inkray'],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
      site: '@inkray_io',
    },
    alternates: { canonical: articleUrl },
  };
}

export default async function ArticlePage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id: slug } = await searchParams;

  // Fetch article data server-side for JSON-LD
  const article = slug ? await fetchArticle(slug) : null;

  return (
    <>
      {article && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Article',
              headline: article.title,
              description: article.summary,
              image: `${API_URL}/articles/og/${slug}`,
              datePublished: article.createdAt,
              author: {
                '@type': 'Organization',
                name: article.followInfo?.publicationName || 'Inkray',
              },
              publisher: {
                '@type': 'Organization',
                name: 'Inkray',
                url: APP_URL,
              },
              mainEntityOfPage: {
                '@type': 'WebPage',
                '@id': `${APP_URL}/article?id=${slug}`,
              },
            }),
          }}
        />
      )}
      <ArticlePageClient />
    </>
  );
}
