import { liteClient as algoliasearch } from 'algoliasearch/lite';

// Algolia configuration from environment variables
export const ALGOLIA_APP_ID = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || '';
export const ALGOLIA_SEARCH_API_KEY = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY || '';

// Index names
export const ARTICLES_INDEX = 'inkray_articles';
export const PUBLICATIONS_INDEX = 'inkray_publications';

// Check if Algolia is configured
export const isAlgoliaConfigured = (): boolean => {
  return !!(ALGOLIA_APP_ID && ALGOLIA_SEARCH_API_KEY);
};

// Create the Algolia search client (only if configured)
export const searchClient = isAlgoliaConfigured()
  ? algoliasearch(ALGOLIA_APP_ID, ALGOLIA_SEARCH_API_KEY)
  : null;

// Article hit type from Algolia
export interface ArticleHit {
  objectID: string;
  title: string;
  summary: string;
  slug: string;
  author: string;
  publicationId: string;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  gating: number;
  hasCover: boolean;
  viewCount: number;
  createdAt: string;
}

// Publication hit type from Algolia
export interface PublicationHit {
  objectID: string;
  name: string;
  description: string | null;
  avatar: string | null;
  owner: string;
  tags: string[];
  isVerified: boolean;
}
