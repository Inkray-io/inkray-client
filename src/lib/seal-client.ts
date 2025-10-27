import { SuiClient } from '@mysten/sui/client';
import { WalletAccount } from '@mysten/wallet-standard';
import { SealClient } from '@mysten/seal';
import { generateArticleContentId, generateMediaContentId } from './seal-identity';
import { toBase64, fromBase64 } from '@mysten/bcs';
import { getKeyServerConfigs, DEFAULT_ENCRYPTION_THRESHOLD, type SealNetwork } from './seal-config';
import { CONFIG } from './config';
import { log } from './utils/Logger';

// NOTE: Direct decryption methods are deprecated.
// Use useContentDecryption hook for React components.

// Types for Seal client configuration
export interface SealClientConfig {
  suiClient: SuiClient;
  account?: WalletAccount | null;
  network: SealNetwork;
  packageId: string;
}

export interface SealEncryptionOptions {
  contentId: Uint8Array; // Always use BCS-encoded content ID
  packageId?: string;
  threshold?: number;
}

export interface SealDecryptionRequest {
  encryptedData: Uint8Array;
  contentId: Uint8Array; // Always use BCS-encoded content ID
  articleId: string; // Article object ID for free access validation
  packageId?: string;
}


/**
 * Inkray Seal Client - Real IBE encryption for frontend
 * 
 * Implements content-identity based encryption where:
 * - All content is encrypted with Seal before upload to Walrus
 * - Uses "free access" policy for universal content access
 * - Supports both markdown text and binary media files
 * - Real threshold cryptography with production key servers
 */
export class InkraySealClient {
  private config: SealClientConfig;
  private sealClient: SealClient | null = null;

  constructor(config: SealClientConfig) {
    this.config = config;
  }

  private async getSealClient(): Promise<SealClient> {
    if (!this.sealClient) {
      try {
        // Get key server configurations from shared config
        const serverConfigs = getKeyServerConfigs(this.config.network);

        if (serverConfigs.length === 0) {
          throw new Error(`No key servers configured for network: ${this.config.network}`);
        }

        log.debug('Connecting to Seal key servers', {
          serverCount: serverConfigs.length,
          network: this.config.network
        }, 'SealClient');

        this.sealClient = new SealClient({
          suiClient: this.config.suiClient,
          serverConfigs,
          verifyKeyServers: false, // Disable for compatibility - enable when servers support it
        });

        log.debug('Seal client connected to key servers', undefined, 'SealClient');
      } catch (error) {
        log.error('Failed to initialize Seal client', { error }, 'SealClient');
        throw new Error(`Seal encryption service unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return this.sealClient;
  }

  // === ENCRYPTION METHODS ===

  /**
   * Encrypt content using real Seal IBE with content-specific identity
   * All content is encrypted for "free access" policy
   * 
   * @param data - Raw content bytes (text or binary)
   * @param options - Encryption options with BCS-encoded content ID
   * @returns Encrypted content as Uint8Array
   */
  async encryptContent(
    data: Uint8Array,
    options: SealEncryptionOptions
  ): Promise<Uint8Array> {
    try {
      const packageId = options.packageId || this.config.packageId;
      const threshold = options.threshold || DEFAULT_ENCRYPTION_THRESHOLD;

      if (!packageId) {
        throw new Error('Seal encryption failed: Package ID not configured. Set NEXT_PUBLIC_PACKAGE_ID environment variable.');
      }

      const sealClient = await this.getSealClient();

      log.debug('Encrypting content with Seal', {
        contentSize: data.length,
        contentIdLength: options.contentId.length,
        packageId,
        threshold
      }, 'SealClient');

      // Convert BCS-encoded content ID to hex string for Seal API
      const idForSeal = '0x' + Array.from(options.contentId)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      const { encryptedObject: encrypted } = await sealClient.encrypt({
        threshold,
        packageId,
        id: idForSeal,
        data,
      });

      log.debug('Content encrypted with Seal', {
        originalSize: data.length,
        encryptedSize: encrypted.length
      }, 'SealClient');

      return encrypted;
    } catch (error) {
      log.error('Encryption failed', { error }, 'SealClient');
      throw error;
    }
  }

  /**
   * Generate BCS-encoded content ID for articles
   * Delegates to the identity generation module
   */
  generateArticleContentId(
    publicationId: string,
    articleTitle: string
  ): Uint8Array {
    return generateArticleContentId(publicationId, articleTitle);
  }

  /**
   * Generate BCS-encoded content ID for media files
   * Delegates to the identity generation module
   */
  generateMediaContentId(
    filename: string,
    mimeType: string,
    publicationId: string
  ): Uint8Array {
    return generateMediaContentId(filename, mimeType, publicationId);
  }

  // === DECRYPTION METHODS ===

  /**
   * @deprecated Use useContentDecryption hook instead for React components
   * Direct decryption methods have been moved to SealService
   */
  async decryptContentFree(_request: SealDecryptionRequest): Promise<Uint8Array> {
    throw new Error('Direct decryption from InkraySealClient is deprecated. Use useContentDecryption hook or SealService instead.');
  }

  /**
   * Get encryption status and capabilities
   */
  getStatus() {
    return {
      isInitialized: !!this.sealClient,
      network: this.config.network,
      packageId: this.config.packageId,
      hasAccount: !!this.config.account,
    };
  }

  /**
   * Reset client state (useful for network changes or account changes)
   */
  reset() {
    this.sealClient = null;
    log.debug('Seal client reset', undefined, 'SealClient');
  }

}

// Utility functions for data conversion
export function arrayBufferToBase64(buffer: Uint8Array): string {
  return toBase64(buffer);
}

export function base64ToArrayBuffer(base64: string): Uint8Array {
  return fromBase64(base64);
}

// Singleton instance for application-wide use
let sealClientInstance: InkraySealClient | null = null;

/**
 * Create a configured Seal client instance
 */
export const createSealClient = (suiClient: SuiClient, account?: WalletAccount | null): InkraySealClient => {
  return new InkraySealClient({
    suiClient,
    account,
    network: CONFIG.NETWORK,
    packageId: CONFIG.PACKAGE_ID,
  });
};

/**
 * Get or create the global Seal client instance
 * Updates account when called with different account
 */
export function getSealClient(suiClient?: SuiClient, account?: WalletAccount | null): InkraySealClient {
  // If parameters are provided, always create/update the instance
  if (suiClient && account !== undefined) {
    sealClientInstance = createSealClient(suiClient, account);
    return sealClientInstance;
  }

  // If no parameters provided, return existing instance or error
  if (!sealClientInstance) {
    throw new Error('Sui client required to initialize Seal client');
  }

  return sealClientInstance;
}

/**
 * Reset the global Seal client (useful for testing or network changes)
 */
export function resetSealClient(): void {
  if (sealClientInstance) {
    sealClientInstance.reset();
  }
  sealClientInstance = null;
}