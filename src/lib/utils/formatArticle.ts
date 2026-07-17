import { FeedArticle } from '@/types/article';
import { createUserAvatarConfig } from '@/lib/utils/avatar';
import { CONFIG } from '@/lib/config';

/**
 * Transform a backend feed article into the shape `FeedPost` expects. Shared by
 * every feed (popular/fresh/my + community) so posts render identically
 * everywhere. Pure — no hook state.
 */
export function formatArticleForDisplay(article: FeedArticle) {
  const avatarConfig = createUserAvatarConfig(
    {
      publicKey: article.author,
      // Don't pass the short address as name — let the fn detect it's an address.
    },
    'md',
  );
  const hasCover = Boolean(article.hasCover);

  let coverImage: string | undefined;
  if (hasCover && article.coverImageId) {
    coverImage = `${CONFIG.API_URL}/articles/images/article/${article.articleId}/media/${article.coverImageId}`;
  }

  return {
    id: article.articleId,
    author: {
      name: article.authorShortAddress,
      avatar: avatarConfig.src,
      address: article.author,
      date: article.timeAgo,
      readTime: article.readTimeMinutes ? `${article.readTimeMinutes} min` : '2 min',
      category: article.categoryName || undefined,
    },
    title: article.title,
    slug: article.slug,
    image: coverImage,
    description:
      article.summary ||
      `Published on Sui blockchain • ${article.gated ? '🔒 Gated content' : '📖 Free article'}`,
    engagement: {
      likes: article.totalLikes,
      comments: article.totalComments || 0,
      views: (article.viewCount ?? 0) + (article.chatViewCount ?? 0),
      pageViews: article.viewCount ?? 0,
      chatViews: article.chatViewCount ?? 0,
      isLiked: article.isLiked,
      isBookmarked: article.isBookmarked,
      bookmarkCount: article.totalBookmarks,
    },
    transactionHash: article.transactionHash,
    quiltBlobId: article.quiltBlobId,
    quiltObjectId: article.quiltObjectId,
    gated: article.gated,
    hasCover,
  };
}
