/**
 * Comprehensive TypeScript Interfaces for Data Pipeline
 * 
 * Defines all types and interfaces used throughout the encryption-decryption
 * pipeline to ensure type safety and proper data handling.
 */

// ============================================================================
// BASIC DATA TYPES
// ============================================================================

/**
 * Base64 encoded string type for clarity in function signatures
 */
export type Base64String = string;

/**
 * Hex encoded string type (always starts with 0x)
 */
export type HexString = string;

/**
 * Sui object ID type
 */
export type SuiObjectId = string;

/**
 * Sui address type
 */
export type SuiAddress = string;

// ============================================================================
// CONTENT IDENTIFICATION
// ============================================================================

/**
 * Content ID structure for BCS encoding
 */
export interface ContentIdV1 {
  tag: number;        // 0 for article content
  version: number;    // 1 for V1
  publication: SuiAddress; // Publication address
  nonce: bigint;      // Timestamp-based nonce for uniqueness
}

/**
 * Content identity metadata
 */
export interface ContentIdentity {
  id: HexString;
  type: 'article' | 'media';
  publication: SuiObjectId;
  timestamp: number;
  isValid: boolean;
}

// ============================================================================
// ENCRYPTION PIPELINE TYPES
// ============================================================================

/**
 * Input parameters for content encryption
 */
export interface EncryptionInput {
  content: string;
  publicationId: SuiObjectId;
  articleTitle: string;
  contentType: 'markdown' | 'text';
}

/**
 * Encryption metadata for validation and tracking
 */
export interface EncryptionMetadata {
  originalContentLength: number;
  encryptedContentLength: number;
  algorithm: 'seal-ibe';
  contentType: 'markdown' | 'text';
  validationPassed: boolean;
  timestamp: string;
  network: string;
}

/**
 * Complete encryption result
 */
export interface EncryptionResult {
  encryptedData: Uint8Array;
  contentId: HexString;
  metadata: EncryptionMetadata;
  bcsValidated: boolean;
  validationErrors: string[];
  validationWarnings: string[];
}

/**
 * Prepared encryption data for backend transmission
 */
export interface EncryptionPayload {
  encryptedContentBase64: Base64String;
  contentId: HexString;
  metadata: EncryptionMetadata;
}

// ============================================================================
// DECRYPTION PIPELINE TYPES
// ============================================================================

/**
 * Input parameters for content decryption
 */
export interface DecryptionInput {
  encryptedData: Uint8Array;
  contentId: HexString;
  articleId: SuiObjectId;
  network?: string;
}

/**
 * Decryption context for session management
 */
export interface DecryptionContext {
  walletAddress: SuiAddress;
  sessionKey?: string;
  keyServerIds: string[];
  threshold: number;
  ttlMinutes: number;
}

/**
 * Decryption result with validation
 */
export interface DecryptionResult {
  content: string;
  metadata: {
    originalSize: number;
    decryptedSize: number;
    validationPassed: boolean;
    decryptionTime: number; // milliseconds
  };
  validationErrors: string[];
  validationWarnings: string[];
}

// ============================================================================
// MEDIA FILE TYPES
// ============================================================================

/**
 * Media file for encryption
 */
export interface MediaFile {
  content: Base64String;
  filename: string;
  mimeType: string;
  size?: number;
}

/**
 * Encrypted media file
 */
export interface EncryptedMediaFile extends MediaFile {
  contentId: HexString;
  isEncrypted: true;
  encryptionMetadata: EncryptionMetadata;
}

/**
 * Media file with identifier for Walrus storage
 */
export interface StorageMediaFile {
  content: Uint8Array;
  identifier: string;
  filename: string;
  mimeType: string;
  size: number;
  tags: Record<string, string>;
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

/**
 * Validation result structure
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  details?: Record<string, unknown>;
}

/**
 * Validation error with context
 */
export interface ValidationError {
  code: string;
  message: string;
  field?: string;
  value?: unknown;
}

/**
 * Validation warning with context
 */
export interface ValidationWarning {
  code: string;
  message: string;
  field?: string;
  value?: unknown;
  suggestion?: string;
}

/**
 * Validation stages in the pipeline
 */
export type ValidationStage = 
  | 'input-validation'
  | 'content-validation'
  | 'bcs-validation'
  | 'encryption-validation'
  | 'decryption-validation'
  | 'output-validation';

/**
 * Data integrity check result
 */
export interface DataIntegrityCheck {
  stage: ValidationStage;
  timestamp: string;
  isValid: boolean;
  checksPerformed: string[];
  issues: string[];
  recommendations?: string[];
}

// ============================================================================
// API TYPES
// ============================================================================

/**
 * Article creation request for API
 */
export interface ArticleCreationRequest {
  title: string;
  content: string;
  publicationId: SuiObjectId;
  authorAddress: SuiAddress;
  isGated?: boolean;
  mediaFiles?: MediaFile[];
  storageEpochs?: number;
  
  // Encryption fields
  isEncrypted?: boolean;
  contentId?: HexString;
  encryptionMetadata?: EncryptionMetadata;
}

/**
 * Article creation response from API
 */
export interface ArticleCreationResponse {
  articleId: SuiObjectId;
  quiltBlobId: string;
  quiltObjectId: SuiObjectId;
  slug: string;
  transactionDigest: string;
  totalSize: number;
  fileCount: number;
  storageEndEpoch: number;
}

/**
 * Article metadata from API
 */
export interface ArticleMetadata {
  articleId: SuiObjectId;
  slug: string;
  title: string;
  author: SuiAddress;
  authorShortAddress: string;
  publicationId: SuiObjectId;
  vaultId: SuiObjectId;
  isEncrypted: boolean;
  quiltBlobId: string;
  quiltObjectId: SuiObjectId;
  contentSealId?: HexString;
  createdAt: string;
  transactionHash: string;
  timeAgo: string;
}

/**
 * Raw content response from API
 */
export interface RawContentResponse {
  data: ArrayBuffer | Uint8Array | Base64String;
  contentType: string;
  size: number;
}

// ============================================================================
// BACKEND STORAGE TYPES
// ============================================================================

/**
 * Walrus file data for upload
 */
export interface WalrusFileData {
  content: Uint8Array;
  identifier: string;
  filename: string;
  tags: Record<string, string>;
}

/**
 * Walrus upload options
 */
export interface WalrusUploadOptions {
  epochs?: number;
  deletable?: boolean;
}

/**
 * Walrus upload result
 */
export interface WalrusUploadResult {
  blobId: string;
  blobObjectId: SuiObjectId;
  totalSize: number;
  storageEndEpoch: number;
  fileCount: number;
}

// ============================================================================
// ERROR HANDLING TYPES
// ============================================================================

/**
 * Error categories for the pipeline
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

/**
 * Error details with context
 */
export interface ErrorDetails {
  category: ErrorCategory;
  code: string;
  message: string;
  userMessage: string;
  technicalDetails?: Record<string, unknown>;
  suggestions?: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Error context for debugging
 */
export interface ErrorContext {
  component?: string;
  operation?: string;
  userId?: string;
  sessionId?: string;
  timestamp: string;
  userAgent?: string;
  network?: string;
}

// ============================================================================
// PIPELINE STATE TYPES
// ============================================================================

/**
 * Pipeline operation state
 */
export interface PipelineState {
  stage: 'idle' | 'encrypting' | 'uploading' | 'blockchain' | 'completed' | 'error';
  progress: number; // 0-100
  currentOperation?: string;
  error?: ErrorDetails;
  startTime?: string;
  estimatedTimeRemaining?: number; // seconds
}

/**
 * Pipeline configuration
 */
export interface PipelineConfig {
  network: string;
  packageId: SuiObjectId;
  keyServerIds: string[];
  threshold: number;
  validationEnabled: boolean;
  debugMode: boolean;
}

/**
 * Pipeline statistics
 */
export interface PipelineStats {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  averageProcessingTime: number; // milliseconds
  lastOperation?: string;
  errorRate: number; // percentage
}

// ============================================================================
// SERVICE INTERFACE TYPES
// ============================================================================

/**
 * Data pipeline service interface
 */
export interface IDataPipelineService {
  encryptForStorage(params: EncryptionInput): Promise<EncryptionPayload>;
  decryptFromStorage(params: DecryptionInput): Promise<string>;
  downloadEncryptedContent(quiltBlobId: string): Promise<Uint8Array>;
  verifyDataIntegrity(encryptedData: Uint8Array, contentId: HexString): Promise<boolean>;
}

/**
 * Validation service interface
 */
export interface IValidationService {
  validateMarkdownContent(content: string): ValidationResult;
  validateSuiAddress(address: string, fieldName?: string): ValidationResult;
  validateBCSEncryptedObject(encryptedData: Uint8Array, expectedContentId?: HexString): ValidationResult;
  validateContentId(contentId: HexString): ValidationResult;
  validateBase64Data(base64String: Base64String, expectedBinarySize?: number): ValidationResult;
}

/**
 * Enhanced Seal service interface
 */
export interface ISealService {
  encryptContent(params: EncryptionInput): Promise<EncryptionResult>;
  decryptContent(params: DecryptionInput): Promise<string>;
  verifyDataIntegrity(encryptedData: Uint8Array, contentId: HexString): ValidationResult;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Result wrapper for operations that can fail
 */
export type Result<T, E = ErrorDetails> = 
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Async result wrapper
 */
export type AsyncResult<T, E = ErrorDetails> = Promise<Result<T, E>>;

/**
 * Optional with reason for why it's undefined
 */
export interface Optional<T> {
  value?: T;
  reason?: string;
}

/**
 * Timestamp in ISO string format
 */
export type ISOTimestamp = string;

/**
 * Network identifier
 */
export type NetworkId = 'mainnet' | 'testnet' | 'devnet' | 'localnet';

/**
 * Blockchain transaction status
 */
export type TransactionStatus = 'pending' | 'confirmed' | 'failed' | 'unknown';

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard for hex strings
 */
export function isHexString(value: string): value is HexString {
  return /^0x[a-fA-F0-9]+$/.test(value);
}

/**
 * Type guard for Sui addresses
 */
export function isSuiAddress(value: string): value is SuiAddress {
  return /^0x[a-fA-F0-9]{64}$/.test(value);
}

/**
 * Type guard for Base64 strings
 */
export function isBase64String(value: string): value is Base64String {
  return /^[A-Za-z0-9+/]*={0,2}$/.test(value) && value.length % 4 === 0;
}

/**
 * Type guard for validation results
 */
export function isValidationResult(obj: unknown): obj is ValidationResult {
  return typeof obj === 'object' && 
         obj !== null && 
         'isValid' in obj && 
         'errors' in obj && 
         'warnings' in obj;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * BCS constants for content ID generation
 */
export const BCS_CONSTANTS = {
  TAG_ARTICLE_CONTENT: 0,
  ID_VERSION_V1: 1,
  EXPECTED_CONTENT_ID_LENGTH: 88, // 0x + 86 hex chars
  EXPECTED_ADDRESS_LENGTH: 66,    // 0x + 64 hex chars
} as const;

/**
 * Validation limits
 */
export const VALIDATION_LIMITS = {
  MAX_CONTENT_SIZE: 1000000,      // 1MB
  MIN_CONTENT_SIZE: 10,           // 10 characters
  MAX_TITLE_LENGTH: 200,          // 200 characters
  MIN_TITLE_LENGTH: 1,            // 1 character
  MAX_MEDIA_FILES: 10,            // 10 files
  MAX_MEDIA_FILE_SIZE: 10485760,  // 10MB per file
} as const;

/**
 * Pipeline timeouts in milliseconds
 */
export const PIPELINE_TIMEOUTS = {
  ENCRYPTION: 30000,    // 30 seconds
  DECRYPTION: 60000,    // 60 seconds
  UPLOAD: 120000,       // 2 minutes
  DOWNLOAD: 60000,      // 60 seconds
  VALIDATION: 5000,     // 5 seconds
} as const;