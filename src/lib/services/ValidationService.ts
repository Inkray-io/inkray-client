import { fromBase64, toBase64 } from '@mysten/bcs';
import { EncryptedObject } from '@mysten/seal';

/**
 * Centralized Validation Service for Data Transformations
 * 
 * This service provides comprehensive validation for all data transformations
 * throughout the encryption-decryption pipeline, ensuring data integrity
 * and proper BCS/Mysten utility usage.
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  details?: Record<string, unknown>;
}

export interface DataIntegrityCheck {
  stage: string;
  timestamp: string;
  isValid: boolean;
  checksPerformed: string[];
  issues: string[];
}

/**
 * Main validation service class
 */
export class ValidationService {
  private static instance: ValidationService;
  private validationHistory: DataIntegrityCheck[] = [];

  private constructor() {}

  public static getInstance(): ValidationService {
    if (!ValidationService.instance) {
      ValidationService.instance = new ValidationService();
    }
    return ValidationService.instance;
  }

  /**
   * CONTENT VALIDATION
   */

  /**
   * Validate markdown content for encryption
   */
  validateMarkdownContent(content: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic content checks
    if (!content || content.trim().length === 0) {
      errors.push('Content cannot be empty');
    } else if (content.length > 1000000) { // 1MB limit
      errors.push('Content too large (max 1MB)');
    } else if (content.length < 10) {
      warnings.push('Content seems unusually short');
    }

    // Markdown format checks
    const hasMarkdownElements = /^#|^\*|\*\*|`|^-|\[.*\]\(.*\)/.test(content);
    if (!hasMarkdownElements && content.length > 100) {
      warnings.push('Content does not appear to contain markdown formatting');
    }

    // Character encoding checks
    const hasInvalidChars = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(content);
    if (hasInvalidChars) {
      warnings.push('Content contains potentially problematic control characters');
    }

    // UTF-8 validation
    try {
      const encoder = new TextEncoder();
      const decoder = new TextDecoder('utf-8', { fatal: true });
      const encoded = encoder.encode(content);
      decoder.decode(encoded);
    } catch (encodingError) {
      errors.push('Content contains invalid UTF-8 characters');
    }

    this.recordValidation('markdown-content', {
      contentLength: content.length,
      hasMarkdown: hasMarkdownElements,
      hasInvalidChars
    }, errors.length === 0);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      details: {
        contentLength: content.length,
        hasMarkdownElements,
        hasInvalidChars,
        encodingValid: errors.length === 0
      }
    };
  }

  /**
   * Validate Sui address format
   */
  validateSuiAddress(address: string, fieldName: string = 'address'): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!address) {
      errors.push(`${fieldName} is required`);
    } else if (!address.startsWith('0x')) {
      errors.push(`${fieldName} must start with 0x`);
    } else if (!/^0x[a-fA-F0-9]{64}$/.test(address)) {
      errors.push(`${fieldName} must be a valid Sui address (64 hex characters after 0x)`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      details: {
        address: address?.substring(0, 20) + '...' || 'null',
        length: address?.length || 0,
        format: address?.startsWith('0x') ? 'hex' : 'invalid'
      }
    };
  }

  /**
   * BCS DATA VALIDATION
   */

  /**
   * Validate BCS-encoded encrypted object
   */
  validateBCSEncryptedObject(encryptedData: Uint8Array, expectedContentId?: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let parsedObject: { id: string; data: Uint8Array } | undefined;

    try {
      // Basic data checks
      if (!encryptedData || encryptedData.length === 0) {
        errors.push('Encrypted data cannot be empty');
        return { isValid: false, errors, warnings };
      }

      if (encryptedData.length < 32) {
        warnings.push('Encrypted data seems unusually small');
      }

      // Parse BCS structure
      parsedObject = EncryptedObject.parse(encryptedData);
      
      // Validate parsed object
      if (!parsedObject.id) {
        errors.push('Parsed object missing content ID');
      } else if (!parsedObject.id.startsWith('0x')) {
        errors.push('Content ID in parsed object must start with 0x');
      }

      if (!parsedObject.data || parsedObject.data.length === 0) {
        errors.push('Parsed object has empty data payload');
      }

      // Content ID matching
      if (expectedContentId && parsedObject.id !== expectedContentId) {
        warnings.push(`Content ID mismatch: expected ${expectedContentId}, got ${parsedObject.id}`);
      }

      this.recordValidation('bcs-encrypted-object', {
        dataSize: encryptedData.length,
        parseSuccessful: true,
        contentIdMatch: !expectedContentId || parsedObject.id === expectedContentId
      }, errors.length === 0);

    } catch (parseError) {
      const errorMessage = `BCS parsing failed: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`;
      errors.push(errorMessage);
      
      this.recordValidation('bcs-encrypted-object', {
        dataSize: encryptedData.length,
        parseSuccessful: false,
        parseError: errorMessage
      }, false);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      details: {
        dataSize: encryptedData.length,
        parseSuccessful: !!parsedObject,
        contentId: parsedObject?.id || 'parse failed',
        expectedContentId: expectedContentId || 'not provided',
        dataPayloadSize: parsedObject?.data?.length || 0
      }
    };
  }

  /**
   * Validate content ID format and structure
   */
  validateContentId(contentId: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!contentId) {
      errors.push('Content ID is required');
    } else if (!contentId.startsWith('0x')) {
      errors.push('Content ID must start with 0x');
    } else if (!/^0x[a-fA-F0-9]+$/.test(contentId)) {
      errors.push('Content ID must be a valid hex string');
    } else {
      // Check expected BCS length for IdV1 struct
      // tag(1) + version(2) + address(32) + nonce(8) = 43 bytes = 86 hex chars + 0x = 88 total
      const expectedLength = 88; // 0x + 86 hex chars
      if (contentId.length !== expectedLength) {
        warnings.push(`Content ID length unexpected: got ${contentId.length}, expected ${expectedLength}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      details: {
        contentId: contentId?.substring(0, 20) + '...' || 'null',
        length: contentId?.length || 0,
        format: contentId?.startsWith('0x') ? 'hex' : 'invalid'
      }
    };
  }

  /**
   * BASE64 DATA VALIDATION
   */

  /**
   * Validate Base64 string and its conversion to binary
   */
  validateBase64Data(base64String: string, expectedBinarySize?: number): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let binaryData: Uint8Array | undefined;

    try {
      if (!base64String || base64String.trim().length === 0) {
        errors.push('Base64 string cannot be empty');
        return { isValid: false, errors, warnings };
      }

      // Validate Base64 format
      const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;
      if (!base64Pattern.test(base64String)) {
        errors.push('Invalid Base64 format');
        return { isValid: false, errors, warnings };
      }

      // Test conversion using Mysten utilities
      binaryData = fromBase64(base64String);

      // Validate binary data
      if (binaryData.length === 0) {
        errors.push('Base64 decoding resulted in empty data');
      }

      // Check expected size
      if (expectedBinarySize && binaryData.length !== expectedBinarySize) {
        warnings.push(`Binary size mismatch: expected ${expectedBinarySize}, got ${binaryData.length}`);
      }

      // Test round-trip conversion
      const reconverted = toBase64(binaryData);
      if (reconverted !== base64String) {
        errors.push('Base64 round-trip conversion failed');
      }

      this.recordValidation('base64-data', {
        base64Length: base64String.length,
        binaryLength: binaryData.length,
        roundTripSuccessful: reconverted === base64String
      }, errors.length === 0);

    } catch (conversionError) {
      const errorMessage = `Base64 conversion failed: ${conversionError instanceof Error ? conversionError.message : 'Unknown error'}`;
      errors.push(errorMessage);
      
      this.recordValidation('base64-data', {
        base64Length: base64String.length,
        conversionSuccessful: false,
        conversionError: errorMessage
      }, false);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      details: {
        base64Length: base64String.length,
        binaryLength: binaryData?.length || 0,
        expectedBinarySize: expectedBinarySize || 'not specified',
        conversionSuccessful: !!binaryData
      }
    };
  }

  /**
   * PIPELINE VALIDATION
   */

  /**
   * Validate entire encryption pipeline input
   */
  validateEncryptionPipeline(params: {
    content: string;
    publicationId: string;
    articleTitle: string;
  }): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const details: Record<string, unknown> = {};

    // Validate content
    const contentResult = this.validateMarkdownContent(params.content);
    errors.push(...contentResult.errors);
    warnings.push(...contentResult.warnings);
    details.content = contentResult.details;

    // Validate publication ID
    const publicationResult = this.validateSuiAddress(params.publicationId, 'Publication ID');
    errors.push(...publicationResult.errors);
    warnings.push(...publicationResult.warnings);
    details.publicationId = publicationResult.details;

    // Validate title
    if (!params.articleTitle || params.articleTitle.trim().length === 0) {
      errors.push('Article title cannot be empty');
    } else if (params.articleTitle.length > 200) {
      warnings.push('Article title is very long (>200 characters)');
    }
    details.title = {
      length: params.articleTitle?.length || 0,
      isEmpty: !params.articleTitle || params.articleTitle.trim().length === 0
    };

    this.recordValidation('encryption-pipeline', details, errors.length === 0);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      details
    };
  }

  /**
   * Validate entire decryption pipeline input
   */
  validateDecryptionPipeline(params: {
    encryptedData: Uint8Array;
    contentId: string;
    articleId: string;
  }): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const details: Record<string, unknown> = {};

    // Validate encrypted data
    const encryptedDataResult = this.validateBCSEncryptedObject(params.encryptedData, params.contentId);
    errors.push(...encryptedDataResult.errors);
    warnings.push(...encryptedDataResult.warnings);
    details.encryptedData = encryptedDataResult.details;

    // Validate content ID
    const contentIdResult = this.validateContentId(params.contentId);
    errors.push(...contentIdResult.errors);
    warnings.push(...contentIdResult.warnings);
    details.contentId = contentIdResult.details;

    // Validate article ID
    const articleIdResult = this.validateSuiAddress(params.articleId, 'Article ID');
    errors.push(...articleIdResult.errors);
    warnings.push(...articleIdResult.warnings);
    details.articleId = articleIdResult.details;

    this.recordValidation('decryption-pipeline', details, errors.length === 0);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      details
    };
  }

  /**
   * UTILITY METHODS
   */

  /**
   * Record validation for history tracking
   */
  private recordValidation(stage: string, details: Record<string, unknown>, isValid: boolean): void {
    const check: DataIntegrityCheck = {
      stage,
      timestamp: new Date().toISOString(),
      isValid,
      checksPerformed: Object.keys(details),
      issues: isValid ? [] : ['Validation failed - see details']
    };

    this.validationHistory.push(check);
    
    // Keep only last 100 validations to prevent memory issues
    if (this.validationHistory.length > 100) {
      this.validationHistory = this.validationHistory.slice(-100);
    }
  }

  /**
   * Get validation history for debugging
   */
  getValidationHistory(): DataIntegrityCheck[] {
    return [...this.validationHistory];
  }

  /**
   * Clear validation history
   */
  clearValidationHistory(): void {
    this.validationHistory = [];
  }

  /**
   * Get validation statistics
   */
  getValidationStats(): {
    totalValidations: number;
    successfulValidations: number;
    failedValidations: number;
    successRate: number;
    stageBreakdown: Record<string, { total: number; successful: number }>;
  } {
    const total = this.validationHistory.length;
    const successful = this.validationHistory.filter(v => v.isValid).length;
    const failed = total - successful;

    const stageBreakdown = this.validationHistory.reduce((acc, validation) => {
      if (!acc[validation.stage]) {
        acc[validation.stage] = { total: 0, successful: 0 };
      }
      acc[validation.stage].total++;
      if (validation.isValid) {
        acc[validation.stage].successful++;
      }
      return acc;
    }, {} as Record<string, { total: number; successful: number }>);

    return {
      totalValidations: total,
      successfulValidations: successful,
      failedValidations: failed,
      successRate: total > 0 ? (successful / total) * 100 : 0,
      stageBreakdown
    };
  }

  /**
   * Format validation result as user-friendly message
   */
  formatValidationMessage(result: ValidationResult): string {
    if (result.isValid) {
      return result.warnings.length > 0 
        ? `✅ Validation passed with warnings: ${result.warnings.join(', ')}`
        : '✅ Validation passed successfully';
    } else {
      return `❌ Validation failed: ${result.errors.join(', ')}`;
    }
  }
}

// Export singleton instance
export const validationService = ValidationService.getInstance();