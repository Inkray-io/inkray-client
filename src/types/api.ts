/**
 * Frontend API Response Types
 * 
 * These types mirror the backend ApiResponse structure to ensure type safety
 * and consistency between frontend and backend response handling.
 */

/**
 * Base API response interface matching backend ResponseBuilder
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  timestamp: string;
}

/**
 * Success response wrapper
 */
export interface SuccessResponse<T = any> extends ApiResponse<T> {
  success: true;
  data: T;
}

/**
 * Error response wrapper
 */
export interface ErrorResponse extends ApiResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * Paginated response interface for lists
 */
export interface PaginatedResponse<T = any> {
  success: true;
  data: T[];
  pagination: {
    cursor?: string;
    nextCursor?: string | null;
    hasMore: boolean;
    total?: number;
    limit: number;
  };
  timestamp: string;
}

/**
 * Standard error codes matching backend ErrorCodes enum
 */
export enum ApiErrorCode {
  // Authentication errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  EXPIRED_TOKEN = 'EXPIRED_TOKEN',
  INVALID_SIGNATURE = 'INVALID_SIGNATURE',
  INVALID_NONCE = 'INVALID_NONCE',

  // Validation errors
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',

  // Database errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  RECORD_NOT_FOUND = 'RECORD_NOT_FOUND',
  DUPLICATE_RECORD = 'DUPLICATE_RECORD',

  // Blockchain errors
  BLOCKCHAIN_CONNECTION_ERROR = 'BLOCKCHAIN_CONNECTION_ERROR',
  INVALID_TRANSACTION = 'INVALID_TRANSACTION',
  EVENT_PROCESSING_ERROR = 'EVENT_PROCESSING_ERROR',

  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Server errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

/**
 * HTTP status codes mapping
 */
export const ApiErrorStatusCodes: Record<ApiErrorCode, number> = {
  [ApiErrorCode.UNAUTHORIZED]: 401,
  [ApiErrorCode.INVALID_TOKEN]: 401,
  [ApiErrorCode.EXPIRED_TOKEN]: 401,
  [ApiErrorCode.INVALID_SIGNATURE]: 401,
  [ApiErrorCode.INVALID_NONCE]: 401,

  [ApiErrorCode.VALIDATION_FAILED]: 400,
  [ApiErrorCode.MISSING_REQUIRED_FIELD]: 400,
  [ApiErrorCode.INVALID_FORMAT]: 400,

  [ApiErrorCode.DATABASE_ERROR]: 500,
  [ApiErrorCode.RECORD_NOT_FOUND]: 404,
  [ApiErrorCode.DUPLICATE_RECORD]: 409,

  [ApiErrorCode.BLOCKCHAIN_CONNECTION_ERROR]: 502,
  [ApiErrorCode.INVALID_TRANSACTION]: 400,
  [ApiErrorCode.EVENT_PROCESSING_ERROR]: 500,

  [ApiErrorCode.RATE_LIMIT_EXCEEDED]: 429,

  [ApiErrorCode.INTERNAL_SERVER_ERROR]: 500,
  [ApiErrorCode.SERVICE_UNAVAILABLE]: 503,
};

/**
 * Utility type for extracting data type from API response
 */
export type ExtractApiData<T> = T extends ApiResponse<infer U> ? U : never;

/**
 * Type guard to check if response is successful
 */
export function isSuccessResponse<T>(response: ApiResponse<T>): response is SuccessResponse<T> {
  return response.success === true && 'data' in response;
}

/**
 * Type guard to check if response is an error
 */
export function isErrorResponse(response: ApiResponse): response is ErrorResponse {
  return response.success === false && 'error' in response;
}

/**
 * Type guard to check if response is paginated
 */
export function isPaginatedResponse<T>(response: ApiResponse<T[]>): response is PaginatedResponse<T> {
  return response.success === true && 'pagination' in response;
}

/**
 * API Error class for structured error handling
 */
export class ApiError extends Error {
  public readonly code: ApiErrorCode;
  public readonly statusCode: number;
  public readonly details?: any;
  public readonly timestamp: string;

  constructor(
    code: ApiErrorCode,
    message: string,
    details?: any,
    statusCode?: number,
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode || ApiErrorStatusCodes[code];
    this.details = details;
    this.timestamp = new Date().toISOString();
  }

  /**
   * Create ApiError from ErrorResponse
   */
  static fromErrorResponse(errorResponse: ErrorResponse): ApiError {
    return new ApiError(
      errorResponse.error.code as ApiErrorCode,
      errorResponse.error.message,
      errorResponse.error.details,
    );
  }

  /**
   * Check if error is retryable based on error code
   */
  isRetryable(): boolean {
    const retryableCodes = [
      ApiErrorCode.SERVICE_UNAVAILABLE,
      ApiErrorCode.RATE_LIMIT_EXCEEDED,
      ApiErrorCode.BLOCKCHAIN_CONNECTION_ERROR,
      ApiErrorCode.DATABASE_ERROR,
    ];
    return retryableCodes.includes(this.code);
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(): string {
    switch (this.code) {
      case ApiErrorCode.UNAUTHORIZED:
        return 'Please sign in to continue';
      case ApiErrorCode.INVALID_TOKEN:
      case ApiErrorCode.EXPIRED_TOKEN:
        return 'Your session has expired. Please sign in again';
      case ApiErrorCode.VALIDATION_FAILED:
        return 'Please check your input and try again';
      case ApiErrorCode.RECORD_NOT_FOUND:
        return 'The requested item could not be found';
      case ApiErrorCode.RATE_LIMIT_EXCEEDED:
        return 'Too many requests. Please wait a moment and try again';
      case ApiErrorCode.SERVICE_UNAVAILABLE:
        return 'Service is temporarily unavailable. Please try again later';
      default:
        return this.message || 'An unexpected error occurred';
    }
  }
}

/**
 * Response parser utility functions
 */
export class ApiResponseParser {
  /**
   * Parse successful response and extract data
   */
  static parseSuccess<T>(response: ApiResponse<T>): T {
    if (isSuccessResponse(response)) {
      return response.data;
    }
    throw new Error('Response is not a success response');
  }

  /**
   * Parse error response and throw ApiError
   */
  static parseError(response: ApiResponse): never {
    if (isErrorResponse(response)) {
      throw ApiError.fromErrorResponse(response);
    }
    throw new Error('Response is not an error response');
  }

  /**
   * Parse any response and return data or throw error
   */
  static parse<T>(response: ApiResponse<T>): T {
    if (isSuccessResponse(response)) {
      return response.data;
    }
    if (isErrorResponse(response)) {
      throw ApiError.fromErrorResponse(response);
    }
    throw new Error('Invalid response format');
  }

  /**
   * Parse paginated response
   */
  static parsePaginated<T>(response: ApiResponse<T[]>): {
    data: T[];
    pagination: PaginatedResponse<T>['pagination'];
  } {
    if (isPaginatedResponse(response)) {
      return {
        data: response.data,
        pagination: response.pagination,
      };
    }
    throw new Error('Response is not a paginated response');
  }
}