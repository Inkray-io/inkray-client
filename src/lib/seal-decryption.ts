import { getSealClient } from './seal-client';
import { parseContentId, contentIdToHex, hexToContentId } from './seal-identity';
import { CONFIG } from './config';

/**
 * Production Seal Decryption Functions
 * 
 * Provides high-level decryption APIs for different content types.
 * All content uses "free access" policy for universal decryption.
 */

export interface DecryptionResult {
  decryptedData: Uint8Array;
  contentId: Uint8Array;
  contentIdHex: string;
  originalSize: number;
  decryptedSize: number;
}

export interface DecryptedMediaFile {
  content: string; // base64 encoded decrypted content
  filename: string;
  mimeType: string;
  size: number;
  contentId: Uint8Array;
  contentIdHex: string;
  isDecrypted: true;
}

/**
 * Decrypt article content with Seal IBE using free access policy
 * 
 * @param encryptedData - Encrypted article content as Uint8Array
 * @param contentId - BCS-encoded content ID as Uint8Array
 * @param articleId - Sui object ID of the article for validation
 * @param packageId - Smart contract package ID (optional, uses CONFIG default)
 * @returns Decryption result with decrypted content
 */
export async function decryptArticleContent(
  encryptedData: Uint8Array,
  contentId: Uint8Array,
  articleId: string,
  packageId: string = CONFIG.PACKAGE_ID
): Promise<DecryptionResult> {
  try {
    const contentIdHex = contentIdToHex(contentId);
    console.log(`🔓 Decrypting article content...`);
    console.log(`  Content ID: ${contentIdHex.substring(0, 20)}...`);
    console.log(`  Article ID: ${articleId}`);
    console.log(`  Encrypted size: ${encryptedData.length} bytes`);

    // Get Seal client instance
    const sealClient = getSealClient();

    // Decrypt using free access policy
    const decryptedData = await sealClient.decryptContentFree({
      encryptedData,
      contentId,
      articleId,
      packageId
    });

    const result: DecryptionResult = {
      decryptedData,
      contentId,
      contentIdHex,
      originalSize: encryptedData.length,
      decryptedSize: decryptedData.length
    };

    console.log(`✅ Article decrypted successfully`);
    console.log(`  Content ID: ${contentIdHex.substring(0, 20)}...`);
    console.log(`  Encrypted size: ${result.originalSize} bytes`);
    console.log(`  Decrypted size: ${result.decryptedSize} bytes`);

    return result;
  } catch (error) {
    console.error(`❌ Failed to decrypt article content:`, error);
    throw new Error(`Article decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decrypt article content and convert to string
 * 
 * @param encryptedData - Encrypted article content as Uint8Array
 * @param contentId - BCS-encoded content ID as Uint8Array  
 * @param articleId - Sui object ID of the article for validation
 * @param packageId - Smart contract package ID (optional, uses CONFIG default)
 * @returns Decrypted article content as string
 */
export async function decryptArticleContentAsString(
  encryptedData: Uint8Array,
  contentId: Uint8Array,
  articleId: string,
  packageId: string = CONFIG.PACKAGE_ID
): Promise<string> {
  const result = await decryptArticleContent(encryptedData, contentId, articleId, packageId);
  return new TextDecoder().decode(result.decryptedData);
}

/**
 * Decrypt media file with Seal IBE using free access policy
 * 
 * @param encryptedContent - Base64 encoded encrypted media content
 * @param filename - Original filename
 * @param mimeType - MIME type of the file
 * @param contentId - BCS-encoded content ID as Uint8Array
 * @param articleId - Sui object ID of the article for validation
 * @param packageId - Smart contract package ID (optional, uses CONFIG default)
 * @returns Decrypted media file with base64 content
 */
export async function decryptMediaFile(
  encryptedContent: string,
  filename: string,
  mimeType: string,
  contentId: Uint8Array,
  articleId: string,
  packageId: string = CONFIG.PACKAGE_ID
): Promise<DecryptedMediaFile> {
  try {
    const contentIdHex = contentIdToHex(contentId);
    console.log(`🖼️ Decrypting media file: ${filename}`);
    console.log(`  Type: ${mimeType}`);
    console.log(`  Content ID: ${contentIdHex.substring(0, 20)}...`);

    // Convert base64 to bytes
    const encryptedBytes = new Uint8Array(
      atob(encryptedContent)
        .split('')
        .map(char => char.charCodeAt(0))
    );

    // Get Seal client instance
    const sealClient = getSealClient();

    // Decrypt using free access policy
    const decryptedData = await sealClient.decryptContentFree({
      encryptedData: encryptedBytes,
      contentId,
      articleId,
      packageId
    });

    // Convert decrypted data back to base64
    const decryptedBase64 = btoa(
      Array.from(decryptedData, byte => String.fromCharCode(byte)).join('')
    );

    const result: DecryptedMediaFile = {
      content: decryptedBase64,
      filename,
      mimeType,
      size: decryptedData.length,
      contentId,
      contentIdHex,
      isDecrypted: true as const
    };

    console.log(`✅ Media file decrypted successfully`);
    console.log(`  Original size: ${encryptedBytes.length} bytes`);
    console.log(`  Decrypted size: ${result.size} bytes`);

    return result;
  } catch (error) {
    console.error(`❌ Failed to decrypt media file:`, error);
    throw new Error(`Media decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decrypt multiple media files in parallel
 * 
 * @param encryptedFiles - Array of encrypted media files
 * @param articleId - Sui object ID of the article for validation
 * @param packageId - Smart contract package ID (optional, uses CONFIG default)
 * @returns Array of decrypted media files
 */
export async function decryptMediaFiles(
  encryptedFiles: Array<{
    content: string; // base64 encrypted
    filename: string;
    mimeType: string;
    contentId: Uint8Array;
  }>,
  articleId: string,
  packageId: string = CONFIG.PACKAGE_ID
): Promise<DecryptedMediaFile[]> {
  if (encryptedFiles.length === 0) {
    return [];
  }

  try {
    console.log(`📁 Decrypting ${encryptedFiles.length} media files...`);

    // Decrypt all files in parallel for better performance
    const decryptedFiles = await Promise.all(
      encryptedFiles.map(file =>
        decryptMediaFile(
          file.content,
          file.filename,
          file.mimeType,
          file.contentId,
          articleId,
          packageId
        )
      )
    );

    console.log(`✅ All media files decrypted successfully`);
    return decryptedFiles;
  } catch (error) {
    console.error(`❌ Failed to decrypt media files:`, error);
    throw new Error(`Batch media decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate decryption requirements before attempting decryption
 * 
 * @param contentId - Content ID to validate
 * @param articleId - Article ID to validate
 * @param packageId - Package ID to validate
 * @returns true if requirements are met, throws error otherwise
 */
export function validateDecryptionRequirements(
  contentId: Uint8Array,
  articleId: string,
  packageId: string = CONFIG.PACKAGE_ID
): boolean {
  // Validate content ID format
  try {
    parseContentId(contentId);
  } catch (error) {
    throw new Error(`Invalid content ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Validate article ID format
  if (!articleId || !/^0x[a-fA-F0-9]{64}$/.test(articleId)) {
    throw new Error('Invalid article ID format. Must be a valid Sui object ID.');
  }

  // Validate package ID format
  if (!packageId || !/^0x[a-fA-F0-9]{60,64}$/.test(packageId)) {
    throw new Error('Invalid package ID format. Must be a valid Sui package ID.');
  }

  // Check if Seal client can be initialized
  try {
    getSealClient(); // This will throw if not properly configured
  } catch (error) {
    throw new Error(`Seal decryption not available: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return true;
}

/**
 * Get decryption status and capabilities
 */
export function getDecryptionStatus(): {
  isAvailable: boolean;
  network: string;
  packageId: string;
  hasAccount: boolean;
  error?: string;
} {
  try {
    const sealClient = getSealClient();
    const status = sealClient.getStatus();
    
    return {
      isAvailable: status.isInitialized && status.hasAccount,
      network: status.network,
      packageId: status.packageId,
      hasAccount: status.hasAccount,
    };
  } catch (error) {
    return {
      isAvailable: false,
      network: CONFIG.NETWORK,
      packageId: CONFIG.PACKAGE_ID,
      hasAccount: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Decrypt content with automatic content ID parsing from hex string
 * Useful when content ID is stored as hex string
 * 
 * @param encryptedData - Encrypted content as Uint8Array
 * @param contentIdHex - Content ID as hex string (with or without 0x prefix)
 * @param articleId - Sui object ID of the article for validation
 * @param packageId - Smart contract package ID (optional, uses CONFIG default)
 * @returns Decryption result
 */
export async function decryptContentFromHex(
  encryptedData: Uint8Array,
  contentIdHex: string,
  articleId: string,
  packageId: string = CONFIG.PACKAGE_ID
): Promise<DecryptionResult> {
  try {
    const contentId = hexToContentId(contentIdHex);
    return await decryptArticleContent(encryptedData, contentId, articleId, packageId);
  } catch (error) {
    throw new Error(`Failed to decrypt content from hex ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Utility function to safely decrypt content with error handling
 * Returns null instead of throwing errors for optional decryption attempts
 * 
 * @param encryptedData - Encrypted content as Uint8Array
 * @param contentId - BCS-encoded content ID as Uint8Array
 * @param articleId - Sui object ID of the article for validation
 * @param packageId - Smart contract package ID (optional, uses CONFIG default)
 * @returns Decryption result or null if decryption fails
 */
export async function tryDecryptContent(
  encryptedData: Uint8Array,
  contentId: Uint8Array,
  articleId: string,
  packageId: string = CONFIG.PACKAGE_ID
): Promise<DecryptionResult | null> {
  try {
    return await decryptArticleContent(encryptedData, contentId, articleId, packageId);
  } catch (error) {
    console.warn(`Decryption failed (non-critical):`, error);
    return null;
  }
}