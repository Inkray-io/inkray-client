import { useState, useCallback, useEffect } from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { loadArticleContentWithClients } from '@/lib/article-utils';
import { useFeedArticles, type FeedArticle } from './useFeedArticles';

export interface ArticleState {
  article: FeedArticle | null;
  content: string | null;
  isLoading: boolean;
  isLoadingContent: boolean;
  error: string | null;
}

/**
 * Simplified hook for loading and displaying articles (Walrus-only flow)
 * This replaces the complex useArticleDecryption for our simplified implementation
 */
export const useArticle = (articleSlug: string | null) => {
  const [state, setState] = useState<ArticleState>({
    article: null,
    content: null,
    isLoading: false,
    isLoadingContent: false,
    error: null,
  });

  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const { getArticleBySlug, articles } = useFeedArticles();

  /**
   * Load article metadata from feed
   */
  const loadArticleMetadata = useCallback(async (slug: string): Promise<FeedArticle | null> => {
    console.log(`📄 Loading article metadata for: ${slug}`);
    
    // Try to get from already loaded articles first
    const cachedArticle = getArticleBySlug(slug);
    if (cachedArticle) {
      console.log(`✅ Found cached article: ${cachedArticle.title}`);
      return cachedArticle;
    }

    // If not cached, we need to search through the backend directly
    // For now, we'll return null and rely on the feed loading
    console.log(`❓ Article not found in cache, may need to load from backend`);
    return null;
  }, [getArticleBySlug]);

  /**
   * Load article content from Walrus
   */
  const loadArticleContent = useCallback(async (article: FeedArticle): Promise<string> => {
    if (!suiClient) {
      throw new Error('Sui client not available');
    }

    console.log(`📥 Loading content for article: ${article.title}`);
    console.log(`📥 Blob ID: ${article.quiltBlobId}`);

    try {
      setState(prev => ({ ...prev, isLoadingContent: true }));

      if (!article.quiltBlobId) {
        throw new Error('Article has no quilt blob ID');
      }

      const articleContent = await loadArticleContentWithClients(
        article.quiltBlobId,
        suiClient,
        currentAccount
      );

      console.log(`✅ Article content loaded: ${articleContent.wordCount} words`);
      return articleContent.markdown;

    } catch (error) {
      console.error('❌ Failed to load article content:', error);
      throw error;
    } finally {
      setState(prev => ({ ...prev, isLoadingContent: false }));
    }
  }, [suiClient, currentAccount]);

  /**
   * Load complete article (metadata + content)
   */
  const loadArticle = useCallback(async (slug: string) => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      article: null,
      content: null,
    }));

    try {
      // 1. Load article metadata
      const article = await loadArticleMetadata(slug);
      
      if (!article) {
        throw new Error(`Article with slug "${slug}" not found. Make sure the article exists and the feed has loaded.`);
      }

      setState(prev => ({ ...prev, article }));

      // 2. Load article content from Walrus
      if (article.quiltBlobId) {
        try {
          const content = await loadArticleContent(article);
          setState(prev => ({ ...prev, content }));
        } catch (contentError) {
          // If content loading fails, still show the article metadata
          console.error('Failed to load content but showing article metadata:', contentError);
          setState(prev => ({ 
            ...prev, 
            error: `Failed to load article content: ${contentError instanceof Error ? contentError.message : 'Unknown error'}` 
          }));
        }
      } else {
        console.warn('Article has no quiltBlobId, cannot load content');
        setState(prev => ({ 
          ...prev, 
          error: 'Article content not available (no blob ID)' 
        }));
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load article';
      setState(prev => ({ ...prev, error: errorMessage }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [loadArticleMetadata, loadArticleContent]);

  /**
   * Load article when slug changes
   */
  useEffect(() => {
    if (articleSlug) {
      // Wait for articles to load before trying to find the article
      if (articles.length > 0) {
        loadArticle(articleSlug);
      } else {
        // If no articles loaded yet, set loading state
        setState(prev => ({ ...prev, isLoading: true, error: null }));
      }
    } else {
      // Clear state when no slug
      setState({
        article: null,
        content: null,
        isLoading: false,
        isLoadingContent: false,
        error: null,
      });
    }
  }, [articleSlug, articles.length, loadArticle]);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  /**
   * Retry loading
   */
  const retry = useCallback(() => {
    if (articleSlug) {
      loadArticle(articleSlug);
    }
  }, [articleSlug, loadArticle]);

  /**
   * Reload content only
   */
  const reloadContent = useCallback(async () => {
    if (state.article && state.article.quiltBlobId) {
      try {
        const content = await loadArticleContent(state.article);
        setState(prev => ({ ...prev, content, error: null }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to reload content';
        setState(prev => ({ ...prev, error: errorMessage }));
      }
    }
  }, [state.article, loadArticleContent]);

  return {
    // State
    ...state,
    isProcessing: state.isLoading || state.isLoadingContent,

    // Actions
    loadArticle,
    clearError,
    retry,
    reloadContent,

    // Computed properties
    hasContent: !!state.content,
    hasArticle: !!state.article,
    canLoadContent: !!state.article?.quiltBlobId,
  };
};