/**
 * Enhanced API Client with Type-Safe Response Handling
 * 
 * This client provides type-safe API interactions with automatic response parsing,
 * error handling, and standardized response formats matching the backend.
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import Cookies from 'js-cookie';
import { CONFIG } from './config';
import {
  ApiResponse,
  PaginatedResponse,
  ApiResponseParser,
  ApiError,
  ApiErrorCode,
  isErrorResponse,
} from '@/types/api';

/**
 * Enhanced API client with response parsing and error handling
 */
export class ApiClient {
  private axiosInstance: AxiosInstance;

  constructor(baseURL: string = CONFIG.API_URL) {
    this.axiosInstance = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor - add auth token
    this.axiosInstance.interceptors.request.use(
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

    // Response interceptor - handle auth errors and parse responses
    this.axiosInstance.interceptors.response.use(
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
  }

  /**
   * Generic request method with type-safe response parsing
   */
  private async request<T>(
    config: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.axiosInstance.request(config);
      
      // Parse the response using our type-safe parser
      return ApiResponseParser.parse(response.data);
    } catch (error) {
      // Handle axios errors
      if (axios.isAxiosError(error) && error.response) {
        const responseData = error.response.data as ApiResponse;
        
        // If the error response follows our API format, parse it
        if (isErrorResponse(responseData)) {
          throw ApiError.fromErrorResponse(responseData);
        }
      }

      // Handle other errors
      if (error instanceof ApiError) {
        throw error;
      }

      // Fallback error handling
      throw new ApiError(
        ApiErrorCode.INTERNAL_SERVER_ERROR,
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  }

  /**
   * GET request with type-safe response
   */
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({
      method: 'GET',
      url,
      ...config,
    });
  }

  /**
   * POST request with type-safe response
   */
  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({
      method: 'POST',
      url,
      data,
      ...config,
    });
  }

  /**
   * PUT request with type-safe response
   */
  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({
      method: 'PUT',
      url,
      data,
      ...config,
    });
  }

  /**
   * PATCH request with type-safe response
   */
  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({
      method: 'PATCH',
      url,
      data,
      ...config,
    });
  }

  /**
   * DELETE request with type-safe response
   */
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({
      method: 'DELETE',
      url,
      ...config,
    });
  }

  /**
   * Special method for paginated requests
   */
  async getPaginated<T>(
    url: string,
    params?: Record<string, unknown>,
    config?: AxiosRequestConfig
  ): Promise<{
    data: T[];
    pagination: PaginatedResponse<T>['pagination'];
  }> {
    try {
      const response: AxiosResponse<PaginatedResponse<T>> = await this.axiosInstance.request({
        method: 'GET',
        url,
        params,
        ...config,
      });

      return ApiResponseParser.parsePaginated(response.data);
    } catch (error) {
      // Handle errors similar to regular requests
      if (axios.isAxiosError(error) && error.response) {
        const responseData = error.response.data as ApiResponse;
        
        if (isErrorResponse(responseData)) {
          throw ApiError.fromErrorResponse(responseData);
        }
      }

      throw new ApiError(
        ApiErrorCode.INTERNAL_SERVER_ERROR,
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  }

  /**
   * Raw axios instance for special cases (like file downloads)
   */
  get axios(): AxiosInstance {
    return this.axiosInstance;
  }
}

// Create default instance
export const apiClient = new ApiClient();

/**
 * Hook for accessing the API client in React components
 */
export function useApiClient(): ApiClient {
  return apiClient;
}

/**
 * Type-safe API endpoint definitions
 */
export const api = {
  // Authentication endpoints
  auth: {
    initAuth: () => apiClient.post<{ nonce: string; message: string }>('/auth/init'),
    authenticate: (data: {
      nonce: string;
      timestamp: string;
      signature: string;
      publicKey: string;
      wallet: string;
      blockchain?: string;
      username?: string;
    }) => apiClient.post<{ accessToken: string; account: Record<string, unknown> }>('/auth', data),
  },

  // User endpoints
  users: {
    getProfile: () => apiClient.get<Record<string, unknown>>('/users/profile'),
    updateProfile: (data: { username?: string }) => 
      apiClient.patch<Record<string, unknown>>('/users/profile', data),
  },

  // Article endpoints
  articles: {
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
        contentId?: string;
      }>;
      storageEpochs?: number;
      isEncrypted?: boolean;
      contentId?: string;
      encryptionMetadata?: {
        originalContentLength: number;
        encryptedContentLength: number;
        algorithm: string;
        contentType: string;
        validationPassed: boolean;
      };
    }) => apiClient.post<{
      articleId: string;
      quiltBlobId: string;
      quiltObjectId: string;
      slug: string;
      transactionDigest: string;
      totalSize: number;
      fileCount: number;
      storageEndEpoch: number;
    }>('/articles/create', data),

    getBySlug: (slug: string) => apiClient.get<{
      articleId: string;
      slug: string;
      title: string;
      summary: string;
      author: string;
      authorShortAddress: string;
      publicationId: string;
      vaultId: string;
      gated: boolean;
      quiltBlobId: string;
      quiltObjectId: string;
      contentSealId?: string;
      category: {
        id: string;
        slug: string;
        name: string;
      };
      createdAt: string;
      transactionHash: string;
      timeAgo: string;
    }>(`/articles/${slug}`),

    getContent: (quiltBlobId: string) => apiClient.get<{
      content: string;
      mediaFiles: Array<{
        identifier: string;
        filename: string;
        tags: Record<string, string>;
      }>;
    }>(`/articles/content/${quiltBlobId}`),

    getRawContent: (quiltBlobId: string) => 
      apiClient.axios.get<ArrayBuffer>(`/articles/raw/${quiltBlobId}`, {
        responseType: 'arraybuffer'
      }),
  },

  // Categories endpoints
  categories: {
    getAll: () => apiClient.get<{
      categories: {
        id: string;
        slug: string;
        name: string;
      }[];
      total: number;
    }>('/categories'),
    
    getBySlug: (slug: string) => apiClient.get<{
      id: string;
      slug: string;
      name: string;
    }>(`/categories/${slug}`),
  },

  // Feed endpoints
  feed: {
    getArticles: (params?: {
      type?: 'fresh' | 'popular' | 'my';
      limit?: number;
      cursor?: string;
      author?: string;
      publicationId?: string;
      categoryId?: string; // New parameter for category filtering
      fromDate?: string;
      toDate?: string;
      timeframe?: 'day' | 'week' | 'month';
    }) => apiClient.getPaginated<Record<string, unknown>>('/feed/articles', params),

    getTrending: (params?: {
      limit?: number;
      timeframe?: 'day' | 'week' | 'month';
    }) => apiClient.get<Record<string, unknown>[]>('/feed/trending', { params }),

    getByPublication: (publicationId: string, params?: {
      limit?: number;
      cursor?: string;
    }) => apiClient.getPaginated<Record<string, unknown>>('/feed/by-publication', {
      ...params,
      publicationId,
    }),

    getStats: () => apiClient.get<{
      totalArticles: number;
      totalPublications: number;
    }>('/feed/stats'),
  },

  // Events endpoints
  events: {
    getArticleCreatedEvents: (params?: {
      articleId?: string;
      publicationId?: string;
      author?: string;
      slug?: string;
      cursor?: string;
      limit?: number;
      fromDate?: string;
      toDate?: string;
    }) => apiClient.getPaginated<Record<string, unknown>>('/events/article-created', params),

    getPublicationCreatedEvents: (params?: {
      publication?: string;
      owner?: string;
      cursor?: string;
      limit?: number;
      fromDate?: string;
      toDate?: string;
    }) => apiClient.getPaginated<Record<string, unknown>>('/events/publication-created', params),
  },
};

export default api;