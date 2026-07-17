'use client';

import { useRouter } from 'next/navigation';
import { FeedPost } from './FeedPost';
import { formatArticleForDisplay } from '@/lib/utils/formatArticle';
import { FeedArticle } from '@/types/article';

/**
 * The single feed post row used by every feed (popular / fresh / my / community)
 * so posts look and behave identically everywhere. Wraps the shared
 * `formatArticleForDisplay` + `FeedPost` with the standard click/publication
 * wiring.
 */
export function FeedArticleCard({
  article,
  showFollowButton = true,
  onDelete,
  isDeleting = false,
}: {
  article: FeedArticle;
  showFollowButton?: boolean;
  onDelete?: (articleId: string, publicationId: string, vaultId: string) => void;
  isDeleting?: boolean;
}) {
  const router = useRouter();
  const display = formatArticleForDisplay(article);

  const publication = {
    id: article.publicationId,
    name:
      (article as { publicationName?: string }).publicationName ||
      article.followInfo?.publicationName ||
      `Publication ${article.publicationId?.slice(0, 8) ?? ''}...`,
    avatar: article.followInfo?.publicationAvatar || null,
    owner: (article as { publicationOwner?: string }).publicationOwner,
    createdAt: article.followInfo?.publicationCreatedAt,
  };

  const handleClick = () => {
    if (article.cached) {
      window.location.assign(`/offline/article?id=${encodeURIComponent(article.slug)}`);
    } else {
      router.push(`/article?id=${encodeURIComponent(article.slug)}`);
    }
  };

  return (
    <FeedPost
      author={display.author}
      title={display.title}
      description={display.description}
      image={display.image}
      engagement={display.engagement}
      hasReadMore={true}
      slug={article.slug}
      onClick={handleClick}
      publication={publication}
      articleId={article.articleId}
      publicationId={article.publicationId}
      totalTips={article.totalTips}
      isFollowing={article.followInfo?.isFollowing}
      followerCount={article.followInfo?.followerCount}
      showFollowButton={showFollowButton}
      vaultId={article.vaultId}
      onDelete={onDelete}
      isDeleting={isDeleting}
      isOffline={article.cached || false}
    />
  );
}
