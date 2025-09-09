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
  
  // Feed filters
  FEED_POPULAR: '/feed?filter=popular',
  FEED_FRESH: '/feed?filter=fresh',
  FEED_MY_FEED: '/feed?filter=my-feed',
  
  // Dynamic routes
  ARTICLE_WITH_ID: (id: string) => `/article?id=${id}`,
  
  // External routes (if needed in future)
  EXTERNAL: {
    TWITTER: 'https://x.com/inkray_io',
    WALRUS: 'https://www.walrus.xyz/',
  }
} as const

// Type for route keys for better TypeScript support
export type RouteKey = keyof typeof ROUTES
export type Route = typeof ROUTES[RouteKey]