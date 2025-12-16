"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { UserArticle } from '@/hooks/useUserArticles';
import { createCdnUrl } from '@/lib/utils/mediaUrlTransform';
import { HiDocumentText, HiArrowRight } from 'react-icons/hi2';
import { Loader2 } from 'lucide-react';
import { FeedPost } from '@/components/feed/FeedPost';
import { FeedPostSkeleton } from '@/components/feed/FeedPostSkeleton';
import { formatAddress } from '@/utils/address';
import { createUserAvatarConfig } from '@/lib/utils/avatar';

interface ProfileArticlesProps {
  articles: UserArticle[];
  isLoading: boolean;
  isLoadingMore?: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

export function ProfileArticles({
  articles,
  isLoading,
  isLoadingMore,
  hasMore,
  onLoadMore,
}: ProfileArticlesProps) {
  return (
    <section className="px-5 py-4 border-t border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Articles</h2>
        {articles.length > 0 && (
          <span className="text-sm text-gray-500">
            {articles.length} {articles.length === 1 ? 'article' : 'articles'}
          </span>
        )}
      </div>

      {/* Loading initial */}
      {isLoading && articles.length === 0 && (
        <div className="space-y-5">
          <FeedPostSkeleton />
          <FeedPostSkeleton />
          <FeedPostSkeleton />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && articles.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <HiDocumentText className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 text-sm">No articles published yet</p>
          <p className="text-gray-400 text-xs mt-1">
            Articles will appear here once published
          </p>
        </div>
      )}

      {/* Articles list */}
      {articles.length > 0 && (
        <div className="space-y-5">
          {articles.map((article) => {
            const avatarConfig = createUserAvatarConfig(
              { publicKey: article.author },
              'md'
            );
            const coverImage =
              article.hasCover && article.quiltId
                ? createCdnUrl(article.quiltId, 'media0')
                : undefined;

            return (
              <FeedPost
                key={article.id}
                author={{
                  name: formatAddress(article.author),
                  avatar: avatarConfig.src,
                  address: article.author,
                  date: formatTimeAgo(article.createdAt),
                  readTime: '2 min',
                  mintedBy: 0,
                }}
                title={article.title}
                description={
                  article.summary ||
                  `Published on Sui blockchain • ${article.gating ? '🔒 Premium content' : '📖 Free article'}`
                }
                image={coverImage}
                hasReadMore={true}
                slug={article.slug}
                publication={
                  article.publication
                    ? {
                        id: article.publication.id,
                        name: article.publication.name,
                        avatar: article.publication.avatar,
                        owner: article.publication.owner,
                        isVerified: article.publication.isVerified,
                      }
                    : undefined
                }
                articleId={article.articleId}
                publicationId={article.publicationId}
                totalTips={article.totalTips}
                engagement={{
                  likes: article.likesCount,
                  comments: article.commentsCount,
                  views: article.viewCount + (article.chatViewCount ?? 0),
                  pageViews: article.viewCount,
                  chatViews: article.chatViewCount ?? 0,
                  isLiked: article.isLiked,
                  isBookmarked: article.isBookmarked,
                  bookmarkCount: article.bookmarksCount,
                }}
                showFollowButton={false}
                vaultId={article.vaultId}
              />
            );
          })}

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                onClick={onLoadMore}
                disabled={isLoadingMore}
                variant="outline"
                className="gap-2 rounded-xl px-6"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    Load More Articles
                    <HiArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
