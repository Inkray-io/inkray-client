import { SuiClient } from '@mysten/sui/client';
import { WalletAccount } from '@mysten/wallet-standard';
import { SealClient, SessionKey } from '@mysten/seal';
import { Transaction } from '@mysten/sui/transactions';
import { CONFIG } from './config';
import { generateArticleContentId, generateMediaContentId } from './seal-identity';

// Extended wallet account interface with signing capabilities
interface SigningWalletAccount extends WalletAccount {
  signPersonalMessage?: (message: Uint8Array) => Promise<{ signature: string }>;
}

// Types for simplified free access Seal client
export interface SealClientConfig {
  suiClient: SuiClient;
  account?: WalletAccount | null;
  network: 'testnet' | 'mainnet' | 'devnet' | 'localnet';
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
  private sessionKey: SessionKey | null = null;

  constructor(config: SealClientConfig) {
    this.config = config;
  }

  private async getSealClient(): Promise<SealClient> {
    if (!this.sealClient) {
      try {
        // Get key server IDs for the current network (manually configured)
        const serverObjectIds = this.getKeyServerIds(this.config.network);

        if (serverObjectIds.length === 0) {
          throw new Error(`No key servers configured for network: ${this.config.network}`);
        }

        console.log(`🔑 Connecting to ${serverObjectIds.length} Seal key servers on ${this.config.network}`);

        this.sealClient = new SealClient({
          suiClient: this.config.suiClient,
          serverConfigs: serverObjectIds.map((id) => ({
            objectId: id,
            weight: 1,
          })),
          verifyKeyServers: false, // Disable for compatibility - enable when servers support it
        });

        console.log('✅ Seal client connected to key servers');
      } catch (error) {
        console.error('❌ Failed to initialize Seal client:', error);
        throw new Error(`Seal encryption service unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return this.sealClient;
  }

  /**
   * Get key server IDs for the specified network
   * Manual configuration since getAllowlistedKeyServers is not available
   */
  private getKeyServerIds(network: string): string[] {
    // Key server configurations for different networks
    // These should be updated with actual production key server IDs
    const keyServerConfigs: Record<string, string[]> = {
      testnet: [
        // Placeholder testnet key server IDs - replace with actual values
        '0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75',
        '0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8',
      ],
      mainnet: [
        // Placeholder mainnet key server IDs - replace with actual values
        '0x0000000000000000000000000000000000000000000000000000000000000004',
        '0x0000000000000000000000000000000000000000000000000000000000000005',
        '0x0000000000000000000000000000000000000000000000000000000000000006',
      ],
      devnet: [
        // Placeholder devnet key server IDs - replace with actual values
        '0x0000000000000000000000000000000000000000000000000000000000000007',
        '0x0000000000000000000000000000000000000000000000000000000000000008',
        '0x0000000000000000000000000000000000000000000000000000000000000009',
      ],
      localnet: [
        // Placeholder localnet key server IDs for development
        '0x000000000000000000000000000000000000000000000000000000000000000a',
        '0x000000000000000000000000000000000000000000000000000000000000000b',
        '0x000000000000000000000000000000000000000000000000000000000000000c',
      ]
    };

    const servers = keyServerConfigs[network] || keyServerConfigs.testnet;

    // Check if configured from environment
    if (CONFIG.SEAL_KEY_SERVER_IDS) {
      const envServers = CONFIG.SEAL_KEY_SERVER_IDS.split(',').map(id => id.trim());
      if (envServers.length > 0 && envServers[0] !== '') {
        console.log(`🔧 Using key servers from environment: ${envServers.length} servers`);
        return envServers;
      }
    }

    console.log(`🔧 Using default key servers for ${network}: ${servers.length} servers`);
    console.log(`⚠️  To use production key servers, set NEXT_PUBLIC_SEAL_KEY_SERVER_IDS environment variable`);

    return servers;
  }

  private async getSessionKey(address: string, packageId: string): Promise<SessionKey> {
    if (!this.sessionKey) {
      this.sessionKey = await SessionKey.create({
        address,
        packageId,
        ttlMin: 10,
        suiClient: this.config.suiClient,
      });
    }
    return this.sessionKey;
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
      console.log(`🔒 Encrypting content with Seal...`);

      const packageId = options.packageId || this.config.packageId;
      const threshold = options.threshold || 2;

      if (!packageId) {
        throw new Error('Seal encryption failed: Package ID not configured. Set NEXT_PUBLIC_PACKAGE_ID environment variable.');
      }

      const sealClient = await this.getSealClient();

      console.log(`  Content size: ${data.length} bytes`);
      console.log(`  Content ID: [BCS-encoded IdV1: ${options.contentId.length} bytes]`);
      console.log(`  Package ID: ${packageId}`);
      console.log(`  Threshold: ${threshold} key servers`);

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

      console.log(`✅ Content encrypted with Seal!`);
      console.log(`  Original size: ${data.length} bytes`);
      console.log(`  Encrypted size: ${encrypted.length} bytes`);

      return encrypted;
    } catch (error) {
      console.error(`❌ Encryption failed: ${error}`);
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
   * Decrypt content using free access policy
   * All encrypted content is accessible via this method
   * 
   * @param request - Decryption request with encrypted data and article ID
   * @returns Decrypted content as Uint8Array
   */
  async decryptContentFree(request: SealDecryptionRequest): Promise<Uint8Array> {
    try {
      console.log(`🔓 Decrypting content with free access policy...`);
      console.log(`  Encrypted size: ${request.encryptedData.length} bytes`);
      console.log(`  Article ID: ${request.articleId}`);

      const packageId = request.packageId || this.config.packageId;

      if (!packageId) {
        throw new Error('Package ID not configured. Set NEXT_PUBLIC_PACKAGE_ID environment variable.');
      }

      if (!this.config.account) {
        throw new Error('Wallet account required for decryption. Please connect your wallet.');
      }

      const sealClient = await this.getSealClient();
      const sessionKey = await this.getSessionKey(this.config.account.address, packageId);

      // Sign session key with user's wallet
      if (this.config.account && 'signPersonalMessage' in this.config.account) {
        const message = sessionKey.getPersonalMessage();
        const signResult = await (this.config.account as SigningWalletAccount).signPersonalMessage!(message);
        sessionKey.setPersonalMessageSignature(signResult.signature);
      }

      // Build Move transaction for free access approval
      const tx = new Transaction();
      tx.moveCall({
        target: `${packageId}::policy::seal_approve_free`,
        arguments: [
          tx.pure.vector('u8', Array.from(request.contentId)),
          tx.object(request.articleId), // Article object reference for validation
        ]
      });

      // Build transaction bytes for Seal
      const txBytes = await tx.build({
        client: this.config.suiClient,
        onlyTransactionKind: true
      });

      console.log(`  Transaction built: ${txBytes.length} bytes`);
      console.log(`  Requesting decryption from key servers...`);

      // Decrypt using real Seal protocol with threshold reconstruction
      const decrypted = await sealClient.decrypt({
        data: request.encryptedData,
        sessionKey,
        txBytes,
      });

      console.log(`✅ Content decrypted successfully`);
      console.log(`  Decrypted size: ${decrypted.length} bytes`);

      return decrypted;
    } catch (error) {
      console.error('❌ Seal decryption failed:', error);

      if (error instanceof Error) {
        if (error.message.includes('key server')) {
          throw new Error('Decryption service temporarily unavailable. Please try again later.');
        }
        if (error.message.includes('threshold')) {
          throw new Error('Insufficient key servers available for decryption.');
        }
        if (error.message.includes('session')) {
          throw new Error('Authentication failed. Please reconnect your wallet.');
        }
        if (error.message.includes('approve_free')) {
          throw new Error('Access denied. Content may not support free access.');
        }
      }

      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
    this.sessionKey = null;
    console.log('🔄 Seal client reset');
  }

}

// Utility functions for data conversion
export function arrayBufferToBase64(buffer: Uint8Array): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToArrayBuffer(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
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