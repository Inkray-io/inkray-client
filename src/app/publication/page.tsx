'use client';

import React, { Suspense, useState, useMemo } from 'react';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { useSearchParams } from 'next/navigation';
import { usePublication } from '@/hooks/usePublication';
import { usePublicationFeed } from '@/hooks/usePublicationFeed';
import { useWalletConnection } from '@/hooks/useWalletConnection';
import { AppLayout } from '@/components/layout/AppLayout';
import { PublicationHeader } from '@/components/publication/PublicationHeader';
import { PublicationTags } from '@/components/publication/PublicationTags';
import { PublicationEditModal } from '@/components/publication/PublicationEditModal';
import { ProfileSocialLinks } from '@/components/profile/ProfileSocialLinks';
import { FeedPost } from '@/components/feed/FeedPost';
import { FeedPostSkeleton } from '@/components/feed/FeedPostSkeleton';
import { PublicationPageSkeleton } from '@/components/publication/PublicationPageSkeleton';
import { TopWriters } from '@/components/widgets/TopWriters';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { createUserAvatarConfig } from '@/lib/utils/avatar';
import { createCdnUrl } from '@/lib/utils/mediaUrlTransform';
import { useArticleDeletion } from '@/hooks/useArticleDeletion';
import { addressesEqual } from '@/utils/address';
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
  const { address: currentUserAddress } = useWalletConnection();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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

  // Check if current user is the publication owner
  const isOwner = useMemo(() => {
    if (!publication?.owner || !currentUserAddress) return false;
    return addressesEqual(publication.owner, currentUserAddress);
  }, [publication?.owner, currentUserAddress]);

  // Article deletion hook
  const { deleteArticle, isDeletingArticle } = useArticleDeletion({
    onSuccess: (_articleId) => {
      // Refresh the publication feed after successful deletion
      refreshArticles();
    },
    onError: (error, _articleId) => {
      // Handle deletion error - could show toast notification here
      console.error('Failed to delete article:', error);
    },
  });

  const handleDeleteArticle = (
    articleId: string,
    publicationId: string,
    vaultId: string
  ) => {
    deleteArticle({ articleId, publicationId, vaultId });
  };

  // Handle edit success - refresh publication data
  const handleEditSuccess = () => {
    refreshPublication();
  };

  // Handle missing publication ID
  if (!publicationId) {
    return (
      <AppLayout currentPage="publication">
        <div className="flex items-center justify-center min-h-[400px]">
          <Alert className="max-w-md mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Publication ID is required. Please provide a valid publication ID
              in the URL.
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
              <AlertDescription>{publicationError}</AlertDescription>
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
    </div>
  );

  return (
    <AppLayout
      currentPage="publication"
      rightSidebar={rightSidebar}
      showRightSidebar={true}
    >
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
        {/* Publication Profile Section */}
        {publication && (
          <PublicationHeader
            publication={publication}
            isLoading={publicationLoading}
            isOwner={isOwner}
            onEditClick={() => setIsEditModalOpen(true)}
          />
        )}

        {/* Tags Section */}
        {!publicationLoading && publication?.tags && publication.tags.length > 0 && (
          <PublicationTags tags={publication.tags} />
        )}

        {/* Social Links Section */}
        {!publicationLoading && publication?.socialAccounts && (
          <ProfileSocialLinks socialAccounts={publication.socialAccounts} />
        )}
      </div>

      {/* Articles Feed - Outside container */}
      {!publicationLoading && publication && (
        <div className="mt-6">
          {/* Articles Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Articles</h2>
            {articles.length > 0 && (
              <span className="text-sm text-gray-500">
                {articles.length} {articles.length === 1 ? 'article' : 'articles'}
              </span>
            )}
          </div>

          {/* Articles Error Alert */}
          {articlesError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{articlesError}</AlertDescription>
            </Alert>
          )}

          {/* Articles Loading State */}
          {articlesLoading && articles.length === 0 && (
            <div className="space-y-5">
              <FeedPostSkeleton />
              <FeedPostSkeleton />
            </div>
          )}

          {/* Empty State */}
          {isEmpty && !articlesLoading && !articlesError && (
            <div className="bg-white rounded-2xl border border-gray-100 text-center py-20 px-6">
              <div className="space-y-3">
                <p className="text-gray-900 text-lg font-medium">
                  No articles published yet
                </p>
                <p className="text-gray-500 text-sm">
                  This publication hasn&apos;t shared any articles. Check back
                  later!
                </p>
              </div>
            </div>
          )}

          {/* Articles List */}
          {articles.length > 0 && (
            <div className="space-y-5">
              {articles.map((article) => {
                // Format article data for FeedPost component
                // Determine cover image URL based on storage type
                let coverImage: string | undefined;
                if (article.hasCover) {
                  if (article.coverImageId) {
                    // S3-backed article: use backend proxy URL
                    coverImage = `${CONFIG.API_URL}/articles/images/article/${article.articleId}/media/${article.coverImageId}`;
                  } else if (article.quiltBlobId) {
                    // Legacy Walrus-backed article: use CDN URL
                    coverImage = createCdnUrl(article.quiltBlobId, 'media0');
                  }
                }

                const formattedArticle = {
                  author: {
                    name: article.authorShortAddress,
                    avatar: createUserAvatarConfig(
                      {
                        publicKey: article.author,
                      },
                      'md'
                    ).src,
                    address: article.author,
                    date: article.timeAgo,
                    readTime: article.readTimeMinutes ? `${article.readTimeMinutes} min` : '2 min',
                    category: article.categoryName || undefined,
                  },
                  title: article.title,
                  image: coverImage,
                  description:
                    article.summary ||
                    `Published on Sui blockchain • ${article.gated ? '🔒 Gated content' : '📖 Free article'}`,
                  engagement: article.engagement,
                  slug: article.slug,
                  publication: publication
                    ? {
                        id: publication.id,
                        name: publication.name,
                        avatar: publication.avatar ?? null,
                        owner: publication.owner,
                        isVerified: publication.isVerified,
                      }
                    : undefined,
                };

                return (
                  <FeedPost
                    key={article.articleId}
                    {...formattedArticle}
                    articleId={article.articleId}
                    publicationId={article.publicationId}
                    totalTips={article.totalTips}
                    showFollowButton={false}
                    vaultId={article.vaultId}
                    onDelete={handleDeleteArticle}
                    isDeleting={isDeletingArticle(article.articleId)}
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
            <div className="text-center pt-4">
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

      {/* Edit Publication Modal */}
      {isOwner && (
        <PublicationEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          publication={publication}
          onSuccess={handleEditSuccess}
        />
      )}
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
      <Suspense fallback={<PublicationPageSkeleton />}>
        <PublicationPageContent />
      </Suspense>
    </RequireAuth>
  );
};

export default PublicationPage;
