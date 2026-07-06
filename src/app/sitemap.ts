import type { MetadataRoute } from 'next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://inkray.xyz'
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export const revalidate = 3600

type FeedArticle = {
  slug: string
  updatedAt?: string
  createdAt?: string
}

async function fetchArticleSlugs(): Promise<FeedArticle[]> {
  try {
    const res = await fetch(`${API_URL}/feed/articles?page=1&limit=1000`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return []
    const json = await res.json()
    return json?.data?.articles || json?.data || []
  } catch {
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: APP_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${APP_URL}/feed`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${APP_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${APP_URL}/rules`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${APP_URL}/advertising`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${APP_URL}/publications`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${APP_URL}/for-writers`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${APP_URL}/for-readers`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${APP_URL}/substack-alternative`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${APP_URL}/content-ownership`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${APP_URL}/monetize-writing`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ]

  const [articles, publications] = await Promise.all([
    fetchArticleSlugs(),
    fetchPublicationIds(),
  ])

  const articleRoutes: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${APP_URL}/article?id=${article.slug}`,
    lastModified: article.updatedAt
      ? new Date(article.updatedAt)
      : article.createdAt
        ? new Date(article.createdAt)
        : new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  const publicationRoutes: MetadataRoute.Sitemap = publications.map((id) => ({
    url: `${APP_URL}/publication?id=${id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  return [...staticRoutes, ...articleRoutes, ...publicationRoutes]
}

async function fetchPublicationIds(): Promise<string[]> {
  try {
    const res = await fetch(`${API_URL}/publications/discover?page=1&limit=50`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return []
    const json = await res.json()
    const pubs = json?.data?.publications || []
    return pubs.map((p: { id: string }) => p.id).filter(Boolean)
  } catch {
    return []
  }
}
