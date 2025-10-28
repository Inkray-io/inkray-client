'use client';

import React, { Suspense } from 'react';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { useSearchParams } from 'next/navigation';
import { usePublication } from '@/hooks/usePublication';
import { usePublicationFeed } from '@/hooks/usePublicationFeed';
import { AppLayout } from '@/components/layout/AppLayout';
import { PublicationHeader } from '@/components/publication/PublicationHeader';
import { FeedPost } from '@/components/feed/FeedPost';
import { TopWriters } from '@/components/widgets/TopWriters';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { createUserAvatarConfig } from '@/lib/utils/avatar';
import { CONFIG } from '@/lib/config';

/**
 * Publication page content component
 * 
 * Displays publication information in a 3-column layout matching Figma design.
 * Left sidebar: navigation, Center: publication content, Right sidebar: widgets.
 */
const PublicationPageContent: React.FC = () => {
  const searchParams = useSearchParams();
  const publicationId = searchParams.get('id');

  const {
    publication,
    isLoading: publicationLoading,
    error: publicationError,
    refresh: refreshPublication,
    clearError: clearPublicationError,
  } = usePublication(publicationId || '');

  const {
    articles,
    isLoading: articlesLoading,
    error: articlesError,
    hasMore,
    loadMore,
    refresh: refreshArticles,
    clearError: clearArticlesError,
    canLoadMore,
    isEmpty,
  } = usePublicationFeed(publicationId || '');

  // Handle missing publication ID
  if (!publicationId) {
    return (
      <AppLayout currentPage="publication">
        <div className="flex items-center justify-center min-h-[400px]">
          <Alert className="max-w-md mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Publication ID is required. Please provide a valid publication ID in the URL.
            </AlertDescription>
          </Alert>
        </div>
      </AppLayout>
    );
  }

  // Handle publication loading error
  if (publicationError && !publicationLoading) {
    return (
      <AppLayout currentPage="publication">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <Alert className="max-w-md mx-auto" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {publicationError}
              </AlertDescription>
            </Alert>
            <Button
              onClick={() => {
                clearPublicationError();
                refreshPublication();
              }}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Right sidebar content
  const rightSidebar = (
    <div className="space-y-5">
      <TopWriters />
      {/* TODO: Temporary disable this until we implemented it */}
      {/* <PopularComments /> */}
    </div>
  );

  return (
    <AppLayout
      currentPage="publication"
      rightSidebar={rightSidebar}
      showRightSidebar={true}
    >
      <div className="bg-white rounded-2xl overflow-hidden">
        {/* Publication Profile Section */}
        {publication && (
          <PublicationHeader
            publication={publication}
            isLoading={publicationLoading}
          />
        )}

        {/* Articles Feed */}
        {!publicationLoading && publication && (
          <div className="pt-6 pb-10 border-t border-gray-200">
            {/* Articles Error Alert */}
            {articlesError && (
              <Alert variant="destructive" className="mb-4 mx-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {articlesError}
                </AlertDescription>
              </Alert>
            )}

            {/* Articles Loading State */}
            {articlesLoading && articles.length === 0 && (
              <div className="space-y-6">
                {[...Array(2)].map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-32"></div>
                          <div className="h-3 bg-gray-200 rounded w-24"></div>
                        </div>
                      </div>
                      <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="h-80 bg-gray-200 rounded-xl"></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {isEmpty && !articlesLoading && !articlesError && (
              <div className="text-center py-20 px-6">
                <div className="space-y-3">
                  <p className="text-gray-900 text-lg font-medium">
                    No articles published yet
                  </p>
                  <p className="text-gray-500 text-sm">
                    This publication hasn&apos;t shared any articles. Check back later!
                  </p>
                </div>
              </div>
            )}

            {/* Articles List */}
            {articles.length > 0 && (
              <div className="space-y-6">
                {articles.map((article) => {
                  // Format article data for FeedPost component
                  const coverImage = article.hasCover
                    ? `${CONFIG.API_URL}/articles/media/media0?articleId=${encodeURIComponent(article.articleId)}`
                    : undefined;

                  const formattedArticle = {
                    author: {
                      name: article.authorShortAddress,
                      avatar: createUserAvatarConfig({
                        publicKey: article.author,
                        // Don't pass short address as name - let the function detect it's an address
                      }, 'md').src,
                      address: article.author, // Add full address for consistent gradient generation
                      date: article.timeAgo,
                      readTime: "2 min",
                      mintedBy: 0,
                    },
                    title: article.title,
                    image: coverImage,
                    description: article.summary || `Published on Sui blockchain • ${article.gated ? '🔒 Premium content' : '📖 Free article'}`,
                    engagement: article.engagement,
                    slug: article.slug,
                    publication: publication ? {
                      id: publication.id,
                      name: publication.name,
                      avatar: publication.avatar ?? null,
                    } : undefined,
                  };

                  return (
                    <FeedPost
                      key={article.articleId}
                      {...formattedArticle}
                      articleId={article.articleId}
                      publicationId={article.publicationId}
                      totalTips={article.totalTips}
                    />
                  );
                })}

                {/* Load More Button */}
                {hasMore && (
                  <div className="text-center pt-4">
                    <Button
                      onClick={loadMore}
                      disabled={!canLoadMore}
                      variant="outline"
                      className="gap-2"
                    >
                      {articlesLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        'Load More Articles'
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Retry Button for Articles */}
            {articlesError && (
              <div className="text-center pt-4 px-6">
                <Button
                  onClick={() => {
                    clearArticlesError();
                    refreshArticles();
                  }}
                  variant="outline"
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

/**
 * Publication page
 * 
 * Displays comprehensive publication information including header, stats,
 * and articles feed. Accessible at /publication?id=[PUBLICATION_ID]
 */
const PublicationPage: React.FC = () => {
  return (
    <RequireAuth>
      <Suspense
        fallback={
          <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-muted-foreground">Loading publication...</span>
            </div>
          </div>
        }
      >
        <PublicationPageContent />
      </Suspense>
    </RequireAuth>
  );
};

export default PublicationPage;
