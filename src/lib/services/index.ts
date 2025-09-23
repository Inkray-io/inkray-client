/**
 * Service Layer Index
 * 
 * Centralized exports for the working Seal service.
 */

// Seal Service - Working encryption/decryption service
export {
  SealService,
  createSealService,
  type EncryptionResult,
  type EncryptionStatus,
  type MediaFile,
  type EncryptedMediaFile,
  type DecryptionParams,
} from './SealService';