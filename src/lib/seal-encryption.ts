import { getSealClient } from './seal-client';
import { generateArticleContentId, generateMediaContentId, contentIdToHex } from './seal-identity';
import { CONFIG } from './config';

/**
 * Production Seal Encryption Functions
 * 
 * Provides high-level encryption APIs for different content types.
 * All content is encrypted with real Seal IBE for "free access" policy.
 */

export interface EncryptionResult {
  encryptedData: Uint8Array;
  contentId: Uint8Array;
  contentIdHex: string;
  originalSize: number;
  encryptedSize: number;
}

export interface MediaFile {
  content: string; // base64 encoded
  filename: string;
  mimeType: string;
  size?: number;
}

export interface EncryptedMediaFile extends MediaFile {
  contentId: Uint8Array;
  contentIdHex: string;
  isEncrypted: true;
}

/**
 * Encrypt article content with Seal IBE
 * 
 * @param content - Article content as markdown text
 * @param publicationId - Sui object ID of the publication
 * @param title - Article title for deterministic content ID generation
 * @param packageId - Smart contract package ID (optional, uses CONFIG default)
 * @returns Encryption result with encrypted data and content ID
 */
export async function encryptArticleContent(
  content: string,
  publicationId: string,
  title: string,
  packageId: string = CONFIG.PACKAGE_ID
): Promise<EncryptionResult> {
  try {
    console.log(`🔒 Encrypting article: "${title}"`);
    console.log(`  Publication: ${publicationId}`);
    console.log(`  Content length: ${content.length} characters`);

    // Generate BCS-encoded content ID
    const contentId = generateArticleContentId(publicationId, title);
    const contentIdHex = contentIdToHex(contentId);

    // Convert content to bytes
    const contentBytes = new TextEncoder().encode(content);

    // Get Seal client instance (will need to be initialized with SuiClient and account)
    const sealClient = getSealClient();

    // Encrypt using real Seal protocol
    const encryptedData = await sealClient.encryptContent(contentBytes, {
      contentId,
      packageId,
      threshold: 2 // Require 2 of 3 key servers
    });

    const result: EncryptionResult = {
      encryptedData,
      contentId,
      contentIdHex,
      originalSize: contentBytes.length,
      encryptedSize: encryptedData.length
    };

    console.log(`✅ Article encrypted successfully`);
    console.log(`  Content ID: ${contentIdHex.substring(0, 20)}...`);
    console.log(`  Original size: ${result.originalSize} bytes`);
    console.log(`  Encrypted size: ${result.encryptedSize} bytes`);

    return result;
  } catch (error) {
    console.error(`❌ Failed to encrypt article content:`, error);
    throw new Error(`Article encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Encrypt media file with Seal IBE
 * 
 * @param mediaFile - Media file object with base64 content
 * @param publicationId - Sui object ID of the publication
 * @param packageId - Smart contract package ID (optional, uses CONFIG default)
 * @returns Encrypted media file with content ID
 */
export async function encryptMediaFile(
  mediaFile: MediaFile,
  publicationId: string,
  packageId: string = CONFIG.PACKAGE_ID
): Promise<EncryptedMediaFile> {
  try {
    console.log(`🖼️ Encrypting media file: ${mediaFile.filename}`);
    console.log(`  Type: ${mediaFile.mimeType}`);
    console.log(`  Size: ${mediaFile.size || 'unknown'} bytes`);

    // Generate BCS-encoded content ID for media
    const contentId = generateMediaContentId(
      mediaFile.filename, 
      mediaFile.mimeType, 
      publicationId
    );
    const contentIdHex = contentIdToHex(contentId);

    // Convert base64 content to bytes
    const contentBytes = new Uint8Array(
      atob(mediaFile.content)
        .split('')
        .map(char => char.charCodeAt(0))
    );

    // Get Seal client instance
    const sealClient = getSealClient();

    // Encrypt using real Seal protocol
    const encryptedData = await sealClient.encryptContent(contentBytes, {
      contentId,
      packageId,
      threshold: 2
    });

    // Convert encrypted data back to base64 for transport
    const encryptedBase64 = btoa(
      Array.from(encryptedData, byte => String.fromCharCode(byte)).join('')
    );

    const result: EncryptedMediaFile = {
      ...mediaFile,
      content: encryptedBase64,
      contentId,
      contentIdHex,
      isEncrypted: true as const
    };

    console.log(`✅ Media file encrypted successfully`);
    console.log(`  Content ID: ${contentIdHex.substring(0, 20)}...`);
    console.log(`  Original size: ${contentBytes.length} bytes`);
    console.log(`  Encrypted size: ${encryptedData.length} bytes`);

    return result;
  } catch (error) {
    console.error(`❌ Failed to encrypt media file:`, error);
    throw new Error(`Media encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Encrypt multiple media files in parallel
 * 
 * @param mediaFiles - Array of media file objects
 * @param publicationId - Sui object ID of the publication
 * @param packageId - Smart contract package ID (optional, uses CONFIG default)
 * @returns Array of encrypted media files
 */
export async function encryptMediaFiles(
  mediaFiles: MediaFile[],
  publicationId: string,
  packageId: string = CONFIG.PACKAGE_ID
): Promise<EncryptedMediaFile[]> {
  if (mediaFiles.length === 0) {
    return [];
  }

  try {
    console.log(`📁 Encrypting ${mediaFiles.length} media files...`);

    // Encrypt all files in parallel for better performance
    const encryptedFiles = await Promise.all(
      mediaFiles.map(file => encryptMediaFile(file, publicationId, packageId))
    );

    console.log(`✅ All media files encrypted successfully`);
    return encryptedFiles;
  } catch (error) {
    console.error(`❌ Failed to encrypt media files:`, error);
    throw new Error(`Batch media encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate encryption requirements before attempting encryption
 * 
 * @param publicationId - Publication ID to validate
 * @param packageId - Package ID to validate
 * @returns true if requirements are met, throws error otherwise
 */
export function validateEncryptionRequirements(
  publicationId: string,
  packageId: string = CONFIG.PACKAGE_ID
): boolean {
  // Validate publication ID format
  if (!publicationId || !/^0x[a-fA-F0-9]{64}$/.test(publicationId)) {
    throw new Error('Invalid publication ID format. Must be a valid Sui object ID.');
  }

  // Validate package ID format
  if (!packageId || !/^0x[a-fA-F0-9]{60,64}$/.test(packageId)) {
    throw new Error('Invalid package ID format. Must be a valid Sui package ID.');
  }

  // Check basic configuration requirements
  // Note: We don't initialize the client here since we don't have the user context yet
  if (!CONFIG.PACKAGE_ID || CONFIG.PACKAGE_ID === '0x0000000000000000000000000000000000000000000000000000000000000000') {
    throw new Error('Seal encryption not available: Package ID not configured');
  }

  return true;
}

/**
 * Get encryption status and capabilities
 */
export function getEncryptionStatus(): {
  isAvailable: boolean;
  network: string;
  packageId: string;
  error?: string;
} {
  try {
    // Check if we have the basic configuration requirements
    if (!CONFIG.PACKAGE_ID || CONFIG.PACKAGE_ID === '0x0000000000000000000000000000000000000000000000000000000000000000') {
      return {
        isAvailable: false,
        network: CONFIG.NETWORK,
        packageId: CONFIG.PACKAGE_ID,
        error: 'Package ID not configured'
      };
    }

    // At this point, encryption should be available
    // We don't initialize the client here since we don't have a suiClient yet
    return {
      isAvailable: true,
      network: CONFIG.NETWORK,
      packageId: CONFIG.PACKAGE_ID,
    };
  } catch (error) {
    return {
      isAvailable: false,
      network: CONFIG.NETWORK,
      packageId: CONFIG.PACKAGE_ID,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Estimate encryption overhead
 * Seal encryption adds some overhead to the original content size
 * 
 * @param originalSize - Original content size in bytes
 * @returns Estimated encrypted size in bytes
 */
export function estimateEncryptedSize(originalSize: number): number {
  // Seal encryption typically adds ~100-200 bytes of overhead
  // This is an approximation for UI progress indicators
  return originalSize + 150;
}

/**
 * Utility function to convert base64 to Uint8Array
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Utility function to convert Uint8Array to base64
 */
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}