import { toBase64, fromBase64 } from '@mysten/bcs';
import { EncryptedObject } from '@mysten/seal';
import { SealService } from './SealService';
import { articlesAPI } from '../api';

/**
 * Unified Data Pipeline Service
 * 
 * Centralizes all data transformations for the encryption-decryption pipeline
 * ensuring proper BCS/Mysten utility usage and comprehensive validation.
 * 
 * Data Flow:
 * Frontend: Markdown → BCS Content ID → Seal Encryption → Base64 → Backend
 * Backend: Base64 → Buffer → Uint8Array → Walrus Storage
 * Retrieval: Walrus → Uint8Array → Base64 → Frontend → BCS Validation → Decryption → Markdown
 */

export interface EncryptionResult {
  encryptedContentBase64: string;
  contentId: string;
  metadata: {
    originalContentLength: number;
    encryptedContentLength: number;
    algorithm: string;
    contentType: string;
    validationPassed: boolean;
  };
}

export interface DecryptionParams {
  encryptedData: Uint8Array;
  contentId: string;
  articleId: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Main class for handling all data pipeline operations
 */
export class DataPipelineService {
  private static instance: DataPipelineService;
  
  private constructor() {}
  
  public static getInstance(): DataPipelineService {
    if (!DataPipelineService.instance) {
      DataPipelineService.instance = new DataPipelineService();
    }
    return DataPipelineService.instance;
  }

  /**
   * ENCRYPTION PIPELINE
   * Handles: Markdown → BCS Content ID → Seal Encryption → Base64
   */
  
  /**
   * Encrypt content for storage with comprehensive validation
   * 
   * @param params - Content and metadata for encryption
   * @returns Encrypted content ready for backend storage
   */
  async encryptForStorage(params: {
    content: string;
    publicationId: string;
    articleTitle: string;
  }): Promise<EncryptionResult> {
    console.log('🔐 Starting encryption pipeline...', {
      contentLength: params.content.length,
      publicationId: params.publicationId.substring(0, 20) + '...',
      title: params.articleTitle
    });

    try {
      // Phase 1: Input validation
      this.validateEncryptionInput(params);

      // Phase 2: Encrypt content using SealService
      const encryptionResult = await SealService.encryptContent({
        content: params.content,
        publicationId: params.publicationId,
        articleTitle: params.articleTitle
      });

      // Phase 3: Convert to Base64 using Mysten utilities
      const encryptedContentBase64 = toBase64(encryptionResult.encryptedData);
      
      console.log('📝 Encryption validation results:', {
        originalSize: params.content.length,
        encryptedSize: encryptionResult.encryptedData.length,
        base64Size: encryptedContentBase64.length,
        contentId: encryptionResult.contentId.substring(0, 20) + '...'
      });

      // Phase 4: Validate encryption result
      const validationResult = this.validateEncryptionResult(encryptionResult, encryptedContentBase64);
      if (!validationResult.isValid) {
        throw new Error(`Encryption validation failed: ${validationResult.errors.join(', ')}`);
      }

      // Phase 5: Return structured result
      const result: EncryptionResult = {
        encryptedContentBase64,
        contentId: encryptionResult.contentId,
        metadata: {
          originalContentLength: params.content.length,
          encryptedContentLength: encryptionResult.encryptedData.length,
          algorithm: 'seal-ibe',
          contentType: 'markdown',
          validationPassed: true
        }
      };

      console.log('✅ Encryption pipeline completed successfully');
      return result;

    } catch (error) {
      console.error('❌ Encryption pipeline failed:', error);
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * DECRYPTION PIPELINE
   * Handles: Base64 → BCS Validation → Seal Decryption → Markdown
   */
  
  /**
   * Decrypt content from storage with comprehensive validation
   * 
   * @param params - Encrypted data and metadata for decryption
   * @returns Decrypted markdown content
   */
  async decryptFromStorage(params: DecryptionParams): Promise<string> {
    console.log('🔓 Starting decryption pipeline...', {
      encryptedDataSize: params.encryptedData.length,
      contentId: params.contentId.substring(0, 20) + '...',
      articleId: params.articleId
    });

    try {
      // Phase 1: BCS validation of encrypted data
      const bcsValidation = this.validateBCSEncryptedData(params.encryptedData, params.contentId);
      if (!bcsValidation.isValid) {
        throw new Error(`BCS validation failed: ${bcsValidation.errors.join(', ')}`);
      }

      // Phase 2: Decrypt using SealService
      const decryptedContent = await SealService.decryptContent({
        encryptedData: params.encryptedData,
        contentId: params.contentId,
        articleId: params.articleId
      });

      // Phase 3: Validate decrypted content
      const contentValidation = this.validateDecryptedContent(decryptedContent);
      if (!contentValidation.isValid) {
        console.warn('⚠️ Decrypted content validation warnings:', contentValidation.warnings);
      }

      console.log('✅ Decryption pipeline completed successfully', {
        decryptedSize: decryptedContent.length
      });

      return decryptedContent;

    } catch (error) {
      console.error('❌ Decryption pipeline failed:', error);
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * BACKEND INTEGRATION
   * Handles API calls with proper data handling
   */
  
  /**
   * Download encrypted data from backend with proper validation
   * 
   * @param quiltBlobId - Walrus blob ID containing encrypted content
   * @returns Validated encrypted data ready for decryption
   */
  async downloadEncryptedContent(quiltBlobId: string): Promise<Uint8Array> {
    console.log('📥 Downloading encrypted content...', { quiltBlobId });

    try {
      // Download from backend
      const response = await articlesAPI.getRawContent(quiltBlobId);

      // Handle different response formats
      let encryptedData: Uint8Array;
      if (response.data instanceof ArrayBuffer) {
        encryptedData = new Uint8Array(response.data);
      } else if (response.data instanceof Uint8Array) {
        encryptedData = response.data;
      } else if (typeof response.data === 'string') {
        // Use Mysten's fromBase64 for proper BCS byte conversion
        encryptedData = fromBase64(response.data);
      } else {
        throw new Error(`Unexpected encrypted data format: ${typeof response.data}`);
      }

      console.log('📥 Download completed', {
        dataSize: encryptedData.length,
        dataType: typeof response.data
      });

      return encryptedData;

    } catch (error) {
      console.error('❌ Download failed:', error);
      throw new Error(`Failed to download encrypted content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * VALIDATION METHODS
   * Comprehensive validation for all pipeline stages
   */

  /**
   * Validate encryption input parameters
   */
  private validateEncryptionInput(params: {
    content: string;
    publicationId: string;
    articleTitle: string;
  }): void {
    if (!params.content || params.content.trim().length === 0) {
      throw new Error('Content cannot be empty');
    }

    if (!params.publicationId || !/^0x[a-fA-F0-9]{64}$/.test(params.publicationId)) {
      throw new Error('Invalid publication ID format');
    }

    if (!params.articleTitle || params.articleTitle.trim().length === 0) {
      throw new Error('Article title cannot be empty');
    }

    if (params.content.length > 1000000) { // 1MB limit
      throw new Error('Content too large for encryption');
    }
  }

  /**
   * Validate encryption result
   */
  private validateEncryptionResult(
    encryptionResult: { encryptedData: Uint8Array; contentId: string },
    base64Data: string
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check encrypted data
    if (!encryptionResult.encryptedData || encryptionResult.encryptedData.length === 0) {
      errors.push('Encrypted data is empty');
    }

    // Check content ID format
    if (!encryptionResult.contentId || !/^0x[a-fA-F0-9]+$/.test(encryptionResult.contentId)) {
      errors.push('Invalid content ID format');
    }

    // Check Base64 encoding
    if (!base64Data || base64Data.length === 0) {
      errors.push('Base64 encoding failed');
    }

    // Validate BCS structure
    try {
      EncryptedObject.parse(encryptionResult.encryptedData);
    } catch (parseError) {
      errors.push('BCS structure validation failed');
    }

    // Size checks
    if (encryptionResult.encryptedData.length < 32) {
      warnings.push('Encrypted data seems unusually small');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate BCS-encoded encrypted data
   */
  private validateBCSEncryptedData(encryptedData: Uint8Array, expectedContentId: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Parse BCS structure
      const encObj = EncryptedObject.parse(encryptedData);
      
      console.log('📝 BCS validation details:', {
        contentIdFromObject: encObj.id,
        expectedContentId: expectedContentId,
        idsMatch: encObj.id === expectedContentId,
        dataSize: encryptedData.length
      });

      // Verify content ID match
      if (encObj.id !== expectedContentId) {
        warnings.push(`Content ID mismatch: expected ${expectedContentId}, got ${encObj.id}`);
      }

    } catch (parseError) {
      errors.push(`BCS parsing failed: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
    }

    // Basic data checks
    if (encryptedData.length === 0) {
      errors.push('Encrypted data is empty');
    }

    if (encryptedData.length < 32) {
      warnings.push('Encrypted data seems unusually small');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate decrypted content
   */
  private validateDecryptedContent(content: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!content || content.length === 0) {
      errors.push('Decrypted content is empty');
    }

    if (content.length < 10) {
      warnings.push('Decrypted content seems unusually short');
    }

    // Check for common markdown patterns
    const hasMarkdownElements = /^#|^\*|\*\*|`/.test(content);
    if (!hasMarkdownElements) {
      warnings.push('Content does not appear to contain markdown formatting');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * UTILITY METHODS
   * Helper functions for data integrity
   */

  /**
   * Verify data integrity by checking BCS structure
   */
  async verifyDataIntegrity(encryptedData: Uint8Array, contentId: string): Promise<boolean> {
    try {
      const validation = this.validateBCSEncryptedData(encryptedData, contentId);
      return validation.isValid;
    } catch {
      return false;
    }
  }

  /**
   * Get data pipeline status for debugging
   */
  getStatus(): {
    pipelineVersion: string;
    supportedFormats: string[];
    validationEnabled: boolean;
  } {
    return {
      pipelineVersion: '1.0.0',
      supportedFormats: ['markdown', 'base64', 'uint8array'],
      validationEnabled: true
    };
  }
}

// Export singleton instance
export const dataPipelineService = DataPipelineService.getInstance();