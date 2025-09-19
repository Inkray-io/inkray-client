import React from 'react';
import type { SuiClient } from '@mysten/sui/client';
import type { WalletAccount } from '@mysten/wallet-standard';
import axios from 'axios';
import { articlesAPI } from './api';

// For now, we'll use simple markdown parsing without external dependencies
// TODO: Add marked and DOMPurify when needed
// import { marked } from 'marked';
// import DOMPurify from 'dompurify';

// Types
export interface ArticleContent {
  markdown: string;
  html: string;
  wordCount: number;
  readingTime: number; // in minutes
}

export interface ArticleLoadError {
  code: 'BLOB_NOT_FOUND' | 'NETWORK_ERROR' | 'PARSE_ERROR' | 'WALRUS_ERROR';
  message: string;
  originalError?: unknown;
}

// Cache for loaded articles (in-memory for now)
const articleCache = new Map<string, ArticleContent>();

/**
 * Download and parse article content from backend API using quilt blob ID
 */
export async function loadArticleContent(quiltBlobId: string): Promise<ArticleContent> {
  // Check cache first
  if (articleCache.has(quiltBlobId)) {
    const cached = articleCache.get(quiltBlobId)!;
    console.log(`📄 Article content loaded from cache: ${quiltBlobId}`);
    return cached;
  }

  try {
    console.log(`📥 Loading article content from backend: ${quiltBlobId}`);

    // Call backend API to get article content (JWT token added automatically by interceptor)
    const response = await articlesAPI.getContent(quiltBlobId);

    console.log('📋 API response structure:', {
      hasData: !!response.data,
      dataKeys: response.data ? Object.keys(response.data) : [],
      hasNestedData: !!response.data?.data,
      nestedDataKeys: response.data?.data ? Object.keys(response.data.data) : [],
      contentType: typeof response.data?.data?.content,
      fullResponse: response.data
    });

    // Backend returns { success: true, data: { content: "...", mediaFiles: [] } }
    // So we need response.data.data.content
    if (!response.data?.data || !response.data.data.content) {
      throw new Error('No content returned from server');
    }

    const markdown = response.data.data.content;
    console.log(`✅ Downloaded article content: ${markdown.length} characters`);

    // Parse content
    const content = await parseArticleMarkdown(markdown);

    // Cache the result
    articleCache.set(quiltBlobId, content);

    return content;

  } catch (error) {
    console.error('❌ Failed to load article content:', error);

    let errorCode: ArticleLoadError['code'] = 'WALRUS_ERROR';
    let message = 'Unknown error occurred';

    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        errorCode = 'BLOB_NOT_FOUND';
        message = `Article content not found. The quilt ID "${quiltBlobId}" may be invalid or the content may have expired.`;
      } else if (error.response?.status === 401) {
        errorCode = 'NETWORK_ERROR';
        message = 'Authentication expired. Please log in again.';
      } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        errorCode = 'NETWORK_ERROR';
        message = 'Network timeout occurred while loading article. Please try again.';
      } else {
        message = error.response?.data?.message || error.message || 'Failed to load article content';
      }
    } else if (error instanceof Error) {
      message = error.message;
    }

    const articleError: ArticleLoadError = {
      code: errorCode,
      message,
      originalError: error,
    };

    throw articleError;
  }
}

/**
 * Load article content with client dependencies injected (deprecated)
 * @deprecated Use loadArticleContent instead, which uses the backend API
 */
export async function loadArticleContentWithClients(
  quiltBlobId: string,
  _suiClient: SuiClient,
  _account: WalletAccount | null
): Promise<ArticleContent> {
  console.warn('loadArticleContentWithClients is deprecated. Use loadArticleContent instead.');
  return loadArticleContent(quiltBlobId);
}

/**
 * Parse markdown content and generate HTML (simplified version)
 */
export async function parseArticleMarkdown(markdown: string): Promise<ArticleContent> {
  try {
    console.log('📝 Parsing markdown content...');

    // Simple markdown to HTML conversion (basic implementation)
    // For now, we'll convert basic markdown syntax
    const html = markdown
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');

    // Calculate reading metrics
    const wordCount = countWords(markdown);
    const readingTime = calculateReadingTime(wordCount);

    console.log(`✅ Markdown parsed: ${wordCount} words, ${readingTime} min read`);

    return {
      markdown,
      html,
      wordCount,
      readingTime,
    };

  } catch (error) {
    console.error('❌ Failed to parse markdown:', error);

    const articleError: ArticleLoadError = {
      code: 'PARSE_ERROR',
      message: `Failed to parse article content: ${error instanceof Error ? error.message : String(error)}`,
      originalError: error,
    };

    throw articleError;
  }
}

/**
 * Count words in text (excluding markdown syntax)
 */
function countWords(text: string): number {
  if (!text) return 0;

  // Remove markdown syntax
  const plainText = text
    .replace(/^#{1,6}\s+/gm, '') // Headers
    .replace(/(\*\*|__)(.*?)\1/g, '$2') // Bold
    .replace(/(\*|_)(.*?)\1/g, '$2') // Italic
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
    .replace(/`([^`]+)`/g, '$1') // Inline code
    .replace(/```[\s\S]*?```/g, '') // Code blocks
    .replace(/^>\s+/gm, '') // Blockquotes
    .replace(/^---+$/gm, '') // Horizontal rules
    .replace(/\n\s*\n/g, '\n') // Extra whitespace
    .trim();

  const words = plainText.split(/\s+/).filter(word => word.length > 0);
  return words.length;
}

/**
 * Calculate reading time based on word count (average 200 words per minute)
 */
function calculateReadingTime(wordCount: number): number {
  const wordsPerMinute = 200;
  const minutes = wordCount / wordsPerMinute;
  return Math.max(1, Math.ceil(minutes)); // At least 1 minute
}

/**
 * Extract excerpt from markdown content
 */
export function extractExcerpt(markdown: string, maxLength: number = 200): string {
  if (!markdown) return '';

  // Remove markdown syntax and get plain text
  const plainText = markdown
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/^>\s+/gm, '')
    .replace(/\n/g, ' ')
    .trim();

  if (plainText.length <= maxLength) {
    return plainText;
  }

  // Find the last complete word within the limit
  const truncated = plainText.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  return lastSpace > 0
    ? truncated.substring(0, lastSpace) + '...'
    : truncated + '...';
}

/**
 * Generate article sharing URL
 */
export function generateShareUrl(slug: string): string {
  const baseUrl = typeof window !== 'undefined'
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL || 'https://inkray.io';

  return `${baseUrl}/article?id=${encodeURIComponent(slug)}`;
}

/**
 * Clear article cache (useful for development or memory management)
 */
export function clearArticleCache(): void {
  articleCache.clear();
  console.log('📄 Article cache cleared');
}

/**
 * Get cache stats
 */
export function getCacheStats(): { size: number; entries: string[] } {
  return {
    size: articleCache.size,
    entries: Array.from(articleCache.keys()),
  };
}

/**
 * Hook for loading article content in React components
 */
export function useArticleContent(quiltBlobId?: string) {
  const [content, setContent] = React.useState<ArticleContent | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<ArticleLoadError | null>(null);

  const loadContent = React.useCallback(async (blobId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const content = await loadArticleContent(blobId);
      setContent(content);
    } catch (err) {
      setError(err as ArticleLoadError);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (quiltBlobId) {
      loadContent(quiltBlobId);
    }
  }, [quiltBlobId, loadContent]);

  return {
    content,
    isLoading,
    error,
    reload: quiltBlobId ? () => loadContent(quiltBlobId) : null,
    clearError: () => setError(null),
  };
}

