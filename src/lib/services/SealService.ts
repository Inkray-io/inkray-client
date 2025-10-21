import { SuiClient } from '@mysten/sui/client';
import { WalletAccount } from '@mysten/wallet-standard';
import { Transaction } from '@mysten/sui/transactions';
import { SealClient, SessionKey, EncryptedObject } from '@mysten/seal';
import { fromHex, toBase64 } from '@mysten/bcs';
import { generateArticleContentId, generateMediaContentId, contentIdToHex } from '../seal-identity';
import { CONFIG } from '../config';
import { getCachedSessionKey, setCachedSessionKey } from '../cache-manager';
import {
  getKeyServerConfigs,
  validateSealConfiguration,
  DEFAULT_ENCRYPTION_THRESHOLD,
  DEFAULT_SESSION_KEY_TTL_MINUTES
} from '../seal-config';

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
  publicationId: string; // publication ID for subscription verification
  // Policy selection fields
  ownerCapId?: string; // Publication owner capability ID
  subscriptionId?: string; // User's subscription ID
  subscriptionPrice?: number; // Publication subscription price in MIST
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

  constructor(suiClient: SuiClient, currentAccount: WalletAccount) {
    this.suiClient = suiClient;
    this.currentAccount = currentAccount;
  }


  /**
   * Get encryption status and availability
   */
  public getEncryptionStatus(): EncryptionStatus {
    try {
      const validation = validateSealConfiguration();

      return {
        isAvailable: validation.isValid,
        network: CONFIG.NETWORK,
        packageId: CONFIG.PACKAGE_ID,
        error: validation.error
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

    // Use shared configuration validation
    const validation = validateSealConfiguration();
    if (!validation.isValid) {
      throw new Error(`Seal encryption not available: ${validation.error}`);
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

      // Create SealClient for encryption
      const serverConfigs = getKeyServerConfigs();
      const sealClient = new SealClient({
        suiClient: this.suiClient,
        serverConfigs,
        verifyKeyServers: false,
      });

      // Convert BCS-encoded content ID to hex string for Seal API
      const idForSeal = '0x' + Array.from(contentId)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      // Encrypt using Seal protocol
      const { encryptedObject: encryptedData } = await sealClient.encrypt({
        threshold: DEFAULT_ENCRYPTION_THRESHOLD,
        packageId: CONFIG.PACKAGE_ID,
        id: idForSeal,
        data: contentBytes,
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

      // Create SealClient for encryption
      const serverConfigs = getKeyServerConfigs();
      const sealClient = new SealClient({
        suiClient: this.suiClient,
        serverConfigs,
        verifyKeyServers: false,
      });

      // Convert BCS-encoded content ID to hex string for Seal API
      const idForSeal = '0x' + Array.from(contentId)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      // Encrypt using Seal protocol
      const { encryptedObject: encryptedData } = await sealClient.encrypt({
        threshold: DEFAULT_ENCRYPTION_THRESHOLD,
        packageId: CONFIG.PACKAGE_ID,
        id: idForSeal,
        data: contentBytes,
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
      ttlMin: DEFAULT_SESSION_KEY_TTL_MINUTES,
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
   * Build Move transaction for content access approval (smart policy selection)
   */
  private buildApprovalTransaction(contentIdBytes: Uint8Array, params: DecryptionParams): Transaction {
    console.log('🎯 POLICY SELECTION DEBUG:', {
      ownerCapId: params.ownerCapId,
      subscriptionPrice: params.subscriptionPrice,
      subscriptionId: params.subscriptionId,
      publicationId: params.publicationId,
      articleId: params.articleId
    });

    // Case 1: Publication Owner (highest priority)
    if (params.ownerCapId) {
      console.log('✅ Selected OWNER POLICY: seal_approve_publication_owner');
      return this.buildOwnerApprovalTransaction(contentIdBytes, params.ownerCapId, params.publicationId);
    }

    // Case 2: Publication Subscription (medium priority)
    if (params.subscriptionPrice && params.subscriptionPrice > 0 && params.subscriptionId) {
      console.log('✅ Selected SUBSCRIPTION POLICY: seal_approve_publication_subscription');
      return this.buildSubscriptionApprovalTransaction(contentIdBytes, params.subscriptionId, params.publicationId);
    }

    // Case 3: Free Content (fallback)
    console.log('✅ Selected FREE POLICY: seal_approve_free (fallback)');
    return this.buildFreeApprovalTransaction(contentIdBytes, params.publicationId);
  }

  /**
   * Build transaction for publication owner access
   */
  private buildOwnerApprovalTransaction(contentIdBytes: Uint8Array, ownerCapId: string, publicationId: string): Transaction {
    const tx = new Transaction();
    tx.moveCall({
      target: `${CONFIG.PACKAGE_ID}::policy::seal_approve_publication_owner`,
      arguments: [
        tx.pure.vector('u8', contentIdBytes),
        tx.object(ownerCapId),
        tx.object(publicationId),
      ]
    });
    return tx;
  }

  /**
   * Build transaction for publication subscription access
   */
  private buildSubscriptionApprovalTransaction(contentIdBytes: Uint8Array, subscriptionId: string, publicationId: string): Transaction {
    const tx = new Transaction();
    tx.moveCall({
      target: `${CONFIG.PACKAGE_ID}::policy::seal_approve_publication_subscription`,
      arguments: [
        tx.pure.vector('u8', contentIdBytes),
        tx.object(subscriptionId),
        tx.object(publicationId),
        tx.object('0x6'), // Clock object
        // Note: ctx is automatically passed by the transaction system
      ]
    });
    return tx;
  }

  /**
   * Build transaction for free content access
   */
  private buildFreeApprovalTransaction(contentIdBytes: Uint8Array, publicationId: string): Transaction {
    const tx = new Transaction();
    tx.moveCall({
      target: `${CONFIG.PACKAGE_ID}::policy::seal_approve_free`,
      arguments: [
        tx.pure.vector('u8', contentIdBytes),
        tx.object(publicationId),
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
      // Input validation
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

      // BCS Validation of encrypted data
      try {
        const encObj = EncryptedObject.parse(params.encryptedData);
        if (encObj.id !== params.contentId) {
          console.warn('⚠️ Content ID mismatch:', {
            fromEncryptedObject: encObj.id,
            fromParameters: params.contentId
          });
        }
      } catch (bcsError) {
        console.error('❌ BCS validation failed:', bcsError instanceof Error ? bcsError.message : 'Unknown BCS error');
        throw new Error(`BCS validation failed: ${bcsError instanceof Error ? bcsError.message : 'Invalid encrypted object format'}`);
      }

      // Convert content ID from hex
      const contentIdBytes = fromHex(params.contentId);
      if (contentIdBytes.length !== 43) {
        console.warn('⚠️ Unexpected content ID length:', contentIdBytes.length, 'expected 43 bytes');
      }

      // Get key server configuration
      const serverConfigs = getKeyServerConfigs();
      if (serverConfigs.length === 0) {
        console.error('❌ No key servers configured for network:', CONFIG.NETWORK);
        throw new Error(`No key servers configured for network: ${CONFIG.NETWORK}`);
      }

      const sealClient = new SealClient({
        suiClient: this.suiClient,
        serverConfigs,
        verifyKeyServers: false,
      });

      // Create or restore session key
      const sessionKey = await this.createSessionKey(signMessage);

      // Phase 6: Transaction Building Logging
      console.log('🔍 Step 6: Building approval transaction...');
      console.log('📝 Policy selection input parameters:', {
        contentIdBytesLength: contentIdBytes.length,
        contentIdBytesArray: Array.from(contentIdBytes),
        articleId: params.articleId,
        publicationId: params.publicationId,
        ownerCapId: params.ownerCapId,
        subscriptionPrice: params.subscriptionPrice,
        subscriptionId: params.subscriptionId
      });

      const tx = this.buildApprovalTransaction(contentIdBytes, params);
      console.log('✅ Transaction built successfully');
      
      // Log the actual transaction details
      try {
        const txJSON = await tx.toJSON();
        const parsedTx = typeof txJSON === 'string' ? JSON.parse(txJSON) : txJSON;
        console.log('📝 Built transaction details:', {
          transactions: parsedTx.transactions?.length || 0,
          inputs: parsedTx.inputs?.length || 0,
          gasConfig: parsedTx.gasConfig
        });
      } catch (jsonError) {
        console.warn('⚠️ Could not serialize transaction to JSON:', jsonError);
      }

      // Build transaction bytes for Seal
      const txBytes = await tx.build({
        client: this.suiClient,
        onlyTransactionKind: true
      });

      // Decrypt using Seal SDK
      const decrypted = await sealClient.decrypt({
        data: params.encryptedData,
        sessionKey,
        txBytes,
      });

      // Convert decrypted bytes to string
      const decryptedContent = new TextDecoder().decode(decrypted);
      console.log('✅ SEAL DECRYPT SUCCESS - Content length:', decryptedContent.length);
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