import { bcs } from '@mysten/sui/bcs';
import { toHex } from '@mysten/sui/utils';

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
  publication: bcs.Address,  // Sui address
  nonce: bcs.u64(),
});

/**
 * IdV1 structure for content identification
 */
export interface IdV1 {
  tag: number;        // 0 for article content
  version: number;    // 1 for V1
  publication: string; // Publication address
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

  return '0x' + toHex(new Uint8Array(bytes));
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

  // Use title hash for deterministic nonce
  const titleHash = articleTitle.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  const timestamp = Date.now();
  const nonce = BigInt(timestamp + Math.abs(titleHash));

  // Create IdV1 struct
  const idV1: IdV1 = {
    tag: TAG_ARTICLE_CONTENT,
    version: ID_VERSION_V1,
    publication: publicationId,
    nonce
  };

  // BCS encode to bytes
  const encodedBytes = IdV1Layout.serialize(idV1).toBytes();

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
      publication: parsed.publication,
      nonce: BigInt(parsed.nonce)
    };
  } catch (error) {
    throw new Error(`Failed to parse content ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract publication and timestamp from content ID
 * 
 * @param encodedId - BCS-encoded IdV1 as Uint8Array
 * @returns Object with publication and timestamp
 */
export function extractAddressesFromContentId(encodedId: Uint8Array): {
  publicationId: string;
  timestamp: number;
} {
  const parsed = parseContentId(encodedId);

  return {
    publicationId: parsed.publication,
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
  return '0x' + toHex(encodedId);
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
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }

  return bytes;
}