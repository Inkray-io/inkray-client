/**
 * Frontend validation utilities that match backend validation rules
 * Ensures consistent validation between client and server
 */

// Shared validation constants - should match backend config
export const VALIDATION_CONFIG = {
  ARTICLE: {
    TITLE: {
      MIN_LENGTH: 3,
      MAX_LENGTH: 200,
    },
    CONTENT: {
      MIN_LENGTH: 10,
      MAX_LENGTH: 1000000, // 1MB in characters
      MAX_LINES: 10000,
    },
  },
  FILES: {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB per file
    MAX_TOTAL_SIZE: 50 * 1024 * 1024, // 50MB total
    MAX_FILE_COUNT: 10,
    ALLOWED_MIME_TYPES: [
      // Images
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      // Videos
      'video/mp4',
      'video/webm',
      'video/ogg',
      // Documents
      'application/pdf',
      'text/plain',
    ],
    ALLOWED_EXTENSIONS: [
      '.jpg',
      '.jpeg',
      '.png',
      '.gif',
      '.webp',
      '.mp4',
      '.webm',
      '.ogg',
      '.pdf',
      '.txt',
    ],
  },
  SUI: {
    OBJECT_ID_PATTERN: /^0x[a-fA-F0-9]{64}$/,
    ADDRESS_PATTERN: /^0x[a-fA-F0-9]{64}$/,
  },
} as const;

export const VALIDATION_MESSAGES = {
  ARTICLE: {
    TITLE_REQUIRED: 'Article title is required',
    TITLE_TOO_SHORT: `Article title must be at least ${VALIDATION_CONFIG.ARTICLE.TITLE.MIN_LENGTH} characters long`,
    TITLE_TOO_LONG: `Article title must be less than ${VALIDATION_CONFIG.ARTICLE.TITLE.MAX_LENGTH} characters`,
    CONTENT_REQUIRED: 'Article content is required',
    CONTENT_TOO_SHORT: `Article content must be at least ${VALIDATION_CONFIG.ARTICLE.CONTENT.MIN_LENGTH} characters long`,
    CONTENT_TOO_LONG: `Article content must be less than ${VALIDATION_CONFIG.ARTICLE.CONTENT.MAX_LENGTH} characters`,
    CONTENT_TOO_MANY_LINES: `Article content must have less than ${VALIDATION_CONFIG.ARTICLE.CONTENT.MAX_LINES} lines`,
  },
  FILES: {
    FILE_TOO_LARGE: `File size must be less than ${VALIDATION_CONFIG.FILES.MAX_FILE_SIZE / (1024 * 1024)}MB`,
    TOTAL_SIZE_TOO_LARGE: `Total upload size must be less than ${VALIDATION_CONFIG.FILES.MAX_TOTAL_SIZE / (1024 * 1024)}MB`,
    TOO_MANY_FILES: `Maximum ${VALIDATION_CONFIG.FILES.MAX_FILE_COUNT} files allowed`,
    INVALID_FILE_TYPE: 'File type not allowed',
    INVALID_FILE_EXTENSION: 'File extension not allowed',
  },
  SUI: {
    INVALID_PUBLICATION_ID: 'Invalid publication ID format',
    INVALID_AUTHOR_ADDRESS: 'Invalid author address format',
  },
} as const;

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates article title according to backend rules
 */
export function validateArticleTitle(title: string): ValidationResult {
  const errors: string[] = [];

  if (!title || title.trim().length === 0) {
    errors.push(VALIDATION_MESSAGES.ARTICLE.TITLE_REQUIRED);
  } else {
    const trimmedTitle = title.trim();
    if (trimmedTitle.length < VALIDATION_CONFIG.ARTICLE.TITLE.MIN_LENGTH) {
      errors.push(VALIDATION_MESSAGES.ARTICLE.TITLE_TOO_SHORT);
    }
    if (trimmedTitle.length > VALIDATION_CONFIG.ARTICLE.TITLE.MAX_LENGTH) {
      errors.push(VALIDATION_MESSAGES.ARTICLE.TITLE_TOO_LONG);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates article content according to backend rules
 */
export function validateArticleContent(content: string): ValidationResult {
  const errors: string[] = [];

  if (!content || content.trim().length === 0) {
    errors.push(VALIDATION_MESSAGES.ARTICLE.CONTENT_REQUIRED);
  } else {
    const trimmedContent = content.trim();
    
    if (trimmedContent.length < VALIDATION_CONFIG.ARTICLE.CONTENT.MIN_LENGTH) {
      errors.push(VALIDATION_MESSAGES.ARTICLE.CONTENT_TOO_SHORT);
    }
    
    if (trimmedContent.length > VALIDATION_CONFIG.ARTICLE.CONTENT.MAX_LENGTH) {
      errors.push(VALIDATION_MESSAGES.ARTICLE.CONTENT_TOO_LONG);
    }

    const lineCount = trimmedContent.split('\n').length;
    if (lineCount > VALIDATION_CONFIG.ARTICLE.CONTENT.MAX_LINES) {
      errors.push(VALIDATION_MESSAGES.ARTICLE.CONTENT_TOO_MANY_LINES);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates a single file according to backend rules
 */
export function validateFile(file: File): ValidationResult {
  const errors: string[] = [];

  // Check file size
  if (file.size > VALIDATION_CONFIG.FILES.MAX_FILE_SIZE) {
    errors.push(VALIDATION_MESSAGES.FILES.FILE_TOO_LARGE);
  }

  // Check MIME type
  const allowedTypes = VALIDATION_CONFIG.FILES.ALLOWED_MIME_TYPES as readonly string[];
  if (!allowedTypes.includes(file.type)) {
    errors.push(VALIDATION_MESSAGES.FILES.INVALID_FILE_TYPE);
  }

  // Check file extension
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  const allowedExtensions = VALIDATION_CONFIG.FILES.ALLOWED_EXTENSIONS as readonly string[];
  if (!allowedExtensions.includes(extension)) {
    errors.push(VALIDATION_MESSAGES.FILES.INVALID_FILE_EXTENSION);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates multiple files and total upload size
 */
export function validateFiles(files: File[]): ValidationResult {
  const errors: string[] = [];

  // Check file count
  if (files.length > VALIDATION_CONFIG.FILES.MAX_FILE_COUNT) {
    errors.push(VALIDATION_MESSAGES.FILES.TOO_MANY_FILES);
  }

  // Check total size
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  if (totalSize > VALIDATION_CONFIG.FILES.MAX_TOTAL_SIZE) {
    errors.push(VALIDATION_MESSAGES.FILES.TOTAL_SIZE_TOO_LARGE);
  }

  // Validate each file
  files.forEach((file, index) => {
    const fileValidation = validateFile(file);
    if (!fileValidation.isValid) {
      fileValidation.errors.forEach(error => {
        errors.push(`File ${index + 1}: ${error}`);
      });
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates Sui object ID format
 */
export function validateSuiObjectId(objectId: string): ValidationResult {
  const errors: string[] = [];

  if (!VALIDATION_CONFIG.SUI.OBJECT_ID_PATTERN.test(objectId)) {
    errors.push(VALIDATION_MESSAGES.SUI.INVALID_PUBLICATION_ID);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates Sui address format
 */
export function validateSuiAddress(address: string): ValidationResult {
  const errors: string[] = [];

  if (!VALIDATION_CONFIG.SUI.ADDRESS_PATTERN.test(address)) {
    errors.push(VALIDATION_MESSAGES.SUI.INVALID_AUTHOR_ADDRESS);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates complete article creation data
 */
export function validateArticleCreation(data: {
  title: string;
  content: string;
  publicationId: string;
  authorAddress: string;
  mediaFiles?: File[];
}): ValidationResult {
  const errors: string[] = [];

  // Validate title
  const titleValidation = validateArticleTitle(data.title);
  errors.push(...titleValidation.errors);

  // Validate content
  const contentValidation = validateArticleContent(data.content);
  errors.push(...contentValidation.errors);

  // Validate publication ID
  const publicationValidation = validateSuiObjectId(data.publicationId);
  errors.push(...publicationValidation.errors);

  // Validate author address
  const authorValidation = validateSuiAddress(data.authorAddress);
  errors.push(...authorValidation.errors);

  // Validate media files if provided
  if (data.mediaFiles && data.mediaFiles.length > 0) {
    const filesValidation = validateFiles(data.mediaFiles);
    errors.push(...filesValidation.errors);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}