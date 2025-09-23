/**
 * Centralized error handling utilities for article operations
 * 
 * This module provides consistent error handling patterns across
 * all article-related hooks and API interactions.
 */

/**
 * Standard axios error structure
 */
interface AxiosError {
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
  code?: string;
  message?: string;
}

/**
 * Parse and format API errors into user-friendly messages
 * 
 * @param error - Error object from API call or operation
 * @param defaultMessage - Default message if error cannot be parsed
 * @returns User-friendly error message
 */
export const parseApiError = (error: unknown, defaultMessage: string = 'An error occurred'): string => {
  // Handle axios errors
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as AxiosError;
    
    if (axiosError.response?.status === 401) {
      return 'Authentication expired. Please log in again.';
    }
    
    if (axiosError.response?.status === 403) {
      return 'You do not have permission to perform this action.';
    }
    
    if (axiosError.response?.status === 404) {
      return 'The requested content was not found.';
    }
    
    if (axiosError.response?.status === 400) {
      return axiosError.response.data?.message || 'Invalid request data.';
    }
    
    if (axiosError.response?.status === 500) {
      return 'Server error. Please try again later.';
    }
    
    if (axiosError.code === 'ECONNABORTED') {
      return 'Request timeout. Please try again with smaller files.';
    }
    
    // Return specific error message if available
    return axiosError.response?.data?.message || axiosError.message || defaultMessage;
  }
  
  // Handle standard Error objects
  if (error instanceof Error) {
    return error.message;
  }
  
  return defaultMessage;
};

/**
 * Parse content-specific errors with specialized messages
 * 
 * @param error - Error from content loading/decryption
 * @returns User-friendly error message for content operations
 */
export const parseContentError = (error: unknown): string => {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('wallet connection required')) {
      return 'Please connect your wallet to view this encrypted content';
    }
    
    if (message.includes('key server')) {
      return 'Decryption service temporarily unavailable. Please try again later.';
    }
    
    if (message.includes('threshold')) {
      return 'Decryption service unavailable. Please try again later.';
    }
    
    if (message.includes('session')) {
      return 'Authentication failed. Please reconnect your wallet and try again.';
    }
    
    if (message.includes('approve_free')) {
      return 'Content access denied. This article may not support free access.';
    }
    
    if (message.includes('bcs') || message.includes('parsing')) {
      return 'Invalid encrypted content: Data may be corrupted.';
    }
    
    return error.message;
  }
  
  return parseApiError(error, 'Failed to load content');
};

/**
 * Parse article creation errors with specialized messages
 * 
 * @param error - Error from article creation/publishing
 * @returns User-friendly error message for creation operations
 */
export const parseCreationError = (error: unknown): string => {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('wallet not connected')) {
      return 'Please connect your wallet to publish articles';
    }
    
    if (message.includes('no publication')) {
      return 'No publication found. Please create a publication first.';
    }
    
    if (message.includes('validation failed')) {
      return error.message; // Keep specific validation errors
    }
    
    if (message.includes('seal encryption not available')) {
      return 'Content encryption service is currently unavailable. Please try again later.';
    }
    
    return error.message;
  }
  
  return parseApiError(error, 'Failed to create article');
};