import axios from 'axios';
import Cookies from 'js-cookie';
import { CONFIG } from './config';

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
    limit?: number;
    cursor?: string;
    author?: string;
    publicationId?: string;
    fromDate?: string;
    toDate?: string;
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