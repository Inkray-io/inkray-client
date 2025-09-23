import { CONFIG } from './config';

/**
 * Shared Seal Configuration Module
 * 
 * Centralizes all Seal-related configuration including:
 * - Key server IDs for different networks
 * - Environment variable handling
 * - Package ID validation
 * - Network-specific settings
 */

export type SealNetwork = 'testnet' | 'mainnet' | 'devnet' | 'localnet';

export interface SealServerConfig {
  objectId: string;
  weight: number;
}

/**
 * Key server configurations for different networks
 * These should be updated with actual production key server IDs
 */
const KEY_SERVER_CONFIGS: Record<SealNetwork, string[]> = {
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

/**
 * Get key server IDs for the specified network
 * Supports environment variable override via NEXT_PUBLIC_SEAL_KEY_SERVER_IDS
 */
export function getKeyServerIds(network?: SealNetwork): string[] {
  const targetNetwork = network || CONFIG.NETWORK as SealNetwork;
  const servers = KEY_SERVER_CONFIGS[targetNetwork] || KEY_SERVER_CONFIGS.testnet;

  // Check if configured from environment
  if (CONFIG.SEAL_KEY_SERVER_IDS) {
    const envServers = CONFIG.SEAL_KEY_SERVER_IDS.split(',').map(id => id.trim());
    if (envServers.length > 0 && envServers[0] !== '') {
      console.log(`🔧 Using key servers from environment: ${envServers.length} servers`);
      return envServers;
    }
  }

  console.log(`🔧 Using default key servers for ${targetNetwork}: ${servers.length} servers`);
  return servers;
}

/**
 * Get key server configurations with weights for SealClient
 */
export function getKeyServerConfigs(network?: SealNetwork): SealServerConfig[] {
  const serverIds = getKeyServerIds(network);
  return serverIds.map((id) => ({
    objectId: id,
    weight: 1,
  }));
}

/**
 * Validate package ID format
 */
export function validatePackageId(packageId: string): boolean {
  return /^0x[a-fA-F0-9]{60,64}$/.test(packageId);
}

/**
 * Validate that Seal is properly configured
 */
export function validateSealConfiguration(): { isValid: boolean; error?: string } {
  // Check package ID
  if (!CONFIG.PACKAGE_ID || CONFIG.PACKAGE_ID === '0x0000000000000000000000000000000000000000000000000000000000000000') {
    return {
      isValid: false,
      error: 'Package ID not configured'
    };
  }

  if (!validatePackageId(CONFIG.PACKAGE_ID)) {
    return {
      isValid: false,
      error: 'Invalid package ID format. Must be a valid Sui package ID.'
    };
  }

  // Check key servers
  const servers = getKeyServerIds();
  if (servers.length === 0) {
    return {
      isValid: false,
      error: `No key servers configured for network: ${CONFIG.NETWORK}`
    };
  }

  return { isValid: true };
}

/**
 * Get Seal configuration status for debugging
 */
export function getSealConfigStatus() {
  const validation = validateSealConfiguration();
  const servers = getKeyServerIds();
  
  return {
    network: CONFIG.NETWORK,
    packageId: CONFIG.PACKAGE_ID,
    keyServerCount: servers.length,
    keyServers: servers,
    isValid: validation.isValid,
    error: validation.error,
    hasEnvironmentOverride: !!CONFIG.SEAL_KEY_SERVER_IDS,
  };
}

/**
 * Default encryption threshold (number of key servers required)
 */
export const DEFAULT_ENCRYPTION_THRESHOLD = 2;

/**
 * Default session key TTL in minutes (1 month)
 */
export const DEFAULT_SESSION_KEY_TTL_MINUTES = 43200; // 30 days * 24 hours * 60 minutes