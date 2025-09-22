/**
 * Comprehensive Type Definitions for Seal Identity-Based Encryption
 * 
 * Provides centralized type definitions, error classes, and validation utilities
 * for Seal IBE operations in the Inkray frontend.
 */

/**
 * ================================
 * CORE SEAL TYPES
 * ================================
 */

/** Network types supported by Seal */
export type SealNetwork = 'testnet' | 'mainnet' | 'devnet' | 'localnet';

/** Seal encryption threshold values */
export type SealThreshold = 1 | 2 | 3;

/** Content tag types for BCS encoding */
export type ContentTag = 0; // Article content

/** BCS identity version */
export type IdVersion = 1; // V1

/**
 * ================================
 * CONTENT IDENTITY TYPES
 * ================================
 */

/** Raw content identity structure */
export interface ContentIdentity {
  tag: ContentTag;
  version: IdVersion;
  publication: Uint8Array; // 32-byte Sui address
  article: Uint8Array;     // 32-byte Sui address
  nonce: bigint;          // Timestamp for uniqueness
}

/** Content ID in various formats */
export interface ContentIdFormats {
  raw: Uint8Array;        // BCS-encoded bytes
  hex: string;            // Hex string with 0x prefix
  parsed: ContentIdentity; // Parsed structure
}

/**
 * ================================
 * ENCRYPTION TYPES
 * ================================
 */

/** Encryption configuration options */
export interface EncryptionConfig {
  contentId: Uint8Array;
  packageId?: string;
  threshold?: SealThreshold;
}

/** Encryption result with metadata */
export interface EncryptionResult {
  encryptedData: Uint8Array;
  contentId: Uint8Array;
  contentIdHex: string;
  originalSize: number;
  encryptedSize: number;
  timestamp: number;
  threshold: SealThreshold;
}

/** Media file for encryption */
export interface MediaFile {
  content: string; // base64 encoded
  filename: string;
  mimeType: string;
  size?: number;
}

/** Encrypted media file result */
export interface EncryptedMediaFile extends MediaFile {
  contentId: Uint8Array;
  contentIdHex: string;
  isEncrypted: true;
  encryptionTimestamp: number;
}

/** Batch encryption result */
export interface BatchEncryptionResult {
  results: EncryptionResult[];
  totalOriginalSize: number;
  totalEncryptedSize: number;
  successCount: number;
  failureCount: number;
  errors: SealError[];
}

/**
 * ================================
 * DECRYPTION TYPES
 * ================================
 */

/** Decryption request parameters */
export interface DecryptionRequest {
  encryptedData: Uint8Array;
  contentId: Uint8Array;
  articleId: string; // Sui object ID
  packageId?: string;
}

/** Decryption result with metadata */
export interface DecryptionResult {
  decryptedData: Uint8Array;
  contentId: Uint8Array;
  contentIdHex: string;
  originalSize: number;
  decryptedSize: number;
  timestamp: number;
}

/** Decrypted media file result */
export interface DecryptedMediaFile {
  content: string; // base64 encoded decrypted content
  filename: string;
  mimeType: string;
  size: number;
  contentId: Uint8Array;
  contentIdHex: string;
  isDecrypted: true;
  decryptionTimestamp: number;
}

/** Batch decryption result */
export interface BatchDecryptionResult {
  results: DecryptionResult[];
  totalOriginalSize: number;
  totalDecryptedSize: number;
  successCount: number;
  failureCount: number;
  errors: SealError[];
}

/**
 * ================================
 * CLIENT STATUS TYPES
 * ================================
 */

/** Seal client status information */
export interface SealClientStatus {
  isInitialized: boolean;
  network: SealNetwork;
  packageId: string;
  hasAccount: boolean;
  keyServersCount?: number;
  lastActivity?: number;
}

/** Encryption service availability */
export interface EncryptionStatus extends SealClientStatus {
  isAvailable: boolean;
  error?: string;
  keyServerIds?: string[];
}

/** Decryption service availability */
export interface DecryptionStatus extends SealClientStatus {
  isAvailable: boolean;
  error?: string;
  sessionKeyActive?: boolean;
}

/**
 * ================================
 * VALIDATION TYPES
 * ================================
 */

/** Validation result */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/** Content ID validation result */
export interface ContentIdValidation extends ValidationResult {
  contentId?: Uint8Array;
  parsed?: ContentIdentity;
  format?: 'bytes' | 'hex' | 'invalid';
}

/** Sui address validation result */
export interface AddressValidation extends ValidationResult {
  address?: string;
  normalized?: string;
  type?: 'object' | 'package' | 'account';
}

/**
 * ================================
 * ERROR HANDLING TYPES
 * ================================
 */

/** Seal error categories */
export enum SealErrorType {
  // Configuration errors
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  
  // Client errors
  CLIENT_NOT_INITIALIZED = 'CLIENT_NOT_INITIALIZED',
  WALLET_NOT_CONNECTED = 'WALLET_NOT_CONNECTED',
  INVALID_ACCOUNT = 'INVALID_ACCOUNT',
  
  // Key server errors
  KEY_SERVER_UNAVAILABLE = 'KEY_SERVER_UNAVAILABLE',
  INSUFFICIENT_KEY_SERVERS = 'INSUFFICIENT_KEY_SERVERS',
  KEY_SERVER_ERROR = 'KEY_SERVER_ERROR',
  
  // Session errors
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  SESSION_INVALID = 'SESSION_INVALID',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  
  // Encryption errors
  ENCRYPTION_FAILED = 'ENCRYPTION_FAILED',
  INVALID_CONTENT_ID = 'INVALID_CONTENT_ID',
  INVALID_THRESHOLD = 'INVALID_THRESHOLD',
  
  // Decryption errors
  DECRYPTION_FAILED = 'DECRYPTION_FAILED',
  ACCESS_DENIED = 'ACCESS_DENIED',
  CONTENT_NOT_FOUND = 'CONTENT_NOT_FOUND',
  
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_ADDRESS = 'INVALID_ADDRESS',
  INVALID_PACKAGE_ID = 'INVALID_PACKAGE_ID',
  
  // Smart contract errors
  CONTRACT_ERROR = 'CONTRACT_ERROR',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  POLICY_ERROR = 'POLICY_ERROR',
}

/** Seal error severity levels */
export enum SealErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * ================================
 * PROGRESS TRACKING TYPES
 * ================================
 */

/** Operation progress information */
export interface OperationProgress {
  stage: string;
  progress: number; // 0-100
  message?: string;
  timestamp: number;
}

/** Encryption progress stages */
export enum EncryptionStage {
  INITIALIZING = 'initializing',
  VALIDATING = 'validating',
  GENERATING_CONTENT_ID = 'generating_content_id',
  CONNECTING_KEY_SERVERS = 'connecting_key_servers',
  ENCRYPTING_CONTENT = 'encrypting_content',
  ENCRYPTING_MEDIA = 'encrypting_media',
  FINALIZING = 'finalizing',
  COMPLETED = 'completed',
}

/** Decryption progress stages */
export enum DecryptionStage {
  INITIALIZING = 'initializing',
  VALIDATING = 'validating',
  DOWNLOADING_CONTENT = 'downloading_content',
  CONNECTING_KEY_SERVERS = 'connecting_key_servers',
  AUTHENTICATING = 'authenticating',
  BUILDING_TRANSACTION = 'building_transaction',
  DECRYPTING_CONTENT = 'decrypting_content',
  FINALIZING = 'finalizing',
  COMPLETED = 'completed',
}

/**
 * ================================
 * UTILITY TYPES
 * ================================
 */

/** Promise result with error handling */
export type SealResult<T> = Promise<{
  success: boolean;
  data?: T;
  error?: SealError;
}>;

/** Safe operation wrapper */
export interface SafeOperation<T> {
  execute(): Promise<T>;
  catch(handler: (error: SealError) => T | Promise<T>): SafeOperation<T>;
  finally(handler: () => void | Promise<void>): SafeOperation<T>;
}

/**
 * ================================
 * HOOK STATE TYPES
 * ================================
 */

/** Article creation hook state */
export interface ArticleCreationState {
  isProcessing: boolean;
  uploadProgress: number;
  encryptionProgress: number;
  error: string | null;
  isEncrypting: boolean;
  stage?: EncryptionStage;
}

/** Article decryption hook state */
export interface ArticleDecryptionState {
  isLoading: boolean;
  isDownloading: boolean;
  isDecrypting: boolean;
  content: string | null;
  metadata: ArticleMetadata | null;
  error: string | null;
  stage?: DecryptionStage;
}

/** Article metadata from backend */
export interface ArticleMetadata {
  id: string;
  title: string;
  slug: string;
  author: string;
  publicationId: string;
  quiltBlobId: string;
  contentId: string;
  isEncrypted: boolean;
  createdAt: string;
  transactionDigest: string;
  mediaFiles?: EncryptedMediaFile[];
}

/**
 * ================================
 * CUSTOM ERROR CLASS
 * ================================
 */

/** Comprehensive Seal error class */
export class SealError extends Error {
  public readonly type: SealErrorType;
  public readonly severity: SealErrorSeverity;
  public readonly details?: Record<string, unknown>;
  public readonly timestamp: number;
  public readonly originalError?: Error;

  constructor(
    type: SealErrorType,
    message: string,
    options?: {
      severity?: SealErrorSeverity;
      details?: Record<string, unknown>;
      originalError?: Error;
    }
  ) {
    super(message);
    this.name = 'SealError';
    this.type = type;
    this.severity = options?.severity || SealErrorSeverity.MEDIUM;
    this.details = options?.details;
    this.originalError = options?.originalError;
    this.timestamp = Date.now();

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SealError);
    }
  }

  /** Check if error is of specific type */
  isType(type: SealErrorType): boolean {
    return this.type === type;
  }

  /** Check if error is critical */
  isCritical(): boolean {
    return this.severity === SealErrorSeverity.CRITICAL;
  }

  /** Get user-friendly error message */
  getUserMessage(): string {
    switch (this.type) {
      case SealErrorType.WALLET_NOT_CONNECTED:
        return 'Please connect your wallet to continue.';
      case SealErrorType.KEY_SERVER_UNAVAILABLE:
        return 'Encryption service is temporarily unavailable. Please try again later.';
      case SealErrorType.INSUFFICIENT_KEY_SERVERS:
        return 'Not enough encryption servers are available. Please try again later.';
      case SealErrorType.SESSION_EXPIRED:
        return 'Your session has expired. Please reconnect your wallet.';
      case SealErrorType.ACCESS_DENIED:
        return 'You do not have permission to access this content.';
      case SealErrorType.CONTENT_NOT_FOUND:
        return 'The requested content could not be found.';
      default:
        return this.message;
    }
  }

  /** Convert to JSON for logging */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      type: this.type,
      message: this.message,
      severity: this.severity,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }
}

/**
 * ================================
 * TYPE GUARDS
 * ================================
 */

/** Check if error is a SealError */
export function isSealError(error: unknown): error is SealError {
  return error instanceof SealError;
}

/** Check if value is a valid content ID */
export function isValidContentId(value: unknown): value is Uint8Array {
  return value instanceof Uint8Array && value.length > 0;
}

/** Check if value is a valid Sui address */
export function isValidSuiAddress(value: unknown): value is string {
  return typeof value === 'string' && /^0x[a-fA-F0-9]{64}$/.test(value);
}

/** Check if value is a valid Sui package ID */
export function isValidPackageId(value: unknown): value is string {
  return typeof value === 'string' && /^0x[a-fA-F0-9]{60,64}$/.test(value);
}

/** Check if network is supported */
export function isSupportedNetwork(value: unknown): value is SealNetwork {
  return typeof value === 'string' && 
         ['testnet', 'mainnet', 'devnet', 'localnet'].includes(value);
}

/**
 * ================================
 * ERROR FACTORY FUNCTIONS
 * ================================
 */

/** Create configuration error */
export function createConfigurationError(
  message: string, 
  details?: Record<string, unknown>
): SealError {
  return new SealError(SealErrorType.CONFIGURATION_ERROR, message, {
    severity: SealErrorSeverity.HIGH,
    details,
  });
}

/** Create wallet connection error */
export function createWalletError(message?: string): SealError {
  return new SealError(
    SealErrorType.WALLET_NOT_CONNECTED,
    message || 'Wallet not connected',
    { severity: SealErrorSeverity.HIGH }
  );
}

/** Create key server error */
export function createKeyServerError(
  message: string,
  serverIds?: string[]
): SealError {
  return new SealError(SealErrorType.KEY_SERVER_UNAVAILABLE, message, {
    severity: SealErrorSeverity.CRITICAL,
    details: { serverIds },
  });
}

/** Create decryption error */
export function createDecryptionError(
  message: string,
  originalError?: Error
): SealError {
  return new SealError(SealErrorType.DECRYPTION_FAILED, message, {
    severity: SealErrorSeverity.HIGH,
    originalError,
  });
}

/** Create validation error */
export function createValidationError(
  message: string,
  field?: string
): SealError {
  return new SealError(SealErrorType.VALIDATION_ERROR, message, {
    severity: SealErrorSeverity.MEDIUM,
    details: { field },
  });
}

/**
 * ================================
 * EXPORTED TYPE UNIONS
 * ================================
 */

/** All possible Seal operations */
export type SealOperation = 'encrypt' | 'decrypt' | 'validate' | 'configure';

/** All possible content types */
export type ContentType = 'article' | 'media';

/** All error types for type narrowing */
export type AnySealError = SealError;

/** All result types */
export type AnyResult = EncryptionResult | DecryptionResult | ValidationResult;