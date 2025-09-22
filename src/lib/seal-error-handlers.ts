/**
 * Seal Error Handling Utilities
 * 
 * Provides centralized error handling, logging, and recovery utilities
 * for Seal IBE operations throughout the application.
 */

import { 
  SealError, 
  SealErrorType, 
  SealErrorSeverity,
  isSealError,
  createConfigurationError,
  createWalletError,
  createKeyServerError,
  createDecryptionError,
  createValidationError,
  type SealResult,
  type SafeOperation
} from './seal-types';

/**
 * ================================
 * ERROR DETECTION AND CLASSIFICATION
 * ================================
 */

/** Detect and classify errors from various sources */
export function classifySealError(error: unknown): SealError {
  // Already a SealError
  if (isSealError(error)) {
    return error;
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Wallet connection errors
    if (message.includes('wallet') || message.includes('account') || message.includes('not connected')) {
      return createWalletError(error.message);
    }

    // Key server errors
    if (message.includes('key server') || message.includes('threshold') || message.includes('server')) {
      return createKeyServerError(error.message);
    }

    // Session and authentication errors
    if (message.includes('session') || message.includes('auth') || message.includes('signature')) {
      return new SealError(SealErrorType.AUTHENTICATION_FAILED, error.message, {
        severity: SealErrorSeverity.HIGH,
        originalError: error
      });
    }

    // Smart contract and transaction errors
    if (message.includes('transaction') || message.includes('contract') || message.includes('move')) {
      return new SealError(SealErrorType.TRANSACTION_FAILED, error.message, {
        severity: SealErrorSeverity.HIGH,
        originalError: error
      });
    }

    // Network and connection errors
    if (message.includes('network') || message.includes('connection') || message.includes('timeout')) {
      return new SealError(SealErrorType.NETWORK_ERROR, error.message, {
        severity: SealErrorSeverity.MEDIUM,
        originalError: error
      });
    }

    // Access and permission errors
    if (message.includes('access') || message.includes('permission') || message.includes('denied')) {
      return new SealError(SealErrorType.ACCESS_DENIED, error.message, {
        severity: SealErrorSeverity.HIGH,
        originalError: error
      });
    }

    // Decryption errors
    if (message.includes('decrypt') || message.includes('decrypt')) {
      return createDecryptionError(error.message, error);
    }

    // Validation errors
    if (message.includes('invalid') || message.includes('validation') || message.includes('format')) {
      return createValidationError(error.message);
    }

    // Generic error with original
    return new SealError(SealErrorType.ENCRYPTION_FAILED, error.message, {
      severity: SealErrorSeverity.MEDIUM,
      originalError: error
    });
  }

  // Handle string errors
  if (typeof error === 'string') {
    return new SealError(SealErrorType.ENCRYPTION_FAILED, error, {
      severity: SealErrorSeverity.MEDIUM
    });
  }

  // Handle unknown errors
  return new SealError(SealErrorType.ENCRYPTION_FAILED, 'Unknown error occurred', {
    severity: SealErrorSeverity.MEDIUM,
    details: { originalError: error }
  });
}

/**
 * ================================
 * ERROR LOGGING AND REPORTING
 * ================================
 */

/** Log Seal errors with appropriate detail level */
export function logSealError(error: SealError, context?: string): void {
  const prefix = context ? `[${context}]` : '[Seal]';
  const errorData = error.toJSON();

  switch (error.severity) {
    case SealErrorSeverity.CRITICAL:
      console.error(`${prefix} CRITICAL ERROR:`, errorData);
      // In production, this would send to error reporting service
      break;

    case SealErrorSeverity.HIGH:
      console.error(`${prefix} HIGH SEVERITY:`, errorData);
      break;

    case SealErrorSeverity.MEDIUM:
      console.warn(`${prefix} MEDIUM SEVERITY:`, errorData);
      break;

    case SealErrorSeverity.LOW:
      console.log(`${prefix} LOW SEVERITY:`, errorData);
      break;

    default:
      console.error(`${prefix} UNKNOWN SEVERITY:`, errorData);
  }
}

/** Create error report for debugging */
export function createErrorReport(error: SealError, additionalContext?: Record<string, unknown>): {
  error: ReturnType<SealError['toJSON']>;
  context?: Record<string, unknown>;
  timestamp: number;
  userAgent?: string;
  url?: string;
} {
  return {
    error: error.toJSON(),
    context: additionalContext,
    timestamp: Date.now(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
  };
}

/**
 * ================================
 * SAFE OPERATION WRAPPERS
 * ================================
 */

/** Wrap a promise to return a SealResult instead of throwing */
export async function safeExecute<T>(
  operation: () => Promise<T>,
  context?: string
): Promise<SealResult<T>> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error) {
    const sealError = classifySealError(error);
    if (context) {
      logSealError(sealError, context);
    }
    return { success: false, error: sealError };
  }
}

/** Create a safe operation wrapper with chaining */
export function createSafeOperation<T>(operation: () => Promise<T>): SafeOperation<T> {
  let catchHandler: ((error: SealError) => T | Promise<T>) | null = null;
  let finallyHandler: (() => void | Promise<void>) | null = null;

  return {
    async execute(): Promise<T> {
      try {
        return await operation();
      } catch (error) {
        const sealError = classifySealError(error);
        
        if (catchHandler) {
          try {
            return await catchHandler(sealError);
          } catch (catchError) {
            throw classifySealError(catchError);
          }
        }
        
        throw sealError;
      } finally {
        if (finallyHandler) {
          await finallyHandler();
        }
      }
    },

    catch(handler: (error: SealError) => T | Promise<T>): SafeOperation<T> {
      catchHandler = handler;
      return this;
    },

    finally(handler: () => void | Promise<void>): SafeOperation<T> {
      finallyHandler = handler;
      return this;
    }
  };
}

/**
 * ================================
 * ERROR RECOVERY STRATEGIES
 * ================================
 */

/** Determine if an error is recoverable */
export function isRecoverableError(error: SealError): boolean {
  const recoverableTypes = [
    SealErrorType.NETWORK_ERROR,
    SealErrorType.KEY_SERVER_UNAVAILABLE,
    SealErrorType.SESSION_EXPIRED,
    SealErrorType.TRANSACTION_FAILED,
  ];

  return recoverableTypes.includes(error.type);
}

/** Get suggested recovery action for an error */
export function getRecoveryAction(error: SealError): {
  action: 'retry' | 'reconnect' | 'refresh' | 'manual' | 'none';
  message: string;
  delay?: number;
} {
  switch (error.type) {
    case SealErrorType.NETWORK_ERROR:
      return {
        action: 'retry',
        message: 'Network connection failed. Retrying...',
        delay: 2000
      };

    case SealErrorType.KEY_SERVER_UNAVAILABLE:
    case SealErrorType.INSUFFICIENT_KEY_SERVERS:
      return {
        action: 'retry',
        message: 'Encryption servers are busy. Retrying...',
        delay: 5000
      };

    case SealErrorType.WALLET_NOT_CONNECTED:
      return {
        action: 'reconnect',
        message: 'Please connect your wallet to continue.'
      };

    case SealErrorType.SESSION_EXPIRED:
      return {
        action: 'reconnect',
        message: 'Your session has expired. Please reconnect your wallet.'
      };

    case SealErrorType.TRANSACTION_FAILED:
      return {
        action: 'retry',
        message: 'Transaction failed. Retrying...',
        delay: 3000
      };

    case SealErrorType.CONFIGURATION_ERROR:
      return {
        action: 'refresh',
        message: 'Configuration error. Please refresh the page.'
      };

    case SealErrorType.ACCESS_DENIED:
      return {
        action: 'manual',
        message: 'You do not have permission to access this content.'
      };

    case SealErrorType.CONTENT_NOT_FOUND:
      return {
        action: 'manual',
        message: 'The requested content could not be found.'
      };

    default:
      return {
        action: 'none',
        message: error.getUserMessage()
      };
  }
}

/**
 * ================================
 * RETRY MECHANISMS
 * ================================
 */

/** Retry configuration */
export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors?: SealErrorType[];
}

/** Default retry configuration */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryableErrors: [
    SealErrorType.NETWORK_ERROR,
    SealErrorType.KEY_SERVER_UNAVAILABLE,
    SealErrorType.TRANSACTION_FAILED,
  ]
};

/** Execute operation with retry logic */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: SealError | null = null;
  
  for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = classifySealError(error);
      
      // Don't retry if error is not retryable
      if (finalConfig.retryableErrors && !finalConfig.retryableErrors.includes(lastError.type)) {
        throw lastError;
      }
      
      // Don't retry on last attempt
      if (attempt === finalConfig.maxAttempts) {
        break;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        finalConfig.baseDelay * Math.pow(finalConfig.backoffMultiplier, attempt - 1),
        finalConfig.maxDelay
      );
      
      console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms:`, lastError.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

/**
 * ================================
 * VALIDATION HELPERS
 * ================================
 */

/** Validate and throw if invalid */
export function validateAndThrow(
  condition: boolean,
  errorType: SealErrorType,
  message: string,
  details?: Record<string, unknown>
): void {
  if (!condition) {
    throw new SealError(errorType, message, {
      severity: SealErrorSeverity.HIGH,
      details
    });
  }
}

/** Validate Sui address format */
export function validateSuiAddress(address: string, fieldName = 'address'): void {
  validateAndThrow(
    typeof address === 'string' && /^0x[a-fA-F0-9]{64}$/.test(address),
    SealErrorType.INVALID_ADDRESS,
    `Invalid ${fieldName} format. Expected 0x followed by 64 hex characters.`,
    { address, fieldName }
  );
}

/** Validate package ID format */
export function validatePackageId(packageId: string): void {
  validateAndThrow(
    typeof packageId === 'string' && /^0x[a-fA-F0-9]{60,64}$/.test(packageId),
    SealErrorType.INVALID_PACKAGE_ID,
    'Invalid package ID format. Expected 0x followed by 60-64 hex characters.',
    { packageId }
  );
}

/** Validate content ID */
export function validateContentId(contentId: Uint8Array): void {
  validateAndThrow(
    contentId instanceof Uint8Array && contentId.length > 0,
    SealErrorType.INVALID_CONTENT_ID,
    'Invalid content ID. Expected non-empty Uint8Array.',
    { contentIdLength: contentId?.length }
  );
}

/**
 * ================================
 * USER-FRIENDLY ERROR MESSAGES
 * ================================
 */

/** Get user-friendly error message with recovery suggestions */
export function getUserFriendlyError(error: SealError): {
  title: string;
  message: string;
  action?: string;
  recoverable: boolean;
} {
  const recovery = getRecoveryAction(error);
  
  const errorMessages: Record<SealErrorType, { title: string; message: string }> = {
    [SealErrorType.CONFIGURATION_ERROR]: {
      title: 'Configuration Error',
      message: 'The application is not properly configured. Please check your settings.'
    },
    [SealErrorType.NETWORK_ERROR]: {
      title: 'Network Error',
      message: 'Unable to connect to the encryption service. Please check your internet connection.'
    },
    [SealErrorType.CLIENT_NOT_INITIALIZED]: {
      title: 'Service Unavailable',
      message: 'The encryption service is not ready. Please try again in a moment.'
    },
    [SealErrorType.WALLET_NOT_CONNECTED]: {
      title: 'Wallet Required',
      message: 'Please connect your wallet to access encrypted content.'
    },
    [SealErrorType.INVALID_ACCOUNT]: {
      title: 'Invalid Account',
      message: 'Your wallet account is not valid. Please try reconnecting your wallet.'
    },
    [SealErrorType.KEY_SERVER_UNAVAILABLE]: {
      title: 'Service Temporarily Unavailable',
      message: 'The encryption servers are currently busy. Please try again in a few moments.'
    },
    [SealErrorType.INSUFFICIENT_KEY_SERVERS]: {
      title: 'Service Partially Unavailable',
      message: 'Not enough encryption servers are available. Please try again later.'
    },
    [SealErrorType.KEY_SERVER_ERROR]: {
      title: 'Encryption Service Error',
      message: 'There was an error with the encryption service. Please try again.'
    },
    [SealErrorType.SESSION_EXPIRED]: {
      title: 'Session Expired',
      message: 'Your session has expired. Please reconnect your wallet to continue.'
    },
    [SealErrorType.SESSION_INVALID]: {
      title: 'Invalid Session',
      message: 'Your session is invalid. Please reconnect your wallet.'
    },
    [SealErrorType.AUTHENTICATION_FAILED]: {
      title: 'Authentication Failed',
      message: 'Unable to authenticate your wallet. Please try reconnecting.'
    },
    [SealErrorType.ENCRYPTION_FAILED]: {
      title: 'Encryption Failed',
      message: 'Unable to encrypt your content. Please try again.'
    },
    [SealErrorType.INVALID_CONTENT_ID]: {
      title: 'Invalid Content',
      message: 'The content format is invalid. Please try uploading again.'
    },
    [SealErrorType.INVALID_THRESHOLD]: {
      title: 'Invalid Configuration',
      message: 'The encryption configuration is invalid. Please contact support.'
    },
    [SealErrorType.DECRYPTION_FAILED]: {
      title: 'Decryption Failed',
      message: 'Unable to decrypt the content. Please try again.'
    },
    [SealErrorType.ACCESS_DENIED]: {
      title: 'Access Denied',
      message: 'You do not have permission to access this content.'
    },
    [SealErrorType.CONTENT_NOT_FOUND]: {
      title: 'Content Not Found',
      message: 'The requested content could not be found or may have been removed.'
    },
    [SealErrorType.VALIDATION_ERROR]: {
      title: 'Validation Error',
      message: 'The provided data is not valid. Please check your input.'
    },
    [SealErrorType.INVALID_ADDRESS]: {
      title: 'Invalid Address',
      message: 'The provided address format is not valid.'
    },
    [SealErrorType.INVALID_PACKAGE_ID]: {
      title: 'Invalid Package ID',
      message: 'The smart contract package ID is not valid.'
    },
    [SealErrorType.CONTRACT_ERROR]: {
      title: 'Smart Contract Error',
      message: 'There was an error with the smart contract. Please try again.'
    },
    [SealErrorType.TRANSACTION_FAILED]: {
      title: 'Transaction Failed',
      message: 'The blockchain transaction failed. Please try again.'
    },
    [SealErrorType.POLICY_ERROR]: {
      title: 'Policy Error',
      message: 'There was an error with the access policy. Please contact support.'
    },
  };

  const errorInfo = errorMessages[error.type] || {
    title: 'Unknown Error',
    message: error.message
  };

  return {
    ...errorInfo,
    action: recovery.message,
    recoverable: isRecoverableError(error)
  };
}

/**
 * ================================
 * DEVELOPMENT HELPERS
 * ================================
 */

/** Enable debug mode for detailed error logging */
let debugMode = process.env.NODE_ENV === 'development';

export function setDebugMode(enabled: boolean): void {
  debugMode = enabled;
}

export function isDebugMode(): boolean {
  return debugMode;
}

/** Debug log function that only logs in debug mode */
export function debugLog(message: string, data?: unknown): void {
  if (debugMode) {
    console.log(`[Seal Debug] ${message}`, data);
  }
}