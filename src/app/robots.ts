import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/' },
      { userAgent: 'GPTBot', allow: '/' },
      { userAgent: 'Google-Extended', allow: '/' },
      { userAgent: 'ChatGPT-User', allow: '/' },
      { userAgent: 'anthropic-ai', allow: '/' },
    ],
    sitemap: 'https://inkray.xyz/sitemap.xml',
  }
}
