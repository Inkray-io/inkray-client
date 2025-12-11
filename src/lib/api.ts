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
  }) => api.post('/auth', data),
};

export const usersAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data: { username?: string }) => api.patch('/users/profile', data),
};

export const feedAPI = {
  getArticles: (params: {
    type?: 'fresh' | 'popular' | 'my';
    limit?: number;
    cursor?: string;
    author?: string;
    publicationId?: string;
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

  deleteImage: (draftId: string, mediaIndex: string) => api.delete(`/articles/draft/${draftId}/media/${mediaIndex}`),

  uploadImage: (draftId: string, data: {
    blob: string;
    filename: string;
    mimeType: string;
    mediaIndex: number;
  }) =>
      api.post(`/articles/draft/${draftId}/image`, data),
  setEditLock: (draftId: string, allow: boolean) => api.patch(`/articles/draft/${draftId}/allow-editing`, { allow }),
  listArticles: (page: number = 1, limit: number = 20) => api.get<ApiResponse<PaginatedDraftArticles>>('/articles/draft/list', {
    params: {
      page,
      limit
    }
  }),
};
