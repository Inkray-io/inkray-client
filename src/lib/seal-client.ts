import { SuiClient } from '@mysten/sui/client';
import { WalletAccount } from '@mysten/wallet-standard';
import { bcs } from '@mysten/bcs';
import { SealClient, SessionKey } from '@mysten/seal';
import { Transaction } from '@mysten/sui/transactions';
import { createHash } from 'crypto';
import { CONFIG } from './config';

// Extended wallet account interface with signing capabilities
interface SigningWalletAccount extends WalletAccount {
  signPersonalMessage?: (message: Uint8Array) => Promise<{ signature: string }>;
}

// Types for client configurations
export interface SealClientConfig {
  suiClient: SuiClient;
  account?: WalletAccount | null;
  network: 'testnet' | 'mainnet' | 'devnet' | 'localnet';
  packageId: string;
  keyServerUrl?: string;
}

export interface SealEncryptionOptions {
  contentId: string | Uint8Array;
  packageId?: string;
  threshold?: number;
}

export interface UserCredentials {
  publicationOwner?: {
    ownerCapId: string;
    publicationId: string;
  };
  contributor?: {
    publicationId: string;
    contentPolicyId?: string;
  };
  subscription?: {
    id: string;
    serviceId: string;
  };
  nft?: {
    id: string;
    articleId: string;
  };
  allowlist?: {
    contentPolicyId: string;
  };
}

export interface SealDecryptionRequest {
  encryptedData: Uint8Array;
  contentId: string | Uint8Array;
  credentials: UserCredentials;
  packageId?: string;
  requestingClient?: unknown;
}

// IdV1 constants matching smart contract
const TAG_ARTICLE_CONTENT = 0;  // u8
const ID_VERSION_V1 = 1;        // u16

// BCS layout for IdV1 struct
const IdV1Layout = bcs.struct('IdV1', {
  tag: bcs.u8(),
  version: bcs.u16(),
  publication: bcs.fixedArray(32, bcs.u8()),  // 32-byte Sui address
  article: bcs.fixedArray(32, bcs.u8()),      // 32-byte Sui address
  nonce: bcs.u64(),
});

/**
 * Real Seal client for content-identity based encryption
 * Adapted from contracts/scripts/src/utils/seal-client.ts
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
      // Import key server configuration
      const { getKeyServerIds } = await import('./config');
      const serverObjectIds = getKeyServerIds();

      try {
        this.sealClient = new SealClient({
          suiClient: this.config.suiClient,
          serverConfigs: serverObjectIds.map((id) => ({
            objectId: id,
            weight: 1,
          })),
          verifyKeyServers: false, // Set to true for production
        });
      } catch (error) {
        throw new Error(`Seal encryption failed: Could not initialize Seal client. Key servers may be unavailable. Error: ${error}`);
      }
    }

    return this.sealClient;
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
   * Encrypt content with content-specific identity
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

      console.log(`  Content ID: ${options.contentId instanceof Uint8Array ? '[BCS bytes]' : options.contentId}`);
      console.log(`  Package ID: ${packageId}`);
      console.log(`  Threshold: ${threshold} key servers`);

      // Convert Uint8Array to hex string for Seal API
      const idForSeal = options.contentId instanceof Uint8Array
        ? '0x' + Array.from(options.contentId).map(b => b.toString(16).padStart(2, '0')).join('')
        : options.contentId;

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

  // === HELPER METHODS ===

  /**
   * Validate Sui address format (exactly 32 bytes = 64 hex chars + 0x)
   */
  private isValidSuiAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{64}$/.test(address);
  }

  /**
   * Convert hex address string to byte array
   */
  private addressToBytes(address: string): number[] {
    if (!this.isValidSuiAddress(address)) {
      throw new Error(`Invalid Sui address format: ${address}`);
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
   * Generate deterministic article address from inputs
   */
  private generateDeterministicArticleAddress(
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
   */
  generateArticleContentId(
    publicationId: string,
    articleTitle: string
  ): Uint8Array {
    // Validate publication ID format
    if (!this.isValidSuiAddress(publicationId)) {
      throw new Error(`Invalid Sui address format for publication: ${publicationId}`);
    }

    const timestamp = Date.now();

    // Generate deterministic article address
    const articleAddress = this.generateDeterministicArticleAddress(
      publicationId,
      articleTitle,
      timestamp
    );

    // Create IdV1 struct
    const idV1 = {
      tag: TAG_ARTICLE_CONTENT,     // 0
      version: ID_VERSION_V1,       // 1
      publication: this.addressToBytes(publicationId),
      article: this.addressToBytes(articleAddress),
      nonce: BigInt(timestamp)
    };

    // BCS encode to bytes
    const encodedBytes = IdV1Layout.serialize(idV1).toBytes();
    
    return encodedBytes;
  }

  // === DECRYPTION METHODS ===

  /**
   * Decrypt content by trying available user credentials
   */
  async decryptContent(request: SealDecryptionRequest): Promise<Uint8Array> {
    try {
      console.log(`🔓 Attempting to decrypt content with Seal`);

      // Try each available credential type until one succeeds
      const credentials = request.credentials;
      const packageId = request.packageId || this.config.packageId;

      if (!packageId) {
        throw new Error('Seal decryption failed: Package ID not configured. Set NEXT_PUBLIC_PACKAGE_ID environment variable.');
      }

      if (!this.config.account) {
        throw new Error('Seal decryption failed: Wallet account required for decryption. Please connect your wallet.');
      }

      // Try publication owner access first (most direct)
      if (credentials.publicationOwner) {
        console.log('👑 Trying publication owner access...');
        try {
          return await this.tryDecryptWithPublicationOwner(
            request.encryptedData,
            request.contentId,
            credentials.publicationOwner,
            packageId
          );
        } catch (error: unknown) {
          console.log(`  Publication owner access failed: ${(error as Error)?.message || error}`);
        }
      }

      // Try subscription access
      if (credentials.subscription) {
        console.log('🎫 Trying subscription access...');
        try {
          return await this.tryDecryptWithSubscription(
            request.encryptedData,
            request.contentId,
            credentials.subscription,
            packageId
          );
        } catch (error: unknown) {
          console.log(`  Subscription access failed: ${(error as Error)?.message || error}`);
        }
      }

      // Try NFT access
      if (credentials.nft) {
        console.log('🎨 Trying NFT access...');
        try {
          return await this.tryDecryptWithNFT(
            request.encryptedData,
            request.contentId,
            credentials.nft,
            packageId
          );
        } catch (error: unknown) {
          console.log(`  NFT access failed: ${(error as Error)?.message || error}`);
        }
      }

      // Try contributor access
      if (credentials.contributor) {
        console.log('✍️ Trying contributor access...');
        try {
          return await this.tryDecryptWithContributor(
            request.encryptedData,
            request.contentId,
            credentials.contributor,
            packageId
          );
        } catch (error: unknown) {
          console.log(`  Contributor access failed: ${(error as Error)?.message || error}`);
        }
      }

      // No valid credentials found
      const availableCredentialTypes = Object.keys(credentials).join(', ');
      throw new Error(`Seal decryption failed: No valid access method found for this content. Available credentials: ${availableCredentialTypes}. You may not have permission to read this encrypted article.`);
    } catch (error) {
      console.error(`❌ Seal decryption failed: ${error}`);
      throw error;
    }
  }

  // === INDIVIDUAL POLICY DECRYPTION METHODS ===

  private async tryDecryptWithPublicationOwner(
    encryptedData: Uint8Array,
    contentId: string | Uint8Array,
    publicationOwner: NonNullable<UserCredentials['publicationOwner']>,
    packageId: string
  ): Promise<Uint8Array> {
    if (!this.config.account) {
      throw new Error('Wallet account required for decryption');
    }

    const sealClient = await this.getSealClient();
    const sessionKey = await this.getSessionKey(this.config.account.address, packageId);

    // Sign the session key message
    if (this.config.account && 'signPersonalMessage' in this.config.account) {
      const message = sessionKey.getPersonalMessage();
      const signature = await (this.config.account as SigningWalletAccount).signPersonalMessage!(message);
      sessionKey.setPersonalMessageSignature(signature.signature);
    }

    const tx = new Transaction();

    // Convert content ID to bytes correctly
    let contentIdBytes: number[];
    if (contentId instanceof Uint8Array) {
      contentIdBytes = Array.from(contentId);
    } else if (contentId.startsWith('0x')) {
      const hexStr = contentId.substring(2);
      contentIdBytes = [];
      for (let i = 0; i < hexStr.length; i += 2) {
        contentIdBytes.push(parseInt(hexStr.substr(i, 2), 16));
      }
    } else {
      contentIdBytes = Array.from(new TextEncoder().encode(contentId));
    }

    tx.moveCall({
      target: `${packageId}::policy::seal_approve_roles`,
      arguments: [
        tx.pure.vector('u8', contentIdBytes),
        tx.object(publicationOwner.publicationId),
      ]
    });

    const txBytes = await tx.build({
      client: this.config.suiClient,
      onlyTransactionKind: true
    });
    
    const decrypted = await sealClient.decrypt({
      data: encryptedData,
      sessionKey,
      txBytes,
    });

    console.log('✅ Decrypted with publication owner access');
    return decrypted;
  }

  private async tryDecryptWithSubscription(
    encryptedData: Uint8Array,
    contentId: string | Uint8Array,
    subscription: NonNullable<UserCredentials['subscription']>,
    packageId: string
  ): Promise<Uint8Array> {
    if (!this.config.account) {
      throw new Error('Wallet account required for decryption');
    }

    const sealClient = await this.getSealClient();
    const sessionKey = await this.getSessionKey(this.config.account.address, packageId);

    // Sign the session key message
    if (this.config.account && 'signPersonalMessage' in this.config.account) {
      const message = sessionKey.getPersonalMessage();
      const signature = await (this.config.account as SigningWalletAccount).signPersonalMessage!(message);
      sessionKey.setPersonalMessageSignature(signature.signature);
    }

    const tx = new Transaction();
    const contentIdBytes = contentId instanceof Uint8Array
      ? Array.from(contentId)
      : Array.from(new TextEncoder().encode(contentId));

    tx.moveCall({
      target: `${packageId}::platform_access::seal_approve`,
      arguments: [
        tx.pure.vector('u8', contentIdBytes),
        tx.object(subscription.id),
        tx.object(subscription.serviceId),
        tx.object('0x6'), // Clock object
      ]
    });

    const txBytes = await tx.build({
      client: this.config.suiClient,
      onlyTransactionKind: true
    });

    const decrypted = await sealClient.decrypt({
      data: encryptedData,
      sessionKey,
      txBytes,
    });

    console.log('✅ Decrypted with subscription access');
    return decrypted;
  }

  private async tryDecryptWithNFT(
    encryptedData: Uint8Array,
    contentId: string | Uint8Array,
    nft: NonNullable<UserCredentials['nft']>,
    packageId: string
  ): Promise<Uint8Array> {
    if (!this.config.account) {
      throw new Error('Wallet account required for decryption');
    }

    const sealClient = await this.getSealClient();
    const sessionKey = await this.getSessionKey(this.config.account.address, packageId);

    // Sign the session key message
    if (this.config.account && 'signPersonalMessage' in this.config.account) {
      const message = sessionKey.getPersonalMessage();
      const signature = await (this.config.account as SigningWalletAccount).signPersonalMessage!(message);
      sessionKey.setPersonalMessageSignature(signature.signature);
    }

    const tx = new Transaction();
    const contentIdBytes = contentId instanceof Uint8Array
      ? Array.from(contentId)
      : Array.from(new TextEncoder().encode(contentId));

    tx.moveCall({
      target: `${packageId}::article_nft::seal_approve`,
      arguments: [
        tx.pure.vector('u8', contentIdBytes),
        tx.object(nft.id),
        tx.object(nft.articleId),
      ]
    });

    const txBytes = await tx.build({
      client: this.config.suiClient,
      onlyTransactionKind: true
    });

    const decrypted = await sealClient.decrypt({
      data: encryptedData,
      sessionKey,
      txBytes,
    });

    console.log('✅ Decrypted with NFT access');
    return decrypted;
  }

  private async tryDecryptWithContributor(
    encryptedData: Uint8Array,
    contentId: string | Uint8Array,
    contributor: NonNullable<UserCredentials['contributor']>,
    packageId: string
  ): Promise<Uint8Array> {
    if (!this.config.account) {
      throw new Error('Wallet account required for decryption');
    }

    const sealClient = await this.getSealClient();
    const sessionKey = await this.getSessionKey(this.config.account.address, packageId);

    // Sign the session key message
    if (this.config.account && 'signPersonalMessage' in this.config.account) {
      const message = sessionKey.getPersonalMessage();
      const signature = await (this.config.account as SigningWalletAccount).signPersonalMessage!(message);
      sessionKey.setPersonalMessageSignature(signature.signature);
    }

    const tx = new Transaction();
    const contentIdBytes = contentId instanceof Uint8Array
      ? Array.from(contentId)
      : Array.from(new TextEncoder().encode(contentId));

    tx.moveCall({
      target: `${packageId}::policy::seal_approve_roles`,
      arguments: [
        tx.pure.vector('u8', contentIdBytes),
        tx.object(contributor.publicationId),
      ]
    });

    const txBytes = await tx.build({
      client: this.config.suiClient,
      onlyTransactionKind: true
    });

    const decrypted = await sealClient.decrypt({
      data: encryptedData,
      sessionKey,
      txBytes,
    });

    console.log('✅ Decrypted with contributor access');
    return decrypted;
  }

}

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