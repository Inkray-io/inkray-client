/**
 * Utility functions for transforming media URLs in article content
 * 
 * This module handles the transformation of media URLs to use the Walrus CDN for optimized
 * content delivery. It transforms both backend media URLs and direct Walrus blob URLs
 * to use the CDN endpoint with proper blob ID and filename parameters.
 */

import { CONFIG } from '@/lib/config';

/**
 * Transform media URLs in markdown content to use Walrus CDN
 * 
 * This function finds media URLs and transforms them to use the CDN endpoint:
 * - Backend media URLs: /articles/media/media{N} -> CDN blob URLs
 * - Direct Walrus URLs: aggregator URLs -> CDN URLs  
 * - Walrus blob IDs: blob_id -> CDN URLs
 * 
 * CDN URL format: https://testnet-cdn.inkray.xyz/blob/{blobId}?file={filename}
 * 
 * @param content - The markdown content containing media URLs
 * @param quiltBlobId - The Walrus quilt blob ID for the article (used for all media files)
 * @returns Transformed content with CDN URLs
 * 
 * @example
 * ```typescript
 * const content = "![image](http://localhost:3000/articles/media/media0)";
 * const transformed = transformMediaUrls(content, "SnUh_kFSKmJxKUiVoWI6bR4PRWgp69LA5GMdMerQYo0");
 * // Result: "![image](https://testnet-cdn.inkray.xyz/blob/SnUh_kFSKmJxKUiVoWI6bR4PRWgp69LA5GMdMerQYo0?file=media0)"
 * ```
 */
export function transformMediaUrls(
  content: string, 
  quiltBlobId?: string
): string {
  if (!content) {
    return content;
  }

  let transformedContent = content;
  
  // Transform backend media URLs to CDN URLs using the article's quilt blob ID
  transformedContent = transformBackendMediaUrls(transformedContent, quiltBlobId);
  
  // Transform direct Walrus aggregator URLs to CDN URLs
  transformedContent = transformWalrusAggregatorUrls(transformedContent);
  
  return transformedContent;
}

/**
 * Transform backend media URLs to CDN URLs
 * Converts /articles/media/media{N} URLs to CDN blob URLs using the article's quilt blob ID
 * 
 * @param content - Content to transform
 * @param quiltBlobId - The Walrus quilt blob ID for the article
 * @returns Content with transformed backend media URLs
 */
function transformBackendMediaUrls(
  content: string, 
  quiltBlobId?: string
): string {
  const apiUrl = CONFIG.API_URL;
  
  // Pattern to match backend media URLs
  const localhostPattern = 'http://localhost:3000/articles/media/(media\\d+)';
  const apiUrlEscaped = apiUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const apiPattern = `${apiUrlEscaped}/articles/media/(media\\d+)`;
  
  const mediaUrlRegex = new RegExp(`(${localhostPattern}|${apiPattern})`, 'g');
  
  return content.replace(mediaUrlRegex, (_match, ...groups) => {
    // Extract filename from the last capture group that contains media{N}
    const filename = groups.find(group => group && group.startsWith('media')) || 'media';
    
    // Use the article's quilt blob ID for all media files
    // All media files in an article are part of the same Walrus quilt
    const blobId = quiltBlobId || 'PLACEHOLDER_BLOB_ID';
    
    return `${CONFIG.WALRUS_CDN_URL}/blob/${blobId}?file=${filename}`;
  });
}

/**
 * Transform Walrus aggregator URLs to CDN URLs
 * Converts aggregator.walrus.space/v1/{blobId} URLs to CDN URLs
 * 
 * @param content - Content to transform
 * @returns Content with transformed Walrus URLs
 */
function transformWalrusAggregatorUrls(content: string): string {
  // Pattern to match Walrus aggregator URLs
  // Matches: https://aggregator-devnet.walrus.space/v1/{blobId}
  //          https://aggregator.walrus.space/v1/{blobId}
  const walrusUrlRegex = /https:\/\/aggregator(?:-devnet)?\.walrus\.space\/v1\/([a-zA-Z0-9_-]+)/g;
  
  return content.replace(walrusUrlRegex, (_match, blobId) => {
    // Extract filename from URL if available, otherwise use generic filename
    const filename = 'media'; // Could be enhanced to extract actual filename
    return `${CONFIG.WALRUS_CDN_URL}/blob/${blobId}?file=${filename}`;
  });
}

/**
 * Create a CDN URL for a specific blob ID and filename
 * 
 * @param blobId - The Walrus blob ID
 * @param filename - Optional filename for the file parameter
 * @returns CDN URL for the blob
 */
export function createCdnUrl(blobId: string, filename?: string): string {
  const file = filename || 'media';
  return `${CONFIG.WALRUS_CDN_URL}/blob/${blobId}?file=${file}`;
}

/**
 * Check if content contains media URLs that need transformation
 * 
 * @param content - The content to check
 * @returns True if content contains media URLs
 */
export function hasMediaUrls(content: string): boolean {
  if (!content) {
    return false;
  }

  // Check for backend media URLs
  const apiUrl = CONFIG.API_URL;
  const localhostPattern = 'http://localhost:3000/articles/media/media\\d+';
  const apiUrlEscaped = apiUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const apiPattern = `${apiUrlEscaped}/articles/media/media\\d+`;
  const backendMediaRegex = new RegExp(`(${localhostPattern}|${apiPattern})`, 'g');
  
  // Check for Walrus aggregator URLs
  const walrusUrlRegex = /https:\/\/aggregator(?:-devnet)?\.walrus\.space\/v1\/[a-zA-Z0-9_-]+/g;
  
  return backendMediaRegex.test(content) || walrusUrlRegex.test(content);
}

/**
 * Extract all media URLs from content
 * 
 * @param content - The content to extract URLs from  
 * @returns Array of media URLs found in the content
 */
export function extractMediaUrls(content: string): string[] {
  if (!content) {
    return [];
  }

  const urls: string[] = [];
  
  // Extract backend media URLs
  const apiUrl = CONFIG.API_URL;
  const localhostPattern = 'http://localhost:3000/articles/media/media\\d+';
  const apiUrlEscaped = apiUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const apiPattern = `${apiUrlEscaped}/articles/media/media\\d+`;
  const backendMediaRegex = new RegExp(`(${localhostPattern}|${apiPattern})`, 'g');
  
  const backendUrls = content.match(backendMediaRegex) || [];
  urls.push(...backendUrls);
  
  // Extract Walrus aggregator URLs
  const walrusUrlRegex = /https:\/\/aggregator(?:-devnet)?\.walrus\.space\/v1\/[a-zA-Z0-9_-]+/g;
  const walrusUrls = content.match(walrusUrlRegex) || [];
  urls.push(...walrusUrls);
  
  return urls;
}

/**
 * Fetch raw content from Walrus CDN for encrypted articles
 * 
 * @param quiltBlobId - The Walrus quilt blob ID containing the encrypted article content
 * @returns Promise<ArrayBuffer> - The raw encrypted content
 * 
 * @example
 * ```typescript
 * const rawContent = await getRawContentFromCdn("SnUh_kFSKmJxKUiVoWI6bR4PRWgp69LA5GMdMerQYo0");
 * const encryptedData = new Uint8Array(rawContent);
 * ```
 */
export async function getRawContentFromCdn(quiltBlobId: string): Promise<ArrayBuffer> {
  if (!quiltBlobId) {
    throw new Error('Quilt blob ID is required');
  }

  const cdnUrl = `${CONFIG.WALRUS_CDN_URL}/blob/${quiltBlobId}?file=article`;
  
  try {
    const response = await fetch(cdnUrl);
    
    if (!response.ok) {
      throw new Error(`CDN request failed: ${response.status} ${response.statusText}`);
    }
    
    return await response.arrayBuffer();
  } catch (error) {
    throw new Error(`Failed to fetch raw content from CDN: ${error instanceof Error ? error.message : String(error)}`);
  }
}


/**
 * Transform a single backend media URL to a draft-specific media URL.
 *
 * This mirrors `transformBackendDraftMediaUrl` but operates on a single URL
 * instead of scanning a larger content string. If the provided `url` does not
 * match the expected backend media URL patterns, it is returned unchanged.
 *
 * @param url - The single media URL to transform
 * @param draftId - The draft ID to use in the transformed URL
 * @returns The transformed draft media URL or the original URL if no match
 */
export function transformBackendDraftMediaUrlForUrl(url: string, draftId: string): string {
  if (!url || !draftId) return url;
  console.log('Transforming URL:', url, 'for draft ID:', draftId);
  const apiUrl = CONFIG.API_URL;
  const apiUrlEscaped = apiUrl.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');

  // Anchor the pattern to match the full URL and capture "media{N}"
  const pattern = `^(?:http://localhost:3000/articles/media/|${apiUrlEscaped}/articles/media/)(media\\d+)$`;
  const mediaUrlRegex = new RegExp(pattern);

  const match = url.match(mediaUrlRegex);
  if (!match || !match[1]) return url;

  const filename = match[1];
  const indexMatch = filename.match(/media(\d+)/);
  const mediaIndex = indexMatch ? indexMatch[1] : '0';

  return `${apiUrl}/articles/draft/${draftId}/media/${mediaIndex}`;
}
