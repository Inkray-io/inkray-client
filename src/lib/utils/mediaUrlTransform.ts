/**
 * Utility functions for transforming media URLs in article content
 * 
 * This module handles the transformation of media URLs generated during article creation
 * to include the required articleId query parameter for backend media serving.
 */

/**
 * Transform media URLs in markdown content to include articleId query parameter
 * 
 * This function finds media URLs that match the pattern:
 * - http://localhost:3000/articles/media/media{N}
 * - process.env.NEXT_PUBLIC_API_URL/articles/media/media{N}
 * 
 * And transforms them to include the articleId parameter:
 * - http://localhost:3000/articles/media/media{N}?articleId={articleId}
 * 
 * @param content - The markdown content containing media URLs
 * @param articleId - The article ID to append as query parameter
 * @returns Transformed content with updated media URLs
 * 
 * @example
 * ```typescript
 * const content = "![image](http://localhost:3000/articles/media/media0)";
 * const transformed = transformMediaUrls(content, "0x123abc");
 * // Result: "![image](http://localhost:3000/articles/media/media0?articleId=0x123abc)"
 * ```
 */
export function transformMediaUrls(content: string, articleId: string): string {
  if (!content || !articleId) {
    return content;
  }

  // Get the base URL from environment or fallback to localhost
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  
  // Create regex pattern to match media URLs
  // Matches both localhost and environment API URLs
  // Pattern: (localhost:3000|api_url)/articles/media/media\d+
  const localhostPattern = 'http://localhost:3000/articles/media/media\\d+';
  const apiUrlEscaped = apiUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape special regex chars
  const apiPattern = `${apiUrlEscaped}/articles/media/media\\d+`;
  
  // Combine patterns with OR
  const mediaUrlRegex = new RegExp(`(${localhostPattern}|${apiPattern})(?!\\?articleId=)`, 'g');
  
  // Transform URLs by appending articleId parameter
  const transformedContent = content.replace(mediaUrlRegex, (match) => {
    // Check if URL already has query parameters
    const separator = match.includes('?') ? '&' : '?';
    return `${match}${separator}articleId=${encodeURIComponent(articleId)}`;
  });

  return transformedContent;
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

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const localhostPattern = 'http://localhost:3000/articles/media/media\\d+';
  const apiUrlEscaped = apiUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const apiPattern = `${apiUrlEscaped}/articles/media/media\\d+`;
  
  const mediaUrlRegex = new RegExp(`(${localhostPattern}|${apiPattern})`, 'g');
  
  return mediaUrlRegex.test(content);
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

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const localhostPattern = 'http://localhost:3000/articles/media/media\\d+';
  const apiUrlEscaped = apiUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const apiPattern = `${apiUrlEscaped}/articles/media/media\\d+`;
  
  const mediaUrlRegex = new RegExp(`(${localhostPattern}|${apiPattern})`, 'g');
  
  return content.match(mediaUrlRegex) || [];
}