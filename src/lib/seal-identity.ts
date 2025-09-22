import { bcs } from '@mysten/bcs';
import { createHash } from 'crypto';

/**
 * BCS Identity Generation for Seal Content-Identity Based Encryption
 * 
 * Implements exact BCS encoding matching the smart contract policy.move IdV1 struct.
 * Generates deterministic content IDs for articles and media files.
 */

// IdV1 constants matching smart contract (policy.move)
export const TAG_ARTICLE_CONTENT = 0;  // u8
export const ID_VERSION_V1 = 1;        // u16

// BCS layout for IdV1 struct - must match policy.move exactly
const IdV1Layout = bcs.struct('IdV1', {
  tag: bcs.u8(),
  version: bcs.u16(),
  publication: bcs.fixedArray(32, bcs.u8()),  // 32-byte Sui address
  article: bcs.fixedArray(32, bcs.u8()),      // 32-byte Sui address
  nonce: bcs.u64(),
});

/**
 * IdV1 structure for content identification
 */
export interface IdV1 {
  tag: number;        // 0 for article content
  version: number;    // 1 for V1
  publication: number[]; // 32-byte publication address as byte array
  article: number[];     // 32-byte article address as byte array  
  nonce: bigint;        // timestamp for uniqueness
}

/**
 * Validate Sui address format (exactly 32 bytes = 64 hex chars + 0x)
 */
export function isValidSuiAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(address);
}

/**
 * Convert hex address string to byte array
 */
export function addressToBytes(address: string): number[] {
  if (!isValidSuiAddress(address)) {
    throw new Error(`Invalid Sui address format: ${address}. Expected format: 0x followed by 64 hex characters.`);
  }
  
  // Remove 0x prefix and convert to bytes
  const hexString = address.slice(2);
  const bytes: number[] = [];
  for (let i = 0; i < hexString.length; i += 2) {
    bytes.push(parseInt(hexString.slice(i, i + 2), 16));
  }
  return bytes;
}

/**
 * Convert byte array to hex address string
 */
export function bytesToAddress(bytes: number[]): string {
  if (bytes.length !== 32) {
    throw new Error(`Invalid byte array length: ${bytes.length}. Expected 32 bytes for Sui address.`);
  }
  
  return '0x' + bytes.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate deterministic article address from inputs
 * Uses SHA-256 hash to create reproducible addresses
 */
export function generateDeterministicArticleAddress(
  publicationId: string,
  title: string,
  timestamp: number
): string {
  // Create deterministic hash from inputs
  const hash = createHash('sha256')
    .update(publicationId)
    .update(title)
    .update(timestamp.toString())
    .digest();
    
  // Return as proper Sui address format (32 bytes = 64 hex chars)
  return '0x' + hash.toString('hex');
}

/**
 * Generate a proper BCS-encoded IdV1 content ID for articles
 * 
 * @param publicationId - Sui object ID of the publication
 * @param articleTitle - Title of the article (used for deterministic address generation)
 * @returns BCS-encoded IdV1 struct as Uint8Array
 */
export function generateArticleContentId(
  publicationId: string,
  articleTitle: string
): Uint8Array {
  // Validate publication ID format
  if (!isValidSuiAddress(publicationId)) {
    throw new Error(`Invalid Sui address format for publication: ${publicationId}`);
  }

  const timestamp = Date.now();
  
  // Generate deterministic article address
  const articleAddress = generateDeterministicArticleAddress(
    publicationId,
    articleTitle,
    timestamp
  );

  console.log(`🆔 Generating content ID:`);
  console.log(`  Publication ID: ${publicationId}`);
  console.log(`  Article Title: ${articleTitle}`);
  console.log(`  Generated Article Address: ${articleAddress}`);
  console.log(`  Timestamp: ${timestamp}`);

  // Create IdV1 struct
  const idV1: IdV1 = {
    tag: TAG_ARTICLE_CONTENT,     // 0
    version: ID_VERSION_V1,       // 1
    publication: addressToBytes(publicationId),
    article: addressToBytes(articleAddress),
    nonce: BigInt(timestamp)
  };

  // BCS encode to bytes
  const encodedBytes = IdV1Layout.serialize(idV1).toBytes();
  
  console.log(`  Generated BCS-encoded IdV1: ${encodedBytes.length} bytes`);
  console.log(`  Content ID (hex): 0x${Array.from(encodedBytes).map(b => b.toString(16).padStart(2, '0')).join('')}`);
  
  return encodedBytes;
}

/**
 * Generate content ID for media files (images, videos, etc.)
 * Uses filename and MIME type to create unique identities
 * 
 * @param filename - Original filename
 * @param mimeType - MIME type of the file
 * @param publicationId - Sui object ID of the publication
 * @returns BCS-encoded IdV1 struct as Uint8Array
 */
export function generateMediaContentId(
  filename: string,
  mimeType: string,
  publicationId: string
): Uint8Array {
  // Use filename + mimetype as the "title" for media files
  const mediaTitle = `${filename}_${mimeType.replace('/', '_')}`;
  return generateArticleContentId(publicationId, mediaTitle);
}

/**
 * Parse BCS-encoded IdV1 content ID back to struct
 * Useful for debugging and validation
 * 
 * @param encodedId - BCS-encoded IdV1 as Uint8Array
 * @returns Parsed IdV1 struct
 */
export function parseContentId(encodedId: Uint8Array): IdV1 {
  try {
    const parsed = IdV1Layout.parse(encodedId);
    
    // Validate parsed data
    if (parsed.tag !== TAG_ARTICLE_CONTENT) {
      throw new Error(`Invalid tag: ${parsed.tag}. Expected ${TAG_ARTICLE_CONTENT}.`);
    }
    
    if (parsed.version !== ID_VERSION_V1) {
      throw new Error(`Invalid version: ${parsed.version}. Expected ${ID_VERSION_V1}.`);
    }
    
    return {
      tag: parsed.tag,
      version: parsed.version,
      publication: Array.from(parsed.publication),
      article: Array.from(parsed.article),
      nonce: BigInt(parsed.nonce)
    };
  } catch (error) {
    throw new Error(`Failed to parse content ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract publication and article addresses from content ID
 * 
 * @param encodedId - BCS-encoded IdV1 as Uint8Array
 * @returns Object with publication and article addresses
 */
export function extractAddressesFromContentId(encodedId: Uint8Array): {
  publicationId: string;
  articleId: string;
  timestamp: number;
} {
  const parsed = parseContentId(encodedId);
  
  return {
    publicationId: bytesToAddress(parsed.publication),
    articleId: bytesToAddress(parsed.article),
    timestamp: Number(parsed.nonce)
  };
}

/**
 * Validate that a content ID is properly formatted BCS-encoded IdV1
 * 
 * @param encodedId - Content ID to validate
 * @returns true if valid, false otherwise
 */
export function isValidContentId(encodedId: Uint8Array): boolean {
  try {
    parseContentId(encodedId);
    return true;
  } catch {
    return false;
  }
}

/**
 * Convert content ID to hex string for display/logging
 * 
 * @param encodedId - BCS-encoded IdV1 as Uint8Array
 * @returns Hex string representation
 */
export function contentIdToHex(encodedId: Uint8Array): string {
  return '0x' + Array.from(encodedId).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Convert hex string back to content ID Uint8Array
 * 
 * @param hexString - Hex string (with or without 0x prefix)
 * @returns Content ID as Uint8Array
 */
export function hexToContentId(hexString: string): Uint8Array {
  const hex = hexString.startsWith('0x') ? hexString.slice(2) : hexString;
  
  if (hex.length % 2 !== 0) {
    throw new Error('Invalid hex string: odd length');
  }
  
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  
  return bytes;
}