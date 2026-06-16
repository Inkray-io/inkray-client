/**
 * Utility functions for transforming media URLs in article content
 *
 * Media is served from S3 through the backend proxy. This module rewrites the
 * draft/article image URLs embedded in markdown to the correct backend image
 * endpoints for display.
 */

import { CONFIG } from '@/lib/config';

/**
 * Transform draft image URLs in markdown to article image URLs
 *
 * When articles are published, images are copied from draft folder to article folder in S3.
 * This function transforms URLs in the markdown from draft format to article format.
 *
 * Draft URL format: {API_URL}/articles/draft/{draftId}/media/{imageId}
 * Article URL format: {API_URL}/articles/images/article/{articleId}/media/{imageId}
 *
 * @param content - The markdown content containing draft image URLs
 * @param articleId - The published article ID
 * @returns Content with transformed article image URLs
 */
export function transformDraftUrlsToArticleUrls(
  content: string,
  articleId: string
): string {
  if (!content || !articleId) {
    return content;
  }

  const apiUrl = CONFIG.API_URL;
  const apiUrlEscaped = apiUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Pattern to match draft media URLs with UUID imageId
  // Matches: {API_URL}/articles/draft/{draftId}/media/{imageId}
  // where imageId is a UUID (e.g., 74d18f19-8d47-449a-9892-f10db7b4fc05)
  const draftUrlPattern = new RegExp(
    `${apiUrlEscaped}/articles/draft/[a-f0-9-]+/media/([a-f0-9-]{36})`,
    'gi'
  );

  return content.replace(draftUrlPattern, (_match, imageId) => {
    return `${apiUrl}/articles/images/article/${articleId}/media/${imageId}`;
  });
}

/**
 * Transform a single backend media URL to a draft-specific media URL.
 *
 * If the provided `url` does not match the expected backend media URL patterns,
 * it is returned unchanged.
 *
 * Note: This function is primarily used for legacy URLs. New images use UUID-based URLs directly.
 *
 * @param url - The single media URL to transform
 * @param draftId - The draft ID to use in the transformed URL
 * @returns The transformed draft media URL or the original URL if no match
 */
export function transformBackendDraftMediaUrlForUrl(url: string, draftId: string): string {
  if (!url || !draftId) return url;

  const apiUrl = CONFIG.API_URL;
  const apiUrlEscaped = apiUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Check if this is already a draft URL with UUID - return as is
  const draftUuidPattern = new RegExp(`${apiUrlEscaped}/articles/draft/[a-f0-9-]+/media/[a-f0-9-]{36}$`, 'i');
  if (draftUuidPattern.test(url)) {
    return url;
  }

  // Legacy pattern: Anchor the pattern to match the full URL and capture "media{N}"
  const legacyPattern = `^(?:http://localhost:3000/articles/media/|${apiUrlEscaped}/articles/media/)(media\\d+)$`;
  const mediaUrlRegex = new RegExp(legacyPattern);

  const match = url.match(mediaUrlRegex);
  if (!match || !match[1]) return url;

  // For legacy URLs, we can't transform to draft format without an imageId
  // Return the original URL - these won't be used in new drafts
  return url;
}

/**
 * Transform media URLs in article content for display
 *
 * Transforms draft URLs to article URLs for S3-backed images.
 *
 * @param content - The markdown content
 * @param articleId - The article ID for S3-backed images
 * @returns Transformed content with proper image URLs
 */
export function transformArticleMediaUrls(
  content: string,
  articleId: string
): string {
  if (!content) {
    return content;
  }

  // Transform any draft URLs to article URLs (S3-backed images)
  let transformed = transformDraftUrlsToArticleUrls(content, articleId);

  // Remove <br /> tags (markdown doesn't render HTML)
  transformed = transformed.replace(/<br\s*\/?>/gi, '');

  return transformed;
}
