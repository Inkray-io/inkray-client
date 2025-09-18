import { SuiClient } from '@mysten/sui/client';
import { WalletAccount } from '@mysten/wallet-standard';
import { Transaction } from '@mysten/sui/transactions';
import { WalrusClient, WalrusFile } from '@mysten/walrus';
import { CONFIG } from './config';

/**
 * Simplified Walrus client following official SDK documentation
 * https://sdk.mystenlabs.com/walrus#writing-files-in-browser-environments
 */

export interface UploadOptions {
  epochs?: number;
  deletable?: boolean;
  onProgress?: (step: 'encode' | 'register' | 'upload' | 'certify', progress: number) => void;
}

export interface WalrusSignAndExecute {
  (args: { transaction: Transaction }): Promise<{ digest: string }>;
}

export interface UploadResult {
  blobId: string;
  blobObjectId: string;
  size: number;
  storageEndEpoch: number;
}

/**
 * Simplified Walrus client following official SDK example
 * https://sdk.mystenlabs.com/walrus#writing-files-in-browser-environments
 */
export class InkrayWalrusClient {
  private walrusClient: WalrusClient | null = null;
  private suiClient: SuiClient;
  private currentAccount?: WalletAccount | null;
  private signAndExecuteTransaction?: WalrusSignAndExecute;

  constructor(
    suiClient: SuiClient,
    currentAccount?: WalletAccount | null,
    signAndExecuteTransaction?: WalrusSignAndExecute
  ) {
    this.suiClient = suiClient;
    this.currentAccount = currentAccount;
    this.signAndExecuteTransaction = signAndExecuteTransaction;
  }

  /**
   * Initialize Walrus client following official SDK pattern
   */
  private getWalrusClient(): WalrusClient {
    if (!this.walrusClient) {
      if (typeof window === 'undefined') {
        throw new Error('Walrus client can only be used in browser environments');
      }

      try {
        this.walrusClient = new WalrusClient({
          network: CONFIG.NETWORK === 'mainnet' ? 'mainnet' : 'testnet',
          suiClient: this.suiClient,
          wasmUrl: 'https://unpkg.com/@mysten/walrus-wasm@latest/web/walrus_wasm_bg.wasm',
        });

        console.log(`✅ Walrus client initialized for ${CONFIG.NETWORK}`);
      } catch (error) {
        throw new Error(`Failed to initialize Walrus client: ${error}`);
      }
    }
    return this.walrusClient;
  }

  /**
   * Upload blob following official SDK pattern
   * https://sdk.mystenlabs.com/walrus#writing-files-in-browser-environments
   */
  async uploadBlob(
    content: Uint8Array,
    filename: string,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    if (!this.currentAccount) {
      throw new Error('Wallet account required. Please connect your wallet.');
    }

    if (!this.signAndExecuteTransaction) {
      throw new Error('signAndExecuteTransaction function required.');
    }

    try {
      console.log(`📤 Starting Walrus upload: ${filename} (${content.length} bytes)`);

      // Step 1: Create file and flow
      const walrusClient = this.getWalrusClient();

      const file = WalrusFile.from({
        contents: new TextEncoder().encode('my awesome file'),
        identifier: 'my_awesome_file.txt',
      });

      const flow = walrusClient.writeFilesFlow({
        files: [file],
      });

      // Step 2: Encode
      options.onProgress?.('encode', 0);
      console.log('📝 Encoding file...');
      await flow.encode();
      options.onProgress?.('encode', 100);
      console.log('✅ File encoded successfully');

      // Step 3: Register
      options.onProgress?.('register', 0);
      console.log('🔗 Registering blob on-chain...');
      const registerTx = flow.register({
        epochs: options.epochs || 1,
        owner: this.currentAccount.address,
        deletable: options.deletable || false,
      });

      const { digest } = await this.signAndExecuteTransaction({
        transaction: registerTx
      });
      console.log(`✅ Blob registered with transaction: ${digest}`);
      options.onProgress?.('register', 100);

      // Step 4: Upload to storage nodes
      options.onProgress?.('upload', 0);
      console.log('☁️ Uploading to storage nodes...');
      await flow.upload({ digest });
      console.log('✅ Content uploaded to storage nodes');
      options.onProgress?.('upload', 100);

      // Step 5: Certify
      options.onProgress?.('certify', 0);
      console.log('📋 Certifying blob...');
      const certifyTx = flow.certify();
      await this.signAndExecuteTransaction({
        transaction: certifyTx
      });
      console.log('✅ Blob certified');
      options.onProgress?.('certify', 100);

      // Step 6: Get result
      console.log('📋 Getting upload result...');
      const files = await flow.listFiles();

      if (!files || files.length === 0) {
        throw new Error('No files returned after upload completion.');
      }

      const uploadedFile = files[0];
      const result: UploadResult = {
        blobId: uploadedFile.blobId,
        blobObjectId: uploadedFile.blobObject?.id?.id || '',
        size: uploadedFile.blobObject?.size ? parseInt(uploadedFile.blobObject.size) : 0,
        storageEndEpoch: uploadedFile.blobObject?.storage?.end_epoch || 0,
      };

      console.log(`🎉 Walrus upload completed successfully!`);
      console.log(`  Blob ID: ${result.blobId}`);
      console.log(`  Size: ${result.size} bytes`);
      console.log(`  Storage end epoch: ${result.storageEndEpoch}`);

      return result;
    } catch (error) {
      console.error('❌ Walrus upload failed:', error);
      throw new Error(`Upload failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }


  /**
   * Download blob from Walrus storage
   */
  async downloadBlob(blobId: string): Promise<Uint8Array> {
    if (!blobId) {
      throw new Error('Invalid blob ID provided');
    }

    try {
      console.log(`📥 Downloading blob from Walrus: ${blobId}`);

      const walrusClient = this.getWalrusClient();
      const quilt = await walrusClient.getBlob({ blobId });

      if (!quilt) {
        throw new Error(`Could not retrieve blob ${blobId}. The blob may not exist or may have expired.`);
      }

      const [content] = await quilt.files();


      // console.log('iden', await content.getIdentifier());
      // console.log('tags', await content.getTags());
      // console.log('content:', new TextDecoder().decode(await content.bytes()));

      // Convert to Uint8Array
      let arrayBuffer: Uint8Array;
      if (content instanceof Uint8Array) {
        arrayBuffer = content;
      } else if (content && typeof (content as Blob).arrayBuffer === 'function') {
        const buffer = await (content as Blob).arrayBuffer();
        arrayBuffer = new Uint8Array(buffer);
      } else {
        arrayBuffer = await content.bytes();
      }

      console.log(`✅ Walrus download successful: ${arrayBuffer.length} bytes`);
      return arrayBuffer;
    } catch (error) {
      console.error('❌ Walrus download failed:', error);
      throw new Error(`Download failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

/**
 * Create a configured Walrus client instance
 */
export const createWalrusClient = (
  suiClient: SuiClient,
  account?: WalletAccount | null,
  signAndExecuteTransaction?: WalrusSignAndExecute
): InkrayWalrusClient => {
  return new InkrayWalrusClient(suiClient, account, signAndExecuteTransaction);
};