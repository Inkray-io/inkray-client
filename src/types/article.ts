/**
 * Unified Article Type Definitions
 * 
 * Centralized type definitions for all article-related data structures,
 * interfaces, and state management across the application.
 */

/**
 * Core article metadata from the backend
 */
export interface Article {
  /** Unique article identifier from Sui blockchain */
  articleId: string;
  /** URL-friendly slug for routing */
  slug: string;
  /** Article title */
  title: string;
  /** Author's full Sui address */
  author: string;
  /** Shortened display version of author address */
  authorShortAddress: string;
  /** ID of the publication this article belongs to */
  publicationId: string;
  /** ID of the vault containing encrypted content */
  vaultId: string;
  /** Whether the article is gated (access restricted) */
  gated: boolean;
  /** Whether the article content appears to be AI-generated (null = not analyzed) */
  aiGenerated?: boolean;
  /** Walrus blob ID for content storage */
  quiltBlobId: string;
  /** Walrus object ID for content storage */
  quiltObjectId: string;
  /** Seal content ID for encrypted content (hex string) */
  contentSealId?: string;
  /** ISO timestamp of article creation */
  createdAt: string;
  /** Sui transaction hash for the article creation */
  transactionHash: string;
  /** Human-readable time since creation (e.g., "2 hours ago") */
  timeAgo: string;
  /** Article category information */
  category?: {
    id: string;
    slug: string;
    name: string;
  };
  /** Optional tags associated with the article */
  tags?: string[];
  /** Optional article summary/excerpt */
  summary?: string;
  /** AI-generated article highlights (3 key sentences) */
  highlights?: string[];
  /** Whether the article has at least one media file that can be used as cover */
  hasCover?: boolean;
  /** Publication follow information */
  followInfo?: {
    publicationName: string;
    publicationAvatar?: string | null;
    followerCount: number;
    isFollowing: boolean;
    followedAt?: string;
  };
  /** Total tip amount received for this article (in MIST) */
  totalTips: number;
  /** Total like count for this article */
  totalLikes: number;
  /** Whether the current user has liked this article (only set when authenticated) */
  isLiked?: boolean;
  /** Total bookmark count for this article */
  totalBookmarks?: number;
  /** Whether the current user has bookmarked this article (only set when authenticated) */
  isBookmarked?: boolean;
  /** Total view count for this article */
  viewCount?: number;
  /** Publication owner address for ownership validation */
  publicationOwner?: string;
  /** Whether this article requires a publication subscription to access */
  requiresPublicationSubscription?: boolean;
  /** Whether the current user has an active publication subscription for this publication */
  hasActivePublicationSubscription?: boolean;
  /** Publication subscription information if available */
  publicationSubscriptionInfo?: {
    id: string;
    subscriptionPrice: number; // in MIST
    subscriptionPeriod: number; // in days
  };
  /** When the user's publication subscription expires (if they have one) */
  publicationSubscriptionExpiresAt?: string;
}

/**
 * Article state for hooks managing single articles
 */
export interface ArticleState {
  /** Current article data */
  article: Article | null;
  /** Decrypted/parsed article content (markdown) */
  content: string | null;
  /** Whether article metadata is being loaded */
  isLoading: boolean;
  /** Whether article content is being loaded/decrypted */
  isLoadingContent: boolean;
  /** Current error message, if any */
  error: string | null;
}

/**
 * Feed article with additional display properties
 */
export interface FeedArticle extends Article {
  /** Additional engagement metrics for feed display */
  engagement?: {
    likes: number;
    comments: number;
    views: number;
    isLiked?: boolean;
  };
  /** Author display information for feed */
  authorInfo?: {
    name: string;
    avatar: string | null;
    readTime: string;
    mintedBy: number;
  };
}

/**
 * Article creation state for tracking publish progress
 */
export interface ArticleCreationState {
  /** Whether the article creation process is currently running */
  isProcessing: boolean;
  /** Upload progress percentage (0-100) */
  uploadProgress: number;
  /** Encryption progress percentage (0-100) */
  encryptionProgress: number;
  /** Current error message, if any */
  error: string | null;
  /** Whether the encryption step is currently active */
  isEncrypting: boolean;
}

/**
 * Result returned after successful article upload
 */
export interface ArticleUploadResult {
  /** Blockchain article ID from Sui transaction */
  articleId: string;
  /** Walrus blob ID for content storage */
  quiltBlobId: string;
  /** Walrus object ID for content storage */
  quiltObjectId: string;
  /** URL-friendly slug for the article */
  slug: string;
  /** Sui transaction digest */
  transactionDigest: string;
  /** Total size of uploaded content in bytes */
  totalSize: number;
  /** Number of files uploaded */
  fileCount: number;
  /** Storage epoch when content will expire */
  storageEndEpoch: number;
}

/**
 * Media file data structure for article attachments
 */
export interface MediaFile {
  /** Base64-encoded file content */
  content: string;
  /** Original filename */
  filename: string;
  /** MIME type of the file */
  mimeType: string;
  /** Optional file size in bytes */
  size?: number;
}

/**
 * Article content with media files (from Walrus)
 */
export interface ArticleContentResponse {
  /** Markdown content of the article */
  content: string;
  /** Associated media files */
  mediaFiles: Array<{
    identifier: string;
    filename: string;
    tags: Record<string, string>;
  }>;
}

/**
 * Content loading state for useArticleContent hook
 */
export interface ArticleContentState {
  /** Loaded article content */
  content: string | null;
  /** Associated media files */
  mediaFiles: Array<{
    identifier: string;
    filename: string;
    tags: Record<string, string>;
  }>;
  /** Whether content is being loaded */
  isLoading: boolean;
  /** Current error message, if any */
  error: string | null;
}

/**
 * Feed articles state for managing article lists
 */
export interface FeedArticlesState {
  /** Array of loaded articles */
  articles: FeedArticle[];
  /** Whether articles are currently being loaded */
  isLoading: boolean;
  /** Current error message, if any */
  error: string | null;
  /** Whether more articles are available for pagination */
  hasMore: boolean;
  /** Cursor for pagination (next page token) */
  nextCursor: string | null;
  /** Total number of articles available */
  total: number;
}

/**
 * Article error types for better error handling
 */
export enum ArticleErrorType {
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  DECRYPTION_FAILED = 'DECRYPTION_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  INVALID_FORMAT = 'INVALID_FORMAT',
  WALLET_REQUIRED = 'WALLET_REQUIRED'
}

/**
 * Structured error for article operations
 */
export interface ArticleError {
  type: ArticleErrorType;
  message: string;
  details?: Record<string, unknown>;
  retryable: boolean;
}

/**
 * Temporary image data for editor image handling before upload
 */
export interface TemporaryImage {
  /** Unique identifier (UUID) */
  id: string;
  /** Original file object */
  file: File;
  /** Original filename */
  filename: string;
  /** File MIME type */
  mimeType: string;
  /** File size in bytes */
  size: number;
  /** Predicted media index (media0, media1, etc.) */
  index: number;
  /** Final URL that will remain in markdown */
  finalUrl: string;
  /** Blob URL for preview in editor */
  blobUrl: string;
}

/**
 * Image validation result
 */
export interface ImageValidation {
  /** Whether the image is valid */
  isValid: boolean;
  /** Array of validation error messages */
  errors: string[];
}

/**
 * Social accounts for publications
 */
export interface PublicationSocialAccounts {
  twitter?: string;
  github?: string;
  discord?: string;
  telegram?: string;
  website?: string;
}

/**
 * Publication information from the backend
 */
export interface Publication {
  /** Publication ID (Sui address) */
  id: string;
  /** Publication display name */
  name: string;
  /** Optional publication description */
  description?: string;
  /** Owner's Sui address */
  owner: string;
  /** Optional vault ID for publication storage */
  vaultId?: string;
  /** Optional avatar as base64 data URL */
  avatar?: string;
  /** Array of tag slugs */
  tags?: string[];
  /** Social media accounts */
  socialAccounts?: PublicationSocialAccounts | null;
  /** Publication creation date */
  createdAt: string;
  /** Number of articles published */
  articleCount: number;
  /** Number of followers */
  followerCount: number;
  /** Whether current user follows this publication */
  isFollowing: boolean;
  /** Date user followed this publication (if following) */
  followedAt?: string;
  /** Total tips received (direct + article tips) in MIST */
  totalTips?: number;
  /** Direct publication tips in MIST */
  directTips?: number;
  /** Tips from articles in MIST */
  articleTips?: number;
  /** Monthly subscription price in MIST (0 = no subscription required) */
  subscriptionPrice?: number;
  /** Subscription balance in MIST (accumulated from subscription payments) */
  subscriptionBalance?: number;
}

/**
 * Publication state for hooks managing publication data
 */
export interface PublicationState {
  /** Current publication data */
  publication: Publication | null;
  /** Whether publication data is being loaded */
  isLoading: boolean;
  /** Current error message, if any */
  error: string | null;
}

/**
 * Publication articles feed state
 */
export interface PublicationFeedState {
  /** Array of loaded articles from this publication */
  articles: FeedArticle[];
  /** Whether articles are currently being loaded */
  isLoading: boolean;
  /** Current error message, if any */
  error: string | null;
  /** Whether more articles are available for pagination */
  hasMore: boolean;
  /** Cursor for pagination (next page token) */
  nextCursor: string | null;
  /** Total number of articles in current batch */
  total: number;
}

/**
 * Publication article data structure from API
 * Used for transforming publication-specific article responses
 */
export interface PublicationArticle {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  hasCover?: boolean;
  author: string;
  authorShortAddress: string;
  createdAt: string;
  transactionHash: string;
  quiltObjectId?: string;
  quiltBlobId: string;
  gated: boolean;
  timeAgo: string;
  totalTips: number;
  totalLikes: number;
  isLiked?: boolean;
  viewCount?: number;
  publicationOwner?: string;
  vaultId?: string;
  publicationId?: string;
}
