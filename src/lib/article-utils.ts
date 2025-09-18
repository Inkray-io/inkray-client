import React from 'react';
import { createWalrusClient } from './walrus-client';
import { useSuiClient, useCurrentAccount } from '@mysten/dapp-kit';
import type { SuiClient } from '@mysten/sui/client';
import type { WalletAccount } from '@mysten/wallet-standard';

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
 * Download and parse article content from Walrus blob ID
 */
export async function loadArticleContent(bodyBlobId: string): Promise<ArticleContent> {
  // Check cache first
  if (articleCache.has(bodyBlobId)) {
    const cached = articleCache.get(bodyBlobId)!;
    console.log(`📄 Article content loaded from cache: ${bodyBlobId}`);
    return cached;
  }

  try {
    console.log(`📥 Loading article content from Walrus: ${bodyBlobId}`);

    // Since we can't use hooks here, we'll need to initialize clients
    // This is a limitation - in practice, this should be called from a React component
    // that can access the hooks, or we need to pass the clients as parameters

    // For now, we'll create a minimal client setup
    // This will need to be refactored to accept client parameters

    throw new Error('loadArticleContent needs to be refactored to accept SuiClient and WalletAccount parameters');

  } catch (error) {
    console.error('❌ Failed to load article content:', error);

    const articleError: ArticleLoadError = {
      code: 'WALRUS_ERROR',
      message: `Failed to load article content: ${error instanceof Error ? error.message : String(error)}`,
      originalError: error,
    };

    throw articleError;
  }
}

/**
 * Load article content with client dependencies injected
 */
export async function loadArticleContentWithClients(
  bodyBlobId: string,
  suiClient: SuiClient,
  account: WalletAccount | null
): Promise<ArticleContent> {
  // Check cache first
  if (articleCache.has(bodyBlobId)) {
    const cached = articleCache.get(bodyBlobId)!;
    console.log(`📄 Article content loaded from cache: ${bodyBlobId}`);
    return cached;
  }

  try {
    console.log(`📥 Loading article content from Walrus: ${bodyBlobId}`);

    // Create Walrus client
    const walrusClient = createWalrusClient(suiClient, account);

    // Download blob content
    const contentBytes = await walrusClient.downloadBlob(bodyBlobId);
    const markdown = new TextDecoder().decode(contentBytes);

    console.log(`✅ Downloaded article content: ${contentBytes.length} bytes`);

    // Parse content
    const content = await parseArticleMarkdown(markdown);

    // Cache the result
    articleCache.set(bodyBlobId, content);

    return content;

  } catch (error) {
    console.error('❌ Failed to load article content:', error);

    let errorCode: ArticleLoadError['code'] = 'WALRUS_ERROR';
    let message = 'Unknown error occurred';

    if (error instanceof Error) {
      if (error.message.includes('not found') || error.message.includes('404')) {
        errorCode = 'BLOB_NOT_FOUND';
        message = `Article content not found. The blob ID "${bodyBlobId}" may be invalid or the content may have expired.`;
      } else if (error.message.includes('network') || error.message.includes('timeout')) {
        errorCode = 'NETWORK_ERROR';
        message = 'Network error occurred while loading article. Please check your connection and try again.';
      } else {
        message = `Failed to load article content: ${error.message}`;
      }
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
export function useArticleContent(bodyBlobId?: string) {
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const [content, setContent] = React.useState<ArticleContent | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<ArticleLoadError | null>(null);

  const loadContent = React.useCallback(async (blobId: string) => {
    if (!suiClient) {
      setError({
        code: 'NETWORK_ERROR',
        message: 'Sui client not available. Please check your connection.',
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const content = await loadArticleContentWithClients(blobId, suiClient, currentAccount);
      setContent(content);
    } catch (err) {
      setError(err as ArticleLoadError);
    } finally {
      setIsLoading(false);
    }
  }, [suiClient, currentAccount]);

  React.useEffect(() => {
    if (bodyBlobId) {
      loadContent(bodyBlobId);
    }
  }, [bodyBlobId, loadContent]);

  return {
    content,
    isLoading,
    error,
    reload: bodyBlobId ? () => loadContent(bodyBlobId) : null,
    clearError: () => setError(null),
  };
}

