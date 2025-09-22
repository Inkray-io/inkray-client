import { SuiClient } from '@mysten/sui/client';
import { WalletAccount } from '@mysten/wallet-standard';
import { Transaction } from '@mysten/sui/transactions';
import { SealClient, SessionKey } from '@mysten/seal';
import { fromHex } from '@mysten/bcs';
import { generateArticleContentId, generateMediaContentId, contentIdToHex } from '../seal-identity';
import { getSealClient, type InkraySealClient } from '../seal-client';
import { CONFIG } from '../config';

/**
 * Unified Seal Service for Content Encryption and Decryption
 * 
 * This service provides a clean, centralized interface for all Seal operations
 * including content encryption, decryption, and session management.
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

export interface DecryptionParams {
  encryptedData: Uint8Array;
  contentId: string; // hex string from database
  articleId: string;
}

export interface EncryptionStatus {
  isAvailable: boolean;
  network: string;
  packageId: string;
  error?: string;
}

export class SealService {
  private suiClient: SuiClient;
  private currentAccount: WalletAccount;
  private sealClient: InkraySealClient | null = null;

  constructor(suiClient: SuiClient, currentAccount: WalletAccount) {
    this.suiClient = suiClient;
    this.currentAccount = currentAccount;
  }

  /**
   * Initialize or get the Seal client instance
   */
  private getSealClientInstance(): InkraySealClient {
    if (!this.sealClient) {
      this.sealClient = getSealClient(this.suiClient, this.currentAccount);
    }
    return this.sealClient;
  }

  /**
   * Get key server IDs for the current network
   */
  private getKeyServerIds(): string[] {
    const keyServerConfigs: Record<string, string[]> = {
      testnet: [
        '0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75',
        '0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8',
      ],
      mainnet: [
        '0x0000000000000000000000000000000000000000000000000000000000000004',
        '0x0000000000000000000000000000000000000000000000000000000000000005',
        '0x0000000000000000000000000000000000000000000000000000000000000006',
      ],
      devnet: [
        '0x0000000000000000000000000000000000000000000000000000000000000007',
        '0x0000000000000000000000000000000000000000000000000000000000000008',
        '0x0000000000000000000000000000000000000000000000000000000000000009',
      ],
      localnet: [
        '0x000000000000000000000000000000000000000000000000000000000000000a',
        '0x000000000000000000000000000000000000000000000000000000000000000b',
        '0x000000000000000000000000000000000000000000000000000000000000000c',
      ]
    };

    const servers = keyServerConfigs[CONFIG.NETWORK] || keyServerConfigs.testnet;

    // Check if configured from environment
    if (CONFIG.SEAL_KEY_SERVER_IDS) {
      const envServers = CONFIG.SEAL_KEY_SERVER_IDS.split(',').map(id => id.trim());
      if (envServers.length > 0 && envServers[0] !== '') {
        return envServers;
      }
    }

    return servers;
  }

  /**
   * Get encryption status and availability
   */
  public getEncryptionStatus(): EncryptionStatus {
    try {
      if (!CONFIG.PACKAGE_ID || CONFIG.PACKAGE_ID === '0x0000000000000000000000000000000000000000000000000000000000000000') {
        return {
          isAvailable: false,
          network: CONFIG.NETWORK,
          packageId: CONFIG.PACKAGE_ID,
          error: 'Package ID not configured'
        };
      }

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
   * Validate encryption requirements
   */
  public validateEncryptionRequirements(publicationId: string): boolean {
    // Validate publication ID format
    if (!publicationId || !/^0x[a-fA-F0-9]{64}$/.test(publicationId)) {
      throw new Error('Invalid publication ID format. Must be a valid Sui object ID.');
    }

    // Validate package ID format
    if (!CONFIG.PACKAGE_ID || !/^0x[a-fA-F0-9]{60,64}$/.test(CONFIG.PACKAGE_ID)) {
      throw new Error('Invalid package ID format. Must be a valid Sui package ID.');
    }

    // Check basic configuration requirements
    if (!CONFIG.PACKAGE_ID || CONFIG.PACKAGE_ID === '0x0000000000000000000000000000000000000000000000000000000000000000') {
      throw new Error('Seal encryption not available: Package ID not configured');
    }

    return true;
  }

  /**
   * Encrypt article content
   */
  public async encryptArticleContent(
    content: string,
    publicationId: string,
    title: string
  ): Promise<EncryptionResult> {
    try {
      this.validateEncryptionRequirements(publicationId);

      // Generate content ID
      const contentId = generateArticleContentId(publicationId, title);
      const contentIdHex = contentIdToHex(contentId);

      // Convert content to bytes
      const contentBytes = new TextEncoder().encode(content);

      // Get Seal client instance
      const sealClient = this.getSealClientInstance();

      // Encrypt using Seal protocol
      const encryptedData = await sealClient.encryptContent(contentBytes, {
        contentId,
        packageId: CONFIG.PACKAGE_ID,
        threshold: 2
      });

      return {
        encryptedData,
        contentId,
        contentIdHex,
        originalSize: contentBytes.length,
        encryptedSize: encryptedData.length
      };
    } catch (error) {
      throw new Error(`Article encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Encrypt media file
   */
  public async encryptMediaFile(
    mediaFile: MediaFile,
    publicationId: string
  ): Promise<EncryptedMediaFile> {
    try {
      this.validateEncryptionRequirements(publicationId);

      // Generate content ID for media
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
      const sealClient = this.getSealClientInstance();

      // Encrypt using Seal protocol
      const encryptedData = await sealClient.encryptContent(contentBytes, {
        contentId,
        packageId: CONFIG.PACKAGE_ID,
        threshold: 2
      });

      // Convert encrypted data back to base64 for transport
      const encryptedBase64 = btoa(
        Array.from(encryptedData, byte => String.fromCharCode(byte)).join('')
      );

      return {
        ...mediaFile,
        content: encryptedBase64,
        contentId,
        contentIdHex,
        isEncrypted: true as const
      };
    } catch (error) {
      throw new Error(`Media encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Encrypt multiple media files in parallel
   */
  public async encryptMediaFiles(
    mediaFiles: MediaFile[],
    publicationId: string
  ): Promise<EncryptedMediaFile[]> {
    if (mediaFiles.length === 0) {
      return [];
    }

    try {
      // Encrypt all files in parallel for better performance
      const encryptedFiles = await Promise.all(
        mediaFiles.map(file => this.encryptMediaFile(file, publicationId))
      );

      return encryptedFiles;
    } catch (error) {
      throw new Error(`Batch media encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create session key for decryption
   */
  private async createSessionKey(): Promise<SessionKey> {
    const sessionKey = await SessionKey.create({
      address: this.currentAccount.address,
      packageId: CONFIG.PACKAGE_ID,
      ttlMin: 10,
      suiClient: this.suiClient,
    });

    return sessionKey;
  }

  /**
   * Build Move transaction for content access approval
   */
  private buildApprovalTransaction(contentIdBytes: Uint8Array, articleId: string): Transaction {
    const tx = new Transaction();
    tx.moveCall({
      target: `${CONFIG.PACKAGE_ID}::policy::seal_approve_free`,
      arguments: [
        tx.pure.vector('u8', Array.from(contentIdBytes)),
        tx.object(articleId),
      ]
    });

    return tx;
  }

  /**
   * Decrypt content using Seal protocol
   */
  public async decryptContent(
    params: DecryptionParams,
    signMessage: (message: Uint8Array) => Promise<string>
  ): Promise<string> {
    try {
      // Validate inputs
      if (!params.contentId || params.contentId.length === 0) {
        throw new Error('Invalid content ID: empty or null');
      }

      if (!params.contentId.startsWith('0x')) {
        throw new Error('Content ID must be a hex string starting with 0x');
      }

      if (!params.articleId || !/^0x[a-fA-F0-9]{64}$/.test(params.articleId)) {
        throw new Error('Invalid article ID format. Must be a valid Sui object ID.');
      }

      // Convert hex string back to bytes
      const contentIdBytes = fromHex(params.contentId);

      // Get key server IDs
      const serverObjectIds = this.getKeyServerIds();
      if (serverObjectIds.length === 0) {
        throw new Error(`No key servers configured for network: ${CONFIG.NETWORK}`);
      }

      // Initialize Seal client for decryption
      const sealClient = new SealClient({
        suiClient: this.suiClient,
        serverConfigs: serverObjectIds.map((id) => ({
          objectId: id,
          weight: 1,
        })),
        verifyKeyServers: false,
      });

      // Create session key
      const sessionKey = await this.createSessionKey();

      // Sign the session key message
      const message = sessionKey.getPersonalMessage();
      const signature = await signMessage(message);
      sessionKey.setPersonalMessageSignature(signature);

      // Build approval transaction
      const tx = this.buildApprovalTransaction(contentIdBytes, params.articleId);

      // Build transaction bytes for Seal
      const txBytes = await tx.build({
        client: this.suiClient,
        onlyTransactionKind: true
      });

      // Dry run the transaction to check if it would succeed
      try {
        const dryRunResult = await this.suiClient.dryRunTransactionBlock({
          transactionBlock: txBytes,
        });

        if (dryRunResult.effects.status.status === 'failure') {
          const errorMsg = dryRunResult.effects.status.error || 'Unknown error';
          throw new Error(`Transaction would fail: ${errorMsg}`);
        }
      } catch {
        // Continue with decryption even if dry run fails
      }

      // Decrypt using Seal protocol
      const decrypted = await sealClient.decrypt({
        data: params.encryptedData,
        sessionKey,
        txBytes,
      });

      // Convert decrypted bytes to string
      const decryptedContent = new TextDecoder().decode(decrypted);

      return decryptedContent;
    } catch (error) {
      let errorMessage = 'Failed to decrypt content';

      if (error instanceof Error) {
        if (error.message.includes('key server')) {
          errorMessage = 'Decryption service temporarily unavailable. Please try again later.';
        } else if (error.message.includes('threshold')) {
          errorMessage = 'Insufficient key servers available for decryption.';
        } else if (error.message.includes('session')) {
          errorMessage = 'Authentication failed. Please reconnect your wallet.';
        } else if (error.message.includes('approve_free')) {
          errorMessage = 'Access denied. Content may not support free access.';
        } else if (error.message.includes('sign')) {
          errorMessage = 'Failed to sign authentication message. Please try again.';
        } else {
          errorMessage = error.message;
        }
      }

      throw new Error(errorMessage);
    }
  }

  /**
   * Utility: Estimate encrypted size for UI progress indicators
   */
  public static estimateEncryptedSize(originalSize: number): number {
    // Seal encryption typically adds ~100-200 bytes of overhead
    return originalSize + 150;
  }

  /**
   * Utility: Convert base64 to Uint8Array
   */
  public static base64ToUint8Array(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Utility: Convert Uint8Array to base64
   */
  public static uint8ArrayToBase64(bytes: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}

/**
 * Factory function to create SealService instance
 */
export function createSealService(suiClient: SuiClient, currentAccount: WalletAccount): SealService {
  return new SealService(suiClient, currentAccount);
}