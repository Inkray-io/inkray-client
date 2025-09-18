import { SuiClient } from '@mysten/sui/client';
import { WalletAccount } from '@mysten/wallet-standard';
import { CONFIG } from './config';

// Types for client configurations
export interface SealClientConfig {
  suiClient: SuiClient;
  account?: WalletAccount | null;
  network: 'testnet' | 'mainnet' | 'devnet' | 'localnet';
  packageId: string;
}

export interface WalrusClientConfig {
  suiClient: SuiClient;
  account?: WalletAccount | null;
  aggregatorUrl: string;
  publisherUrl: string;
  network: 'testnet' | 'mainnet' | 'devnet' | 'localnet';
}

// Re-export validated configuration
export const INKRAY_CONFIG = CONFIG;

// ========================================
// LEGACY COMPATIBILITY LAYER
// These are kept for backward compatibility but will be removed in future versions
// ========================================

/**
 * @deprecated Use createSealClient from '@/lib/seal-client' instead
 * This class is deprecated and will be removed. Please migrate to the new Seal client.
 */
export class LegacySealClient {
  constructor(private config: SealClientConfig) {
    console.warn('⚠️ Using deprecated LegacySealClient. Migrate to createSealClient from @/lib/seal-client');
  }

  generateArticleContentId(publicationId: string, articleTitle: string): Uint8Array {
    const contentString = `article_${publicationId}_${articleTitle.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
    return new TextEncoder().encode(contentString);
  }

  async encryptContent(): Promise<Uint8Array> {
    throw new Error('Legacy client does not support encryption. Use createSealClient from @/lib/seal-client');
  }

  async decryptContent(): Promise<Uint8Array> {
    throw new Error('Legacy client does not support decryption. Use createSealClient from @/lib/seal-client');
  }
}

/**
 * @deprecated Use createWalrusClient from '@/lib/walrus-client' instead
 * This class is deprecated and will be removed. Please migrate to the new Walrus client.
 */
export class LegacyWalrusClient {
  constructor(private config: WalrusClientConfig) {
    console.warn('⚠️ Using deprecated LegacyWalrusClient. Migrate to createWalrusClient from @/lib/walrus-client');
  }

  async uploadBlob(): Promise<never> {
    throw new Error('Legacy client does not support uploads. Use createWalrusClient from @/lib/walrus-client');
  }

  async downloadBlob(): Promise<never> {
    throw new Error('Legacy client does not support downloads. Use createWalrusClient from @/lib/walrus-client');
  }
}

// Export legacy classes with new names to avoid conflicts
export { LegacySealClient as SealClient };
export { LegacyWalrusClient as WalrusClient };

/**
 * Generate a slug from article title
 */
export const generateArticleSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .slice(0, 100); // Limit length
};