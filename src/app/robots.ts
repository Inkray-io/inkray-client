import type { MetadataRoute } from 'next'

// Private, auth-only, or thin routes that shouldn't be indexed. Content
// surfaces (articles, publications, profiles, feed, landing pages) stay open.
const DISALLOW = [
  '/auth',
  '/invite',
  '/invites',
  '/drafts',
  '/create',
  '/create-publication',
  '/notifications',
  '/publication/settings',
  '/offline/',
  '/status',
  '/quests',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: DISALLOW },
      { userAgent: 'GPTBot', allow: '/', disallow: DISALLOW },
      { userAgent: 'Google-Extended', allow: '/', disallow: DISALLOW },
      { userAgent: 'ChatGPT-User', allow: '/', disallow: DISALLOW },
      { userAgent: 'anthropic-ai', allow: '/', disallow: DISALLOW },
    ],
    sitemap: 'https://inkray.xyz/sitemap.xml',
  }
}
