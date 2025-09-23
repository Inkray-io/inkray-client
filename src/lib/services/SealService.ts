import { SuiClient } from '@mysten/sui/client';
import { WalletAccount } from '@mysten/wallet-standard';
import { Transaction } from '@mysten/sui/transactions';
import { SealClient, SessionKey, EncryptedObject } from '@mysten/seal';
import { fromHex, toBase64 } from '@mysten/bcs';
import { generateArticleContentId, generateMediaContentId, contentIdToHex } from '../seal-identity';
import { getSealClient, type InkraySealClient } from '../seal-client';
import { CONFIG } from '../config';
import { getCachedSessionKey, setCachedSessionKey } from '../cache-manager';

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

      // Convert encrypted data back to base64 for transport using Mysten's BCS utilities
      const encryptedBase64 = toBase64(encryptedData);

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
   * Create or restore session key for decryption with caching
   */
  private async createSessionKey(signMessage?: (message: Uint8Array) => Promise<string>): Promise<SessionKey> {
    // Try to get cached session key first
    const cachedSessionKeyData = getCachedSessionKey();

    if (cachedSessionKeyData) {
      console.log('🔑 Found cached session key, attempting to restore...');
      try {
        const restoredSessionKey = SessionKey.import(
          cachedSessionKeyData.exportedSessionKey,
          this.suiClient
        );

        // Check if the session key is still valid
        if (!restoredSessionKey.isExpired()) {
          console.log('✅ Restored valid session key from cache');
          return restoredSessionKey;
        } else {
          console.log('⏰ Cached session key expired, creating new one');
        }
      } catch (error) {
        console.warn('⚠️ Failed to restore session key from cache:', error);
      }
    }

    console.log('🔑 Creating new session key with 1-month TTL...');
    const sessionKey = await SessionKey.create({
      address: this.currentAccount.address,
      packageId: CONFIG.PACKAGE_ID,
      ttlMin: 30,
      suiClient: this.suiClient,
    });

    // If we have a sign function, sign the message and cache the session key
    if (signMessage) {
      const message = sessionKey.getPersonalMessage();
      const signature = await signMessage(message);
      await sessionKey.setPersonalMessageSignature(signature);

      // Export and cache the signed session key
      try {
        const exportedSessionKey = sessionKey.export();
        setCachedSessionKey(exportedSessionKey);
        console.log('✅ New session key created and cached');
      } catch (error) {
        console.warn('⚠️ Failed to cache session key:', error);
      }
    }

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
        tx.pure.vector('u8', contentIdBytes),
        tx.object(articleId),
      ]
    });

    return tx;
  }

  /**
   * Decrypt content using Seal protocol (with comprehensive tracing for debugging)
   */
  public async decryptContent(
    params: DecryptionParams,
    signMessage: (message: Uint8Array) => Promise<string>
  ): Promise<string> {
    const traceId = `seal-decrypt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    console.group(`🔍 SEAL DECRYPT TRACE [${traceId}] - ${new Date().toISOString()}`);

    try {
      // Phase 1: Input Parameter Logging
      console.log('📊 Input Parameters:', {
        encryptedDataLength: params.encryptedData?.length || 0,
        encryptedDataType: params.encryptedData?.constructor?.name || 'undefined',
        encryptedDataPreview: params.encryptedData ?
          Array.from(params.encryptedData.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(' ') : 'null',
        contentId: params.contentId,
        contentIdLength: params.contentId?.length || 0,
        articleId: params.articleId,
        hasSignMessageFunction: typeof signMessage === 'function'
      });

      // Enhanced input validation with tracing
      console.log('🔍 Step 1: Input validation...');
      if (!params.contentId || params.contentId.length === 0) {
        console.error('❌ Content ID validation failed: empty or null');
        throw new Error('Invalid content ID: empty or null');
      }

      if (!params.contentId.startsWith('0x')) {
        console.error('❌ Content ID validation failed: missing 0x prefix');
        throw new Error('Content ID must be a hex string starting with 0x');
      }

      if (!params.articleId || !/^0x[a-fA-F0-9]{64}$/.test(params.articleId)) {
        console.error('❌ Article ID validation failed:', params.articleId);
        throw new Error('Invalid article ID format. Must be a valid Sui object ID.');
      }
      console.log('✅ Input validation passed');

      // Phase 1.5: BCS Validation of encrypted data
      console.log('🔍 Step 1.5: BCS validation of encrypted data...');
      try {
        const encObj = EncryptedObject.parse(params.encryptedData);
        console.log('📝 BCS validation result:', {
          isValid: true,
          contentIdFromObject: encObj.id,
          expectedContentId: params.contentId,
          idsMatch: encObj.id === params.contentId,
          objectSize: params.encryptedData.length,
          objectPreview: Array.from(params.encryptedData.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(' ')
        });

        if (encObj.id !== params.contentId) {
          console.warn('⚠️ Content ID mismatch detected!', {
            fromEncryptedObject: encObj.id,
            fromParameters: params.contentId,
            recommendation: 'Verify that the correct content ID is being passed to decryption'
          });
        } else {
          console.log('✅ Content ID validation passed - IDs match');
        }
      } catch (bcsError) {
        console.error('❌ BCS validation failed!', {
          error: bcsError,
          errorMessage: bcsError instanceof Error ? bcsError.message : 'Unknown BCS error',
          dataLength: params.encryptedData.length,
          dataPreview: Array.from(params.encryptedData.slice(0, 32)).map(b => b.toString(16).padStart(2, '0')).join(' '),
          recommendation: 'Check that encrypted data is properly decoded from Base64/hex before passing to decrypt()'
        });
        throw new Error(`BCS validation failed: ${bcsError instanceof Error ? bcsError.message : 'Invalid encrypted object format'}`);
      }

      // Phase 2: Content ID Conversion with detailed logging
      console.log('🔍 Step 2: Converting content ID from hex...');
      console.log('📝 Before conversion:', {
        contentIdHex: params.contentId,
        hexLength: params.contentId.length,
        expectedFormat: '0x followed by hex characters'
      });

      const contentIdBytes = fromHex(params.contentId);

      console.log('📝 After fromHex conversion:', {
        contentIdBytesLength: contentIdBytes.length,
        contentIdBytesType: contentIdBytes.constructor.name,
        contentIdBytesPreview: Array.from(contentIdBytes.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(' '),
        expectedLength: 43, // tag(1) + version(2) + address(32) + nonce(8)
        actualBytes: Array.from(contentIdBytes)
      });

      if (contentIdBytes.length !== 43) {
        console.warn('⚠️  Unexpected content ID length! Expected 43 bytes, got:', contentIdBytes.length);
      }

      // Phase 3: Key Server Configuration Logging
      console.log('🔍 Step 3: Getting key server configuration...');
      const serverObjectIds = this.getKeyServerIds();
      console.log('📝 Key servers:', {
        network: CONFIG.NETWORK,
        serverCount: serverObjectIds.length,
        serverIds: serverObjectIds,
        packageId: CONFIG.PACKAGE_ID
      });

      if (serverObjectIds.length === 0) {
        console.error('❌ No key servers configured for network:', CONFIG.NETWORK);
        throw new Error(`No key servers configured for network: ${CONFIG.NETWORK}`);
      }

      // Phase 4: Seal Client Initialization Logging
      console.log('🔍 Step 4: Initializing Seal client...');
      const sealClientConfig = {
        suiClient: !!this.suiClient,
        serverConfigs: serverObjectIds.map((id) => ({
          objectId: id,
          weight: 1,
        })),
        verifyKeyServers: false,
      };
      console.log('📝 Seal client configuration:', sealClientConfig);

      const sealClient = new SealClient({
        suiClient: this.suiClient,
        serverConfigs: serverObjectIds.map((id) => ({
          objectId: id,
          weight: 1,
        })),
        verifyKeyServers: false,
      });
      console.log('✅ Seal client initialized');

      // Phase 5: Session Key Creation/Restoration Logging
      console.log('🔍 Step 5: Creating or restoring session key...');
      console.log('📝 Session key parameters:', {
        address: this.currentAccount.address,
        packageId: CONFIG.PACKAGE_ID,
        ttlMin: 43200, // 1 month
        hasSuiClient: !!this.suiClient
      });

      const sessionKey = await this.createSessionKey(signMessage);
      console.log('✅ Session key ready (created or restored from cache)');

      // Phase 6: Transaction Building Logging
      console.log('🔍 Step 7: Building approval transaction...');
      console.log('📝 Transaction parameters:', {
        target: `${CONFIG.PACKAGE_ID}::policy::seal_approve_free`,
        contentIdBytesLength: contentIdBytes.length,
        contentIdBytesArray: Array.from(contentIdBytes),
        articleId: params.articleId
      });

      const tx = this.buildApprovalTransaction(contentIdBytes, params.articleId);
      console.log('✅ Transaction built');

      // Build transaction bytes for Seal
      console.log('🔍 Step 7: Building transaction bytes...');
      const txBytes = await tx.build({
        client: this.suiClient,
        onlyTransactionKind: true
      });
      console.log('📝 Transaction bytes:', {
        txBytesLength: txBytes.length,
        txBytesType: txBytes.constructor.name,
        txBytesPreview: Array.from(txBytes.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(' ')
      });

      // Dry run with enhanced logging
      console.log('🔍 Step 8: Dry run transaction validation...');
      try {
        const dryRunResult = await this.suiClient.dryRunTransactionBlock({
          transactionBlock: txBytes,
        });

        console.log('📝 Dry run result:', {
          status: dryRunResult.effects.status.status,
          error: dryRunResult.effects.status.error || 'none'
        });

        if (dryRunResult.effects.status.status === 'failure') {
          const errorMsg = dryRunResult.effects.status.error || 'Unknown error';
          console.warn('⚠️  Dry run failed, but continuing with decryption:', errorMsg);
        } else {
          console.log('✅ Dry run passed');
        }
      } catch (dryRunError) {
        console.warn('⚠️  Dry run error (continuing anyway):', dryRunError);
      }

      // Phase 7: Critical Seal SDK Decrypt Call Logging
      console.log('🔍 Step 9: CALLING SEAL SDK DECRYPT - This is where the error likely occurs');
      console.log('📝 Seal decrypt parameters (CRITICAL):', {
        data: {
          type: params.encryptedData.constructor.name,
          length: params.encryptedData.length,
          preview: Array.from(params.encryptedData.slice(0, 32)).map(b => b.toString(16).padStart(2, '0')).join(' ')
        },
        sessionKey: {
          type: sessionKey.constructor.name,
          // Try to get any accessible properties safely
          properties: Object.getOwnPropertyNames(sessionKey).reduce((acc: Record<string, unknown>, prop) => {
            try {
              const value = (sessionKey as unknown as Record<string, unknown>)[prop];
              if (typeof value !== 'function') {
                acc[prop] = typeof value === 'object' ? Object.prototype.toString.call(value) : value;
              }
            } catch (e) {
              const error = e as Error;
              acc[prop] = `[Error accessing: ${error.message}]`;
            }
            return acc;
          }, {} as Record<string, unknown>)
        },
        txBytes: {
          type: txBytes.constructor.name,
          length: txBytes.length,
          preview: Array.from(txBytes.slice(0, 32)).map(b => b.toString(16).padStart(2, '0')).join(' ')
        }
      });

      // The actual Seal SDK call - this is where the error likely occurs
      console.log('🚀 About to call sealClient.decrypt() - MONITOR FOR ERRORS');
      const decrypted = await sealClient.decrypt({
        data: params.encryptedData,
        sessionKey,
        txBytes,
      });

      console.log('🎉 Seal decrypt SUCCESS!');
      console.log('📝 Decryption result:', {
        decryptedLength: decrypted.length,
        decryptedType: decrypted.constructor.name,
        decryptedPreview: Array.from(decrypted.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(' ')
      });

      // Convert decrypted bytes to string
      const decryptedContent = new TextDecoder().decode(decrypted);
      console.log('📝 Final decoded content:', {
        contentLength: decryptedContent.length,
        contentPreview: decryptedContent.substring(0, 100) + (decryptedContent.length > 100 ? '...' : '')
      });

      console.log('🎉 SEAL DECRYPT COMPLETE - SUCCESS');
      console.groupEnd();
      return decryptedContent;

    } catch (error) {
      // Enhanced error logging with full context
      console.error('💥 SEAL DECRYPT ERROR - FULL DEBUG CONTEXT:', {
        traceId,
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : 'No stack trace',
        errorConstructor: error?.constructor?.name || 'Unknown',
        inputParams: {
          encryptedDataLength: params.encryptedData?.length || 0,
          encryptedDataType: params.encryptedData?.constructor?.name || 'undefined',
          contentId: params.contentId,
          contentIdLength: params.contentId?.length || 0,
          articleId: params.articleId
        },
        environment: {
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Node.js',
          timestamp: new Date().toISOString(),
          network: CONFIG.NETWORK,
          packageId: CONFIG.PACKAGE_ID
        },
        sealContext: {
          currentStep: 'Unknown - check logs above for last successful step',
          accountAddress: this.currentAccount?.address || 'Not available'
        }
      });

      console.groupEnd();

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
    return toBase64(bytes);
  }
}

/**
 * Factory function to create SealService instance
 */
export function createSealService(suiClient: SuiClient, currentAccount: WalletAccount): SealService {
  return new SealService(suiClient, currentAccount);
}