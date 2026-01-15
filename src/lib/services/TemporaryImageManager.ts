import { TemporaryImage } from '@/types/article'

/**
 * Service for managing temporary images before article upload
 * Provides deterministic URLs and handles image metadata
 */
export class TemporaryImageManager {
  private images: Map<string, TemporaryImage> = new Map()
  // Map backend URLs to blob URLs for preview
  private urlToBlobMap: Map<string, string> = new Map()

  /**
   * Add an image and return a deterministic final URL that stays in markdown
   * @param file - The image file to add
   * @returns Placeholder URL with UUID (will be replaced with backend URL after upload)
   */
  addImage(file: File): string {
    const imageId = crypto.randomUUID()

    // Generate a placeholder URL with the UUID
    // This will be replaced with the actual backend URL after upload
    const finalUrl = `PENDING_UPLOAD/${imageId}`

    // Create blob URL for immediate preview in editor
    const blobUrl = URL.createObjectURL(file)

    const tempImage: TemporaryImage = {
      id: imageId,
      file,
      filename: file.name,
      mimeType: file.type,
      size: file.size,
      imageId,
      finalUrl,
      blobUrl,
    }

    this.images.set(finalUrl, tempImage) // Key by final URL
    return finalUrl // Return the placeholder URL
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
   * Get blob URL for preview by final URL
   * @param url - The final URL to look up
   * @returns Blob URL for preview or undefined if not found
   */
  getBlobUrl(url: string): string | undefined {
    // First check the temp image map
    const image = this.images.get(url)
    if (image?.blobUrl) {
      return image.blobUrl
    }
    // Then check the backend URL to blob URL map
    return this.urlToBlobMap.get(url)
  }

  /**
   * Map a backend URL to a blob URL for preview
   * Used when images are uploaded to backend but need local preview
   * @param backendUrl - The URL returned from backend
   * @param blobUrl - The local blob URL for preview
   */
  mapUrlToBlob(backendUrl: string, blobUrl: string): void {
    this.urlToBlobMap.set(backendUrl, blobUrl)
  }

  /**
   * Get all temporary images
   * @returns Array of temporary images
   */
  getAllImages(): TemporaryImage[] {
    return Array.from(this.images.values())
  }

  /**
   * Get count of temporary images
   * @returns Number of images stored
   */
  getImageCount(): number {
    return this.images.size
  }

  /**
   * Clear all temporary images and revoke blob URLs
   */
  clear(): void {
    // Revoke all blob URLs to free memory
    for (const image of this.images.values()) {
      URL.revokeObjectURL(image.blobUrl)
    }
    this.images.clear()
    this.urlToBlobMap.clear()
  }

  /**
   * Remove a specific image by URL and revoke blob URL
   * @param url - The final URL to remove
   * @returns True if image was removed, false if not found
   */
  removeImage(url: string): boolean {
    const image = this.images.get(url)
    if (image) {
      // Revoke blob URL to free memory
      URL.revokeObjectURL(image.blobUrl)
      return this.images.delete(url)
    }
    return false
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
