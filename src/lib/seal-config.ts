import { CONFIG } from './config';
import { log } from './utils/Logger';

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
  aggregatorUrl?: string;
}

/**
 * Key server configurations for different networks
 * Using decentralized committee key servers (MPC with distributed key generation).
 * Each entry uses a single committee object ID + aggregator URL instead of multiple independent servers.
 */
interface NetworkKeyServerConfig {
  objectId: string;
  aggregatorUrl: string;
}

const KEY_SERVER_CONFIGS: Record<SealNetwork, NetworkKeyServerConfig> = {
  testnet: {
    objectId: '0xb012378c9f3799fb5b1a7083da74a4069e3c3f1c93de0b27212a5799ce1e1e98',
    aggregatorUrl: 'https://seal-aggregator-testnet.mystenlabs.com',
  },
  mainnet: {
    objectId: '0x0000000000000000000000000000000000000000000000000000000000000000',
    aggregatorUrl: '',
  },
  devnet: {
    objectId: '0x0000000000000000000000000000000000000000000000000000000000000000',
    aggregatorUrl: '',
  },
  localnet: {
    objectId: '0x0000000000000000000000000000000000000000000000000000000000000000',
    aggregatorUrl: '',
  },
};

/**
 * Get the key server config for the specified network
 * Supports environment variable override via NEXT_PUBLIC_SEAL_KEY_SERVER_IDS
 */
export function getNetworkKeyServerConfig(network?: SealNetwork): NetworkKeyServerConfig {
  const targetNetwork = network || CONFIG.NETWORK as SealNetwork;
  const config = KEY_SERVER_CONFIGS[targetNetwork] || KEY_SERVER_CONFIGS.testnet;

  // Check if configured from environment (object ID and aggregator URL)
  if (CONFIG.SEAL_KEY_SERVER_IDS) {
    const envObjectId = CONFIG.SEAL_KEY_SERVER_IDS.trim();
    if (envObjectId) {
      log.debug('Using key server from environment', {
        objectId: envObjectId,
      }, 'SealConfig');
      return {
        objectId: envObjectId,
        aggregatorUrl: config.aggregatorUrl,
      };
    }
  }

  log.debug('Using default committee key server', {
    network: targetNetwork,
    objectId: config.objectId,
  }, 'SealConfig');
  return config;
}

/**
 * Get key server IDs for the specified network (convenience wrapper)
 */
export function getKeyServerIds(network?: SealNetwork): string[] {
  return [getNetworkKeyServerConfig(network).objectId];
}

/**
 * Get key server configurations with weights for SealClient
 * Includes aggregatorUrl for committee mode servers
 */
export function getKeyServerConfigs(network?: SealNetwork): SealServerConfig[] {
  const config = getNetworkKeyServerConfig(network);
  return [{
    objectId: config.objectId,
    weight: 1,
    aggregatorUrl: config.aggregatorUrl || undefined,
  }];
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

  // Check key server
  const config = getNetworkKeyServerConfig();
  if (!config.objectId || config.objectId === '0x0000000000000000000000000000000000000000000000000000000000000000') {
    return {
      isValid: false,
      error: `No committee key server configured for network: ${CONFIG.NETWORK}`
    };
  }

  if (!config.aggregatorUrl) {
    return {
      isValid: false,
      error: `No aggregator URL configured for network: ${CONFIG.NETWORK}`
    };
  }

  return { isValid: true };
}

/**
 * Get Seal configuration status for debugging
 */
export function getSealConfigStatus() {
  const validation = validateSealConfiguration();
  const config = getNetworkKeyServerConfig();

  return {
    network: CONFIG.NETWORK,
    packageId: CONFIG.PACKAGE_ID,
    keyServerObjectId: config.objectId,
    aggregatorUrl: config.aggregatorUrl,
    isValid: validation.isValid,
    error: validation.error,
    hasEnvironmentOverride: !!CONFIG.SEAL_KEY_SERVER_IDS,
  };
}

/**
 * Default encryption threshold (number of key servers required from client perspective).
 * With a single decentralized committee server, threshold is 1 — the committee handles
 * its internal 3-of-5 threshold via the aggregator.
 */
export const DEFAULT_ENCRYPTION_THRESHOLD = 1;

/**
 * Default session key TTL in minutes (1 month)
 */
export const DEFAULT_SESSION_KEY_TTL_MINUTES = 30; // 30 days * 24 hours * 60 minutes