import { TemporaryImage } from '@/types/article'

/**
 * Service for managing temporary images before article upload
 * Provides deterministic URLs and handles image metadata
 */
export class TemporaryImageManager {
  private images: Map<string, TemporaryImage> = new Map()
  private indexCounter = 0
  
  /**
   * Add an image and return a deterministic final URL that stays in markdown
   * @param file - The image file to add
   * @returns Full API URL that will work after publication
   */
  addImage(file: File): string {
    const id = crypto.randomUUID()
    const index = this.indexCounter++
    
    // Generate the final URL that will be used in the published article
    // This URL will remain unchanged in the markdown
    const finalUrl = `${process.env.NEXT_PUBLIC_API_URL}/articles/media/media${index}`
    
    const tempImage: TemporaryImage = {
      id,
      file,
      filename: file.name,
      mimeType: file.type,
      size: file.size,
      index,
      finalUrl,
    }
    
    this.images.set(finalUrl, tempImage) // Key by final URL
    return finalUrl // Return the final URL that stays in markdown
  }

  /**
   * Get image by final URL for validation or processing
   * @param url - The final URL to look up
   * @returns Temporary image data or undefined if not found
   */
  getImageByUrl(url: string): TemporaryImage | undefined {
    return this.images.get(url)
  }

  /**
   * Get all temporary images sorted by index for upload
   * @returns Array of temporary images in order
   */
  getAllImages(): TemporaryImage[] {
    return Array.from(this.images.values()).sort((a, b) => a.index - b.index)
  }

  /**
   * Get count of temporary images
   * @returns Number of images stored
   */
  getImageCount(): number {
    return this.images.size
  }

  /**
   * Clear all temporary images
   */
  clear(): void {
    this.images.clear()
    this.indexCounter = 0
  }

  /**
   * Remove a specific image by URL
   * @param url - The final URL to remove
   * @returns True if image was removed, false if not found
   */
  removeImage(url: string): boolean {
    return this.images.delete(url)
  }

  /**
   * Get total size of all temporary images
   * @returns Total size in bytes
   */
  getTotalSize(): number {
    return Array.from(this.images.values()).reduce(
      (total, img) => total + img.size,
      0
    )
  }
}