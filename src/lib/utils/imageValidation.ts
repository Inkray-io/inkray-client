import { ImageValidation } from '@/types/article'

// Image validation configuration
const IMAGE_CONFIG = {
  // Supported MIME types
  allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  
  // File size limits (in bytes)
  maxSize: 10 * 1024 * 1024, // 10MB
  minSize: 1024, // 1KB
  
  // Other limits
  maxFiles: 10, // Maximum images per article
  
  // Filename validation (only check extension)
  maxFilenameLength: 255,
} as const

/**
 * Validate a single image file
 * @param file - The file to validate
 * @returns Validation result with errors if any
 */
export function validateImageFile(file: File): ImageValidation {
  const errors: string[] = []
  
  // MIME type validation
  if (!IMAGE_CONFIG.allowedTypes.includes(file.type as typeof IMAGE_CONFIG.allowedTypes[number])) {
    errors.push(
      `Unsupported file type: ${file.type}. Allowed types: ${IMAGE_CONFIG.allowedTypes.join(', ')}`
    )
  }
  
  // File size validation
  if (file.size > IMAGE_CONFIG.maxSize) {
    const maxSizeMB = Math.round(IMAGE_CONFIG.maxSize / (1024 * 1024))
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2)
    errors.push(`File too large: ${fileSizeMB}MB (max ${maxSizeMB}MB)`)
  }
  
  if (file.size < IMAGE_CONFIG.minSize) {
    errors.push(`File too small: ${file.size} bytes (min ${IMAGE_CONFIG.minSize} bytes)`)
  }
  
  // Basic filename validation (only length and extension)
  if (file.name.length > IMAGE_CONFIG.maxFilenameLength) {
    errors.push(`Filename too long: ${file.name.length} characters (max ${IMAGE_CONFIG.maxFilenameLength})`)
  }
  
  // Check for empty filename
  if (!file.name.trim()) {
    errors.push('Filename cannot be empty')
  }
  
  // Validate file extension (ensure it's an image)
  if (!hasImageExtension(file.name)) {
    errors.push('File must have a valid image extension (.jpg, .jpeg, .png, .gif, .webp)')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Validate multiple image files
 * @param files - Array of files to validate
 * @returns Validation result with aggregated errors
 */
export function validateImageFiles(files: File[]): ImageValidation {
  const errors: string[] = []
  
  // Check file count limit
  if (files.length > IMAGE_CONFIG.maxFiles) {
    errors.push(`Too many images: ${files.length} (max ${IMAGE_CONFIG.maxFiles})`)
  }
  
  // Check for duplicate filenames
  const filenames = files.map(f => f.name.toLowerCase())
  const duplicates = filenames.filter((name, index) => filenames.indexOf(name) !== index)
  if (duplicates.length > 0) {
    errors.push(`Duplicate filenames found: ${[...new Set(duplicates)].join(', ')}`)
  }
  
  // Validate each file individually
  files.forEach((file, index) => {
    const fileValidation = validateImageFile(file)
    if (!fileValidation.isValid) {
      fileValidation.errors.forEach(error => {
        errors.push(`File ${index + 1} (${file.name}): ${error}`)
      })
    }
  })
  
  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Get human-readable file size
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

/**
 * Check if a file is an image by extension
 * @param filename - The filename to check
 * @returns True if the filename has an image extension
 */
export function hasImageExtension(filename: string): boolean {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'))
  return imageExtensions.includes(extension)
}

/**
 * Extract all image URLs from markdown content
 * @param markdown - The markdown content to parse
 * @returns Array of image URLs found in the markdown
 */
export function extractImageUrls(markdown: string): string[] {
  const imageRegex = /!\[.*?\]\(([^)]+)\)/g
  const urls: string[] = []
  let match
  
  while ((match = imageRegex.exec(markdown)) !== null) {
    urls.push(match[1])
  }
  
  return urls
}

/**
 * Get image validation configuration
 * @returns The current image validation configuration
 */
export function getImageConfig() {
  return IMAGE_CONFIG
}