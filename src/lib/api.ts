import axios from 'axios';
import Cookies from 'js-cookie';
import { CONFIG } from './config';
import { PaginatedDraftArticles } from "@/types/article";
import { ApiResponse } from "@/types/api";

const API_BASE_URL = CONFIG.API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear invalid token
      Cookies.remove('access_token');
      // Redirect to auth page
      if (typeof window !== 'undefined') {
        window.location.href = '/auth';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// API endpoints
export const authAPI = {
  initAuth: () => api.post('/auth/init'),
  authenticate: (data: {
    nonce: string;
    timestamp: string;
    signature: string;
    publicKey: string;
    wallet: string;
    blockchain?: string;
    username?: string;
    inviteCode?: string;
  }) => api.post('/auth', data),
};

// Mobile authentication API (QR code based)
export interface MobileAuthSession {
  sessionId: string;
  expiresAt: string;
}

export interface MobileSessionStatus {
  status: 'pending' | 'authenticated' | 'expired';
  accessToken?: string;
  account?: {
    id: string;
    publicKey: string;
    username?: string;
    avatar?: string;
  };
}

export const mobileAuthAPI = {
  // Generate a new mobile auth session (called by web app)
  // Response is wrapped in { success: true, data: {...} } by backend interceptor
  generateSession: () =>
    api.post<ApiResponse<MobileAuthSession>>('/auth/mobile/session'),

  // Get session status (called by mobile app for polling)
  // Response is wrapped in { success: true, data: {...} } by backend interceptor
  getSessionStatus: (sessionId: string) =>
    api.get<ApiResponse<MobileSessionStatus>>(`/auth/mobile/session/${sessionId}/status`),

  // Complete a session (called by web app to authenticate)
  completeSession: (sessionId: string) =>
    api.post(`/auth/mobile/session/${sessionId}/complete`),
};

export interface SocialAccounts {
  twitter?: string;
  github?: string;
  discord?: string;
  telegram?: string;
  website?: string;
}

export interface UpdateProfileData {
  username?: string;
  description?: string;
  avatar?: string;
  skills?: string[];
  socialAccounts?: SocialAccounts;
}

export const usersAPI = {
  // Get current user's profile (authenticated)
  getProfile: () => api.get('/users/profile'),

  // Get any user's public profile by wallet address
  getPublicProfile: (address: string) => api.get(`/users/profile/${address}`),

  // Update current user's profile
  updateProfile: (data: UpdateProfileData) => api.patch('/users/profile', data),

  // Get user's articles across all publications
  getUserArticles: (
    address: string,
    params: { cursor?: string; limit?: number }
  ) => api.get(`/users/profile/${address}/articles`, { params }),

  // Get available skill categories
  getSkillCategories: () => api.get('/users/skills/categories'),
};

export const feedAPI = {
  getArticles: (params: {
    type?: 'fresh' | 'popular' | 'my';
    limit?: number;
    cursor?: string;
    author?: string;
    publicationId?: string;
    categoryId?: string;
    fromDate?: string;
    toDate?: string;
    timeframe?: 'day' | 'week' | 'month'; // For popular feed
    includeFollowStatus?: boolean; // Include follow information for publications
  }) => api.get('/feed/articles', { params }),

  getTrending: (params: {
    limit?: number;
    timeframe?: 'day' | 'week' | 'month';
  }) => api.get('/feed/trending', { params }),

  getByPublication: (publicationId: string, params: {
    limit?: number;
    cursor?: string;
  }) => api.get('/feed/by-publication', { params: { ...params, publicationId } }),

  getStats: () => api.get('/feed/stats'),
};

export const eventsAPI = {
  getArticleCreatedEvents: (params: {
    articleId?: string;
    publicationId?: string;
    author?: string;
    slug?: string;
    cursor?: string;
    limit?: number;
    fromDate?: string;
    toDate?: string;
  }) => api.get('/events/article-created', { params }),

  getPublicationCreatedEvents: (params: {
    publication?: string;
    owner?: string;
    cursor?: string;
    limit?: number;
    fromDate?: string;
    toDate?: string;
  }) => api.get('/events/publication-created', { params }),
};

export const categoriesAPI = {
  getAll: () => api.get('/categories'),
  getBySlug: (slug: string) => api.get(`/categories/${slug}`),
};

export const articlesAPI = {
  create: (data: {
    title: string;
    content: string;
    summary: string;
    categoryId: string;
    publicationId: string;
    authorAddress: string;
    gated?: boolean;
    mediaFiles?: Array<{
      content: string;
      filename: string;
      mimeType: string;
      size?: number;
      contentId?: string; // For encrypted media files
    }>;
    // Encryption support
    isEncrypted?: boolean;
    contentId?: string;
    encryptionMetadata?: {
      originalContentLength: number;
      encryptedContentLength: number;
      algorithm: string;
      contentType: string;
      validationPassed: boolean;
    };
  }) => api.post('/articles/create', data),

  getBySlug: (slug: string) => api.get(`/articles/${slug}`),

  getContent: (quiltBlobId: string) => api.get(`/articles/content/${quiltBlobId}`),

  getRawContent: async (quiltBlobId: string) => {
    // Import CDN function to avoid circular imports
    const { getRawContentFromCdn } = await import('@/lib/utils/mediaUrlTransform');
    
    try {
      // Try CDN first
      const data = await getRawContentFromCdn(quiltBlobId);
      return { data };
    } catch (cdnError) {
      // Fallback to API if CDN fails
      console.warn('CDN failed, falling back to API:', cdnError);
      return api.get<ArrayBuffer>(`/articles/raw/${quiltBlobId}`, {
        responseType: 'arraybuffer'
      });
    }
  },
};

export const followsAPI = {
  followPublication: (publicationId: string) =>
    api.post(`/follows/${publicationId}`),

  unfollowPublication: (publicationId: string) =>
    api.delete(`/follows/${publicationId}`),

  toggleFollow: (publicationId: string) =>
    api.post(`/follows/${publicationId}/toggle`),

  getFollowStatus: (publicationId: string) =>
    api.get(`/follows/${publicationId}/status`),

  getPublicationInfo: (publicationId: string, userId?: string) =>
    api.get(`/follows/${publicationId}/info`, {
      params: userId ? { userId } : {}
    }),

  getFollowerCount: (publicationId: string) =>
    api.get(`/follows/${publicationId}/count`),

  getMyFollows: (params: { cursor?: string; limit?: number }) =>
    api.get('/follows/my-follows', { params }),

  getPublicationStats: (publicationId: string) =>
    api.get(`/follows/${publicationId}/stats`),

  // Export endpoints (owner only)
  getExportPreview: (publicationId: string, params: {
    dataType: 'email' | 'wallet';
    fromDate?: string;
    toDate?: string;
  }) => api.get(`/follows/${publicationId}/export/preview`, { params }),

  getExportData: (publicationId: string, params: {
    dataType: 'email' | 'wallet';
    fromDate?: string;
    toDate?: string;
  }) => api.get(`/follows/${publicationId}/export/data`, { params }),
};

export interface UpdatePublicationData {
  name?: string;
  description?: string;
  avatar?: string;
  tags?: string[];
  socialAccounts?: SocialAccounts;
}

export interface TopicConfig {
  slug: string;
  name: string;
  gradient: string;
  iconBg: string;
}

export interface RecommendedPublication {
  id: string;
  name: string;
  avatar: string | null;
  description: string | null;
  tags: string[];
  followerCount: number;
  isVerified: boolean;
}

export interface RecommendedPublicationsResponse {
  publications: RecommendedPublication[];
  matchedTopics: string[];
  fallback: boolean;
}

export const publicationsAPI = {
  getPublication: (publicationId: string, userId?: string) =>
    api.get(`/publications/${publicationId}`, {
      params: userId ? { userId } : {},
    }),

  getPublicationAuthenticated: (publicationId: string) =>
    api.get(`/publications/${publicationId}/authenticated`),

  getPublicationArticles: (
    publicationId: string,
    params: {
      cursor?: string;
      limit?: number;
    }
  ) =>
    api.get(`/publications/${publicationId}/articles`, { params }),

  getTopWriters: (limit?: number) =>
    api.get('/publications/top-writers', {
      params: limit ? { limit } : {},
    }),

  updatePublication: (publicationId: string, data: UpdatePublicationData) =>
    api.patch(`/publications/${publicationId}`, data),

  getTopics: () =>
    api.get<ApiResponse<{ topics: TopicConfig[] }>>('/publications/topics'),

  discoverPublications: (params: { page?: number; limit?: number; search?: string }) =>
    api.get('/publications/discover', { params }),

  getRecommendedPublications: (params: { topics: string[]; limit?: number }) =>
    api.get<ApiResponse<RecommendedPublicationsResponse>>(
      '/publications/recommended',
      {
        params,
        paramsSerializer: {
          indexes: null, // Serializes arrays as topics=a&topics=b instead of topics[]=a
        },
      }
    ),
};

export const nftAPI = {
  getRecentMints: (articleId: string, limit?: number) =>
    api.get(`/nft/recent/${articleId}`, { 
      params: limit ? { limit } : {} 
    }),

  getMintCount: (articleId: string) =>
    api.get(`/nft/count/${articleId}`),
};

/**
 * Tipping API endpoints
 * 
 * Note: Tip transactions are handled directly via blockchain transactions (no backend API needed).
 * Tip data is automatically aggregated from blockchain events and included in feed/publication responses.
 * 
 * All tipping functionality is implemented through:
 * - TipButton component for article tips
 * - PublicationTipButton component for publication tips
 * - Backend event handlers process blockchain events automatically
 * - Tip totals are included in article and publication API responses
 * 
 * This object is reserved for future tip analytics endpoints if needed.
 */
export const tipsAPI = {
  // Future endpoint possibilities:
  // - getTipHistory: (articleId: string) => api.get(`/tips/article/${articleId}/history`)
  // - getTipStats: (publicationId: string) => api.get(`/tips/publication/${publicationId}/stats`)  
  // - getTopTippers: () => api.get('/tips/analytics/top-tippers')
} as const;

export const likesAPI = {
  likeArticle: (articleId: string) =>
    api.post(`/likes/${articleId}`),

  unlikeArticle: (articleId: string) =>
    api.delete(`/likes/${articleId}`),

  toggleLike: (articleId: string) =>
    api.post(`/likes/${articleId}/toggle`),

  getLikeStatus: (articleId: string) =>
    api.get(`/likes/${articleId}/status`),

  getArticleLikeCount: (articleId: string) =>
    api.get(`/likes/${articleId}/count`),

  getMyLikedArticles: (params: { cursor?: string; limit?: number }) =>
    api.get('/likes/my-likes', { params }),
};

export const bookmarksAPI = {
  bookmarkArticle: (articleId: string) =>
    api.post(`/bookmarks/${articleId}`),

  unbookmarkArticle: (articleId: string) =>
    api.delete(`/bookmarks/${articleId}`),

  toggleBookmark: (articleId: string) =>
    api.post(`/bookmarks/${articleId}/toggle`),

  getBookmarkStatus: (articleId: string) =>
    api.get(`/bookmarks/${articleId}/status`),

  getArticleBookmarkCount: (articleId: string) =>
    api.get(`/bookmarks/${articleId}/count`),

  getMyBookmarkedArticles: (params: { cursor?: string; limit?: number }) =>
    api.get('/bookmarks/my-bookmarks', { params }),
};

export const commentsAPI = {
  createComment: (articleId: string, content: string) =>
    api.post(`/comments/${articleId}`, { content }),

  getComments: (articleId: string, params: { limit?: number; cursor?: string }) =>
    api.get(`/comments/${articleId}`, { params }),

  deleteComment: (commentId: string) =>
    api.delete(`/comments/${commentId}`),

  getCommentCount: (articleId: string) =>
    api.get(`/comments/${articleId}/count`),
};

export const viewsAPI = {
  recordView: (articleId: string) =>
    api.post(`/views/${articleId}`),

  getViewCount: (articleId: string) =>
    api.get(`/views/${articleId}/count`),
};

export const subscriptionsAPI = {
  // Get user's active subscriptions
  getMySubscriptions: (params: { cursor?: string; limit?: number }) => 
    api.get('/subscriptions/my-subscriptions', { params }),
  
  // Check subscription status for a publication
  getSubscriptionStatus: (publicationId: string) => 
    api.get(`/subscriptions/publications/${publicationId}/status`),
  
  // Get publication subscription info (price, requirements)
  getPublicationSubscriptionInfo: (publicationId: string) => 
    api.get(`/subscriptions/publications/${publicationId}/info`),
  
  // Get subscription stats for publication owners
  getPublicationSubscriptionStats: (publicationId: string) =>
    api.get(`/subscriptions/publications/${publicationId}/stats`),
};

export const analyticsAPI = {
  // Get views analytics for a publication
  getViews: (publicationId: string, startDate: string, endDate: string) =>
    api.get(`/analytics/${publicationId}/views`, {
      params: { startDate, endDate },
    }),

  // Get likes analytics for a publication
  getLikes: (publicationId: string, startDate: string, endDate: string) =>
    api.get(`/analytics/${publicationId}/likes`, {
      params: { startDate, endDate },
    }),

  // Get follows analytics for a publication
  getFollows: (publicationId: string, startDate: string, endDate: string) =>
    api.get(`/analytics/${publicationId}/follows`, {
      params: { startDate, endDate },
    }),

  // Get tips analytics for a publication
  getTips: (publicationId: string, startDate: string, endDate: string) =>
    api.get(`/analytics/${publicationId}/tips`, {
      params: { startDate, endDate },
    }),

  // Get retention analytics for a publication
  getRetention: (publicationId: string, startDate: string, endDate: string) =>
    api.get(`/analytics/${publicationId}/retention`, {
      params: { startDate, endDate },
    }),

  // Get non-follower views analytics for a publication
  getNonFollowerViews: (publicationId: string, startDate: string, endDate: string) =>
    api.get(`/analytics/${publicationId}/non-follower-views`, {
      params: { startDate, endDate },
    }),

  // Get referrer analytics for a publication
  getReferrers: (publicationId: string, startDate: string, endDate: string) =>
    api.get(`/analytics/${publicationId}/referrers`, {
      params: { startDate, endDate },
    }),
};

export const notificationsAPI = {
  getUnreadCount: () => api.get('/notifications/unread-count'),
  getPaginated: (page: number = 1, limit: number = 20) =>
      api.get('/notifications', { params: { page, limit } }),
  markAllAsRead: () => api.patch('/notifications/all/seen'),
};

export const draftsAPI = {
  create: (data: {
    title?: string;
    content: string;
  }) => api.post('/articles/draft', data),

  update: (id: string, data: {
    title?: string;
    content?: string;
  }) => api.patch(`/articles/draft/${id}`, data),

  get: (id: string) => api.get(`/articles/draft/${id}`),

  delete: (id: string) => api.delete(`/articles/draft/${id}`),

  deleteImage: (draftId: string, imageId: string) => api.delete(`/articles/draft/${draftId}/media/${imageId}`),

  uploadImage: (draftId: string, file: File, imageId: string) => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('imageId', imageId);
    return api.post<{ data: { imageId: string } }>(
      `/articles/draft/${draftId}/image`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
  },
  setEditLock: (draftId: string, allow: boolean) => api.patch(`/articles/draft/${draftId}/allow-editing`, { allow }),
  listArticles: (page: number = 1, limit: number = 20) => api.get<ApiResponse<PaginatedDraftArticles>>('/articles/draft/list', {
    params: {
      page,
      limit
    }
  }),
  schedule: (draftId: string, data: { scheduledPublishAt: string }) =>
    api.patch(`/articles/draft/${draftId}/schedule`, data),
  cancelSchedule: (draftId: string) =>
    api.delete(`/articles/draft/${draftId}/schedule`),
};

// RSS Feeds types
export interface FieldMappings {
  titleField?: string;
  contentField?: string;
}

export interface RssFeed {
  id: string;
  publicationId: string;
  url: string;
  name: string | null;
  status: string;
  autoPublish: boolean;
  lastSyncAt: string | null;
  lastSyncError: string | null;
  itemCount: number;
  fieldMappings?: FieldMappings | null;
  createdAt: string;
  updatedAt: string;
}

export interface RssFeedSyncHistory {
  id: string;
  feedId: string;
  status: string;
  itemsFound: number;
  itemsImported: number;
  itemsSkipped: number;
  errorMessage: string | null;
  startedAt: string;
  completedAt: string | null;
  duration: number | null;
}

export interface RssFeedValidationResult {
  valid: boolean;
  title?: string;
  description?: string;
  itemCount?: number;
  error?: string;
}

export interface RssFeedPreviewResult {
  valid: boolean;
  feedTitle?: string;
  feedDescription?: string;
  itemCount?: number;
  sampleItem?: {
    rawFields: Record<string, any>;
    suggestedMapping: {
      titleField: string;
      contentField: string;
    };
  };
  error?: string;
}

export const rssFeedsAPI = {
  // Create a new RSS feed subscription
  createFeed: (data: {
    url: string;
    publicationId: string;
    name?: string;
    autoPublish?: boolean;
    fieldMappings?: FieldMappings;
  }) => api.post<ApiResponse<RssFeed>>('/rss-feeds', data),

  // Get all feeds for a publication
  getFeedsByPublication: (publicationId: string) =>
    api.get<ApiResponse<RssFeed[]>>(`/rss-feeds/publication/${publicationId}`),

  // Get a single feed with sync history
  getFeedDetail: (feedId: string) =>
    api.get<ApiResponse<RssFeed & { recentSyncHistory: RssFeedSyncHistory[] }>>(`/rss-feeds/${feedId}`),

  // Update feed settings
  updateFeed: (feedId: string, data: {
    name?: string;
    autoPublish?: boolean;
    status?: 'active' | 'paused';
  }) => api.patch<ApiResponse<RssFeed>>(`/rss-feeds/${feedId}`, data),

  // Delete a feed
  deleteFeed: (feedId: string) =>
    api.delete<ApiResponse<{ deleted: boolean }>>(`/rss-feeds/${feedId}`),

  // Trigger manual sync
  triggerSync: (feedId: string) =>
    api.post<ApiResponse<{ jobId: string }>>(`/rss-feeds/${feedId}/sync`),

  // Get sync history
  getSyncHistory: (feedId: string, params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse<{
      history: RssFeedSyncHistory[];
      total: number;
      page: number;
      hasMore: boolean;
    }>>(`/rss-feeds/${feedId}/history`, { params }),

  // Validate an RSS feed URL
  validateFeed: (url: string) =>
    api.post<ApiResponse<RssFeedValidationResult>>('/rss-feeds/validate', { url }),

  // Get a preview of the RSS feed with available fields for mapping
  previewFeed: (url: string) =>
    api.post<ApiResponse<RssFeedPreviewResult>>('/rss-feeds/preview', { url }),
};

// SuiNS (Sui Name Service) API
export interface SuinsNameResult {
  address: string;
  name: string | null;
}

export interface SuinsResolveNameResponse {
  address: string;
  name: string | null;
}

export interface SuinsResolveNamesResponse {
  results: SuinsNameResult[];
}

export const suinsAPI = {
  // Resolve a single address to its SuiNS name
  resolveName: (address: string) =>
    api.get<ApiResponse<SuinsResolveNameResponse>>(`/suins/${address}`),

  // Resolve multiple addresses to their SuiNS names (max 50)
  resolveNames: (addresses: string[]) =>
    api.post<ApiResponse<SuinsResolveNamesResponse>>('/suins/batch', { addresses }),
};

// Invite System API
export interface InviteCodeWithUser {
  id: string;
  code: string;
  earnedVia: string;
  createdAt: string;
  expiresAt: string | null;
  usedAt: string | null;
  usedBy: {
    id: string;
    publicKey: string;
    username: string | null;
    avatar: string | null;
  } | null;
}

export interface InviteStats {
  totalCodes: number;
  usedCodes: number;
  availableCodes: number;
  invitedUsers: {
    id: string;
    publicKey: string;
    username: string | null;
    avatar: string | null;
    joinedAt: string;
  }[];
  nextMilestone?: {
    type: 'followers' | 'articles';
    current: number;
    target: number;
  };
}

export interface InviteCodesResponse {
  available: InviteCodeWithUser[];
  used: InviteCodeWithUser[];
  expired: InviteCodeWithUser[];
  stats: InviteStats;
}

export interface InviteValidationResult {
  valid: boolean;
  error?: string;
}

export const invitesAPI = {
  // Check if invite system is enabled (public)
  getSystemStatus: () =>
    api.get<ApiResponse<{ enabled: boolean }>>('/invites/system-status'),

  // Validate an invite code (public)
  validateCode: (code: string) =>
    api.post<ApiResponse<InviteValidationResult>>('/invites/validate', { code }),

  // Get current user's invite codes (auth required)
  getMyCodes: () =>
    api.get<ApiResponse<InviteCodesResponse>>('/invites/my-codes'),

  // Get invite statistics (auth required)
  getStats: () =>
    api.get<ApiResponse<InviteStats>>('/invites/stats'),
};
