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
  ]

  const articles = await fetchArticleSlugs()

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

  return [...staticRoutes, ...articleRoutes]
}
