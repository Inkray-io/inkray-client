/**
 * Standardized Error Handling Utilities
 * 
 * Provides consistent error handling and user-friendly error messages
 * across the entire frontend application, with special focus on
 * encryption/decryption pipeline errors.
 */

export enum ErrorCategory {
  VALIDATION = 'validation',
  ENCRYPTION = 'encryption',
  DECRYPTION = 'decryption',
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  BLOCKCHAIN = 'blockchain',
  DATA_CORRUPTION = 'data_corruption',
  USER_INPUT = 'user_input',
  SYSTEM = 'system'
}

export interface ErrorDetails {
  category: ErrorCategory;
  code: string;
  message: string;
  userMessage: string;
  technicalDetails?: Record<string, unknown>;
  suggestions?: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ErrorContext {
  component?: string;
  operation?: string;
  userId?: string;
  sessionId?: string;
  timestamp: string;
  userAgent?: string;
  network?: string;
}

/**
 * Main error handling service
 */
export class ErrorHandlingService {
  private static instance: ErrorHandlingService;
  private errorLog: Array<ErrorDetails & ErrorContext> = [];

  private constructor() {}

  public static getInstance(): ErrorHandlingService {
    if (!ErrorHandlingService.instance) {
      ErrorHandlingService.instance = new ErrorHandlingService();
    }
    return ErrorHandlingService.instance;
  }

  /**
   * ENCRYPTION/DECRYPTION ERROR HANDLING
   */

  /**
   * Handle encryption-related errors
   */
  handleEncryptionError(error: unknown, context: Partial<ErrorContext> = {}): ErrorDetails {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    let errorDetails: ErrorDetails;

    if (errorMessage.includes('BCS')) {
      errorDetails = {
        category: ErrorCategory.DATA_CORRUPTION,
        code: 'BCS_ENCODING_ERROR',
        message: errorMessage,
        userMessage: 'There was a problem processing your content. Please try again.',
        suggestions: [
          'Refresh the page and try again',
          'Check your internet connection',
          'Contact support if the problem persists'
        ],
        severity: 'high'
      };
    } else if (errorMessage.includes('content ID')) {
      errorDetails = {
        category: ErrorCategory.VALIDATION,
        code: 'INVALID_CONTENT_ID',
        message: errorMessage,
        userMessage: 'Invalid content identifier. Please check your data and try again.',
        suggestions: [
          'Ensure the content is properly formatted',
          'Try creating the content again'
        ],
        severity: 'medium'
      };
    } else if (errorMessage.includes('publication')) {
      errorDetails = {
        category: ErrorCategory.VALIDATION,
        code: 'INVALID_PUBLICATION',
        message: errorMessage,
        userMessage: 'Invalid publication. Please select a valid publication.',
        suggestions: [
          'Check that the publication exists',
          'Verify your permissions for this publication'
        ],
        severity: 'medium'
      };
    } else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
      errorDetails = {
        category: ErrorCategory.NETWORK,
        code: 'NETWORK_ERROR',
        message: errorMessage,
        userMessage: 'Network connection problem. Please check your internet connection.',
        suggestions: [
          'Check your internet connection',
          'Try again in a few moments',
          'Switch to a different network if available'
        ],
        severity: 'medium'
      };
    } else {
      errorDetails = {
        category: ErrorCategory.ENCRYPTION,
        code: 'ENCRYPTION_FAILED',
        message: errorMessage,
        userMessage: 'Failed to encrypt content. Please try again.',
        suggestions: [
          'Try again in a few moments',
          'Refresh the page',
          'Contact support if the problem persists'
        ],
        severity: 'high'
      };
    }

    this.logError(errorDetails, context);
    return errorDetails;
  }

  /**
   * Handle decryption-related errors
   */
  handleDecryptionError(error: unknown, context: Partial<ErrorContext> = {}): ErrorDetails {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    let errorDetails: ErrorDetails;

    if (errorMessage.includes('Wallet connection required')) {
      errorDetails = {
        category: ErrorCategory.AUTHENTICATION,
        code: 'WALLET_NOT_CONNECTED',
        message: errorMessage,
        userMessage: 'Please connect your wallet to view this encrypted content.',
        suggestions: [
          'Connect your wallet using the Connect Wallet button',
          'Make sure your wallet extension is installed and unlocked'
        ],
        severity: 'medium'
      };
    } else if (errorMessage.includes('key server')) {
      errorDetails = {
        category: ErrorCategory.NETWORK,
        code: 'KEY_SERVER_UNAVAILABLE',
        message: errorMessage,
        userMessage: 'Decryption service temporarily unavailable. Please try again later.',
        suggestions: [
          'Wait a few minutes and try again',
          'Check your internet connection',
          'Contact support if the issue persists'
        ],
        severity: 'high'
      };
    } else if (errorMessage.includes('threshold')) {
      errorDetails = {
        category: ErrorCategory.SYSTEM,
        code: 'INSUFFICIENT_KEY_SERVERS',
        message: errorMessage,
        userMessage: 'Decryption service unavailable. Please try again later.',
        suggestions: [
          'Try again in a few minutes',
          'Contact support if the problem persists'
        ],
        severity: 'high'
      };
    } else if (errorMessage.includes('session') || errorMessage.includes('Authentication failed')) {
      errorDetails = {
        category: ErrorCategory.AUTHENTICATION,
        code: 'SESSION_EXPIRED',
        message: errorMessage,
        userMessage: 'Authentication failed. Please reconnect your wallet and try again.',
        suggestions: [
          'Disconnect and reconnect your wallet',
          'Refresh the page and try again'
        ],
        severity: 'medium'
      };
    } else if (errorMessage.includes('approve_free') || errorMessage.includes('Access denied')) {
      errorDetails = {
        category: ErrorCategory.AUTHENTICATION,
        code: 'ACCESS_DENIED',
        message: errorMessage,
        userMessage: 'Content access denied. This article may not support free access.',
        suggestions: [
          'Check if you have the required permissions',
          'Contact the content creator for access'
        ],
        severity: 'medium'
      };
    } else if (errorMessage.includes('BCS') || errorMessage.includes('corrupted')) {
      errorDetails = {
        category: ErrorCategory.DATA_CORRUPTION,
        code: 'DATA_CORRUPTION',
        message: errorMessage,
        userMessage: 'The encrypted content appears to be corrupted.',
        suggestions: [
          'Try refreshing the page',
          'Contact the content creator',
          'Report this issue to support'
        ],
        severity: 'high'
      };
    } else {
      errorDetails = {
        category: ErrorCategory.DECRYPTION,
        code: 'DECRYPTION_FAILED',
        message: errorMessage,
        userMessage: 'Failed to decrypt content. Please try again.',
        suggestions: [
          'Try again in a few moments',
          'Check your wallet connection',
          'Contact support if the problem persists'
        ],
        severity: 'high'
      };
    }

    this.logError(errorDetails, context);
    return errorDetails;
  }

  /**
   * GENERAL ERROR HANDLING
   */

  /**
   * Handle network/API errors
   */
  handleNetworkError(error: unknown, context: Partial<ErrorContext> = {}): ErrorDetails {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    let errorDetails: ErrorDetails;

    if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
      errorDetails = {
        category: ErrorCategory.AUTHENTICATION,
        code: 'UNAUTHORIZED',
        message: errorMessage,
        userMessage: 'You are not authorized to perform this action. Please log in again.',
        suggestions: [
          'Log out and log back in',
          'Check your wallet connection'
        ],
        severity: 'medium'
      };
    } else if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
      errorDetails = {
        category: ErrorCategory.AUTHENTICATION,
        code: 'FORBIDDEN',
        message: errorMessage,
        userMessage: 'You do not have permission to access this content.',
        suggestions: [
          'Check if you have the required permissions',
          'Contact the content owner'
        ],
        severity: 'medium'
      };
    } else if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
      errorDetails = {
        category: ErrorCategory.USER_INPUT,
        code: 'NOT_FOUND',
        message: errorMessage,
        userMessage: 'The requested content was not found.',
        suggestions: [
          'Check the URL and try again',
          'The content may have been moved or deleted'
        ],
        severity: 'low'
      };
    } else if (errorMessage.includes('500') || errorMessage.includes('Internal Server Error')) {
      errorDetails = {
        category: ErrorCategory.SYSTEM,
        code: 'SERVER_ERROR',
        message: errorMessage,
        userMessage: 'Server error. Please try again later.',
        suggestions: [
          'Try again in a few minutes',
          'Contact support if the problem persists'
        ],
        severity: 'high'
      };
    } else if (errorMessage.includes('timeout') || errorMessage.includes('network')) {
      errorDetails = {
        category: ErrorCategory.NETWORK,
        code: 'NETWORK_TIMEOUT',
        message: errorMessage,
        userMessage: 'Network timeout. Please check your connection and try again.',
        suggestions: [
          'Check your internet connection',
          'Try again',
          'Switch to a different network if available'
        ],
        severity: 'medium'
      };
    } else {
      errorDetails = {
        category: ErrorCategory.NETWORK,
        code: 'NETWORK_ERROR',
        message: errorMessage,
        userMessage: 'Network error occurred. Please try again.',
        suggestions: [
          'Check your internet connection',
          'Try again in a few moments'
        ],
        severity: 'medium'
      };
    }

    this.logError(errorDetails, context);
    return errorDetails;
  }

  /**
   * Handle validation errors
   */
  handleValidationError(error: unknown, context: Partial<ErrorContext> = {}): ErrorDetails {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    const errorDetails: ErrorDetails = {
      category: ErrorCategory.VALIDATION,
      code: 'VALIDATION_ERROR',
      message: errorMessage,
      userMessage: 'Please check your input and try again.',
      suggestions: [
        'Review the entered information',
        'Make sure all required fields are filled',
        'Check the format of entered data'
      ],
      severity: 'low'
    };

    this.logError(errorDetails, context);
    return errorDetails;
  }

  /**
   * UTILITY METHODS
   */

  /**
   * Log error with context
   */
  private logError(errorDetails: ErrorDetails, context: Partial<ErrorContext>): void {
    const fullContext: ErrorContext = {
      ...context,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown',
      network: typeof window !== 'undefined' ? (window as any).ethereum?.networkVersion : 'Unknown'
    };

    const logEntry = { ...errorDetails, ...fullContext };
    this.errorLog.push(logEntry);

    // Keep only last 100 errors to prevent memory issues
    if (this.errorLog.length > 100) {
      this.errorLog = this.errorLog.slice(-100);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('🚨 Error logged:', logEntry);
    }
  }

  /**
   * Get error log for debugging
   */
  getErrorLog(): Array<ErrorDetails & ErrorContext> {
    return [...this.errorLog];
  }

  /**
   * Clear error log
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    totalErrors: number;
    errorsByCategory: Record<ErrorCategory, number>;
    errorsBySeverity: Record<string, number>;
    recentErrors: number; // Last 24 hours
  } {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const errorsByCategory = this.errorLog.reduce((acc, error) => {
      acc[error.category] = (acc[error.category] || 0) + 1;
      return acc;
    }, {} as Record<ErrorCategory, number>);

    const errorsBySeverity = this.errorLog.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const recentErrors = this.errorLog.filter(error => 
      new Date(error.timestamp) > oneDayAgo
    ).length;

    return {
      totalErrors: this.errorLog.length,
      errorsByCategory,
      errorsBySeverity,
      recentErrors
    };
  }

  /**
   * Format error for display to user
   */
  formatErrorForUser(errorDetails: ErrorDetails): {
    title: string;
    message: string;
    suggestions: string[];
    severity: string;
  } {
    return {
      title: this.getCategoryDisplayName(errorDetails.category),
      message: errorDetails.userMessage,
      suggestions: errorDetails.suggestions || [],
      severity: errorDetails.severity
    };
  }

  /**
   * Get display name for error category
   */
  private getCategoryDisplayName(category: ErrorCategory): string {
    const displayNames: Record<ErrorCategory, string> = {
      [ErrorCategory.VALIDATION]: 'Validation Error',
      [ErrorCategory.ENCRYPTION]: 'Encryption Error',
      [ErrorCategory.DECRYPTION]: 'Decryption Error',
      [ErrorCategory.NETWORK]: 'Network Error',
      [ErrorCategory.AUTHENTICATION]: 'Authentication Error',
      [ErrorCategory.BLOCKCHAIN]: 'Blockchain Error',
      [ErrorCategory.DATA_CORRUPTION]: 'Data Corruption Error',
      [ErrorCategory.USER_INPUT]: 'Input Error',
      [ErrorCategory.SYSTEM]: 'System Error'
    };
    
    return displayNames[category] || 'Unknown Error';
  }
}

// Export singleton instance
export const errorHandler = ErrorHandlingService.getInstance();

/**
 * Utility functions for common error handling patterns
 */

/**
 * Wrap async operations with standardized error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: Partial<ErrorContext> = {}
): Promise<{ success: true; data: T } | { success: false; error: ErrorDetails }> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error) {
    const errorDetails = errorHandler.handleEncryptionError(error, context);
    return { success: false, error: errorDetails };
  }
}

/**
 * Create error context for component operations
 */
export function createErrorContext(
  component: string,
  operation: string,
  additionalContext: Partial<ErrorContext> = {}
): ErrorContext {
  return {
    component,
    operation,
    ...additionalContext,
    timestamp: new Date().toISOString(),
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown'
  };
}