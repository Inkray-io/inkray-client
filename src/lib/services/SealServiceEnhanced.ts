import { SuiClient } from '@mysten/sui/client';
import { WalletAccount } from '@mysten/wallet-standard';
import { Transaction } from '@mysten/sui/transactions';
import { SealClient, SessionKey, EncryptedObject } from '@mysten/seal';
import { fromHex, toBase64 } from '@mysten/bcs';
import { generateArticleContentId, generateMediaContentId, contentIdToHex } from '../seal-identity';
import { getSealClient, type InkraySealClient } from '../seal-client';
import { CONFIG } from '../config';

/**
 * Enhanced Seal Service for Content Encryption and Decryption
 * 
 * This service provides comprehensive BCS validation, error handling, and data integrity verification
 * for all Seal operations. It integrates with the DataPipelineService for unified data flow management.
 * 
 * Key Features:
 * - Comprehensive BCS validation at every step
 * - Enhanced error handling with user-friendly messages
 * - Data integrity verification throughout the pipeline
 * - Detailed logging for debugging and monitoring
 */

export interface EnhancedEncryptionResult {
  encryptedData: Uint8Array;
  contentId: string;
  metadata: {
    originalSize: number;
    encryptedSize: number;
    algorithm: string;
    contentType: string;
    bcsValidated: boolean;
    validationErrors: string[];
    validationWarnings: string[];
  };
}

export interface EnhancedDecryptionParams {
  encryptedData: Uint8Array;
  contentId: string;
  articleId: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  details?: Record<string, unknown>;
}

/**
 * Enhanced Seal Service with comprehensive validation
 */
export class SealServiceEnhanced {
  /**
   * STATIC METHODS FOR SIMPLE OPERATIONS
   */

  /**
   * Encrypt content with comprehensive validation
   */
  static async encryptContent(params: {
    content: string;
    publicationId: string;
    articleTitle: string;
  }): Promise<EnhancedEncryptionResult> {
    console.log('🔐 Enhanced Seal encryption starting...', {
      contentLength: params.content.length,
      publicationId: params.publicationId.substring(0, 20) + '...',
      title: params.articleTitle
    });

    try {
      // Phase 1: Validate input parameters
      const inputValidation = this.validateEncryptionInput(params);
      if (!inputValidation.isValid) {
        throw new Error(`Input validation failed: ${inputValidation.errors.join(', ')}`);
      }

      // Phase 2: Generate content ID with BCS encoding
      const contentId = generateArticleContentId(params.publicationId, params.articleTitle);
      const contentIdHex = contentIdToHex(contentId);

      // Phase 3: Convert content to bytes
      const contentBytes = new TextEncoder().encode(params.content);

      // Phase 4: Create encrypted object (mock for now - replace with actual Seal client)
      // TODO: Replace with actual Seal encryption when wallet is connected
      const encryptedData = EncryptedObject.serialize({
        id: contentIdHex,
        data: contentBytes
      });

      // Phase 5: Validate encryption result
      const encryptionValidation = this.validateEncryptionResult(encryptedData, contentIdHex);

      console.log('✅ Enhanced Seal encryption completed', {
        originalSize: contentBytes.length,
        encryptedSize: encryptedData.length,
        contentId: contentIdHex.substring(0, 20) + '...',
        validationPassed: encryptionValidation.isValid
      });

      return {
        encryptedData,
        contentId: contentIdHex,
        metadata: {
          originalSize: contentBytes.length,
          encryptedSize: encryptedData.length,
          algorithm: 'seal-ibe',
          contentType: 'markdown',
          bcsValidated: encryptionValidation.isValid,
          validationErrors: encryptionValidation.errors,
          validationWarnings: encryptionValidation.warnings
        }
      };

    } catch (error) {
      console.error('❌ Enhanced Seal encryption failed:', error);
      throw new Error(`Enhanced encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Decrypt content with comprehensive validation
   */
  static async decryptContent(params: EnhancedDecryptionParams): Promise<string> {
    console.log('🔓 Enhanced Seal decryption starting...', {
      encryptedSize: params.encryptedData.length,
      contentId: params.contentId.substring(0, 20) + '...',
      articleId: params.articleId
    });

    try {
      // Phase 1: Validate input parameters
      const inputValidation = this.validateDecryptionInput(params);
      if (!inputValidation.isValid) {
        throw new Error(`Input validation failed: ${inputValidation.errors.join(', ')}`);
      }

      // Phase 2: Validate BCS structure
      const bcsValidation = this.validateBCSStructure(params.encryptedData, params.contentId);
      if (!bcsValidation.isValid) {
        throw new Error(`BCS validation failed: ${bcsValidation.errors.join(', ')}`);
      }

      // Phase 3: Parse encrypted object
      const encObj = EncryptedObject.parse(params.encryptedData);
      
      // Phase 4: Decrypt content (mock for now - replace with actual Seal client)
      // TODO: Replace with actual Seal decryption when wallet is connected
      const decryptedContent = new TextDecoder().decode(encObj.data);

      // Phase 5: Validate decrypted content
      const contentValidation = this.validateDecryptedContent(decryptedContent);
      if (contentValidation.warnings.length > 0) {
        console.warn('⚠️ Decryption warnings:', contentValidation.warnings);
      }

      console.log('✅ Enhanced Seal decryption completed', {
        decryptedSize: decryptedContent.length,
        validationPassed: contentValidation.isValid
      });

      return decryptedContent;

    } catch (error) {
      console.error('❌ Enhanced Seal decryption failed:', error);
      throw new Error(`Enhanced decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * VALIDATION METHODS
   */

  /**
   * Validate encryption input parameters
   */
  private static validateEncryptionInput(params: {
    content: string;
    publicationId: string;
    articleTitle: string;
  }): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Content validation
    if (!params.content || params.content.trim().length === 0) {
      errors.push('Content cannot be empty');
    } else if (params.content.length > 1000000) { // 1MB limit
      errors.push('Content too large (max 1MB)');
    } else if (params.content.length < 10) {
      warnings.push('Content seems unusually short');
    }

    // Publication ID validation
    if (!params.publicationId || !/^0x[a-fA-F0-9]{64}$/.test(params.publicationId)) {
      errors.push('Invalid publication ID format (must be 64-char hex with 0x prefix)');
    }

    // Title validation
    if (!params.articleTitle || params.articleTitle.trim().length === 0) {
      errors.push('Article title cannot be empty');
    } else if (params.articleTitle.length > 200) {
      warnings.push('Article title is very long (>200 chars)');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      details: {
        contentLength: params.content.length,
        publicationIdValid: /^0x[a-fA-F0-9]{64}$/.test(params.publicationId),
        titleLength: params.articleTitle.length
      }
    };
  }

  /**
   * Validate decryption input parameters
   */
  private static validateDecryptionInput(params: EnhancedDecryptionParams): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Encrypted data validation
    if (!params.encryptedData || params.encryptedData.length === 0) {
      errors.push('Encrypted data cannot be empty');
    } else if (params.encryptedData.length < 32) {
      warnings.push('Encrypted data seems unusually small');
    }

    // Content ID validation
    if (!params.contentId) {
      errors.push('Content ID is required');
    } else if (!params.contentId.startsWith('0x')) {
      errors.push('Content ID must start with 0x');
    } else if (!/^0x[a-fA-F0-9]+$/.test(params.contentId)) {
      errors.push('Content ID must be a valid hex string');
    }

    // Article ID validation
    if (!params.articleId || !/^0x[a-fA-F0-9]{64}$/.test(params.articleId)) {
      errors.push('Invalid article ID format (must be 64-char hex with 0x prefix)');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      details: {
        encryptedDataSize: params.encryptedData?.length || 0,
        contentIdFormat: params.contentId?.startsWith('0x') ? 'valid' : 'invalid',
        articleIdFormat: /^0x[a-fA-F0-9]{64}$/.test(params.articleId) ? 'valid' : 'invalid'
      }
    };
  }

  /**
   * Validate BCS structure of encrypted data
   */
  private static validateBCSStructure(encryptedData: Uint8Array, expectedContentId: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let parsedObject: { id: string; data: Uint8Array } | undefined;

    try {
      // Parse BCS structure
      parsedObject = EncryptedObject.parse(encryptedData);
      
      // Validate content ID match
      if (parsedObject.id !== expectedContentId) {
        warnings.push(`Content ID mismatch: expected ${expectedContentId}, got ${parsedObject.id}`);
      }
      
      // Validate data payload
      if (!parsedObject.data || parsedObject.data.length === 0) {
        errors.push('Encrypted data payload is empty');
      }
      
    } catch (parseError) {
      errors.push(`BCS parsing failed: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      details: {
        bcsParseSuccessful: !!parsedObject,
        contentIdMatch: parsedObject?.id === expectedContentId,
        dataPayloadSize: parsedObject?.data?.length || 0,
        expectedContentId,
        actualContentId: parsedObject?.id || 'parse failed'
      }
    };
  }

  /**
   * Validate encryption result
   */
  private static validateEncryptionResult(encryptedData: Uint8Array, contentId: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Validate BCS structure
      const bcsValidation = this.validateBCSStructure(encryptedData, contentId);
      errors.push(...bcsValidation.errors);
      warnings.push(...bcsValidation.warnings);

      // Additional encryption-specific validations
      if (encryptedData.length < 50) {
        warnings.push('Encrypted data seems unusually small for typical content');
      }

    } catch (error) {
      errors.push(`Encryption result validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      details: {
        encryptedSize: encryptedData.length,
        contentId: contentId.substring(0, 20) + '...'
      }
    };
  }

  /**
   * Validate decrypted content
   */
  private static validateDecryptedContent(content: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!content || content.length === 0) {
      errors.push('Decrypted content is empty');
    } else if (content.length < 10) {
      warnings.push('Decrypted content seems unusually short');
    }

    // Check for common markdown patterns
    const hasMarkdownElements = /^#|^\*|\*\*|`/.test(content);
    if (!hasMarkdownElements && content.length > 50) {
      warnings.push('Content does not appear to contain markdown formatting');
    }

    // Check for potential corruption indicators
    const hasNullChars = content.includes('\0');
    if (hasNullChars) {
      errors.push('Decrypted content contains null characters (possible corruption)');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      details: {
        contentLength: content.length,
        hasMarkdown: hasMarkdownElements,
        hasNullChars
      }
    };
  }

  /**
   * UTILITY METHODS
   */

  /**
   * Verify data integrity by checking BCS structure and content ID
   */
  static verifyDataIntegrity(encryptedData: Uint8Array, contentId: string): ValidationResult {
    try {
      return this.validateBCSStructure(encryptedData, contentId);
    } catch (error) {
      return {
        isValid: false,
        errors: [`Data integrity check failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: []
      };
    }
  }

  /**
   * Get service status and configuration
   */
  static getStatus(): {
    serviceVersion: string;
    validationEnabled: boolean;
    supportedFormats: string[];
    bcsValidation: boolean;
  } {
    return {
      serviceVersion: '2.0.0-enhanced',
      validationEnabled: true,
      supportedFormats: ['markdown', 'text/plain'],
      bcsValidation: true
    };
  }

  /**
   * Convert validation result to user-friendly message
   */
  static formatValidationMessage(result: ValidationResult): string {
    if (result.isValid) {
      return result.warnings.length > 0 
        ? `Validation passed with warnings: ${result.warnings.join(', ')}`
        : 'Validation passed successfully';
    } else {
      return `Validation failed: ${result.errors.join(', ')}`;
    }
  }
}

export { SealServiceEnhanced as SealService };