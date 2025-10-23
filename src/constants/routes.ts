/**
 * Application routes configuration
 * Centralized route definitions for easy maintenance and consistency
 */

export const ROUTES = {
  // Main pages
  HOME: '/',
  FEED: '/feed',
  ARTICLE: '/article',
  CREATE: '/create',
  ABOUT: '/about',
  RULES: '/rules',
  ADVERTISING: '/advertising',
  
  // Feed types
  FEED_POPULAR: '/feed?type=popular',
  FEED_FRESH: '/feed',
  FEED_MY_FEED: '/feed?type=my',
  
  // Category feeds
  FEED_CATEGORY: (categorySlug: string) => `/feed?category=${categorySlug}`,
  FEED_CATEGORY_POPULAR: (categorySlug: string) => `/feed?type=popular&category=${categorySlug}`,
  FEED_CATEGORY_MY: (categorySlug: string) => `/feed?type=my&category=${categorySlug}`,
  
  // Dynamic routes
  ARTICLE_WITH_ID: (id: string) => `/article?id=${id}`,
  PUBLICATION_WITH_ID: (id: string) => `/publication?id=${id}`,
  PUBLICATION_SETTINGS: (id: string, tab?: string) => `/publication/settings?id=${id}${tab ? `&tab=${tab}` : ''}`,
  
  // External routes (if needed in future)
  EXTERNAL: {
    TWITTER: 'https://x.com/inkray_io',
    WALRUS: 'https://www.walrus.xyz/',
  }
} as const

// Type for route keys for better TypeScript support
export type RouteKey = keyof typeof ROUTES
export type Route = typeof ROUTES[RouteKey]