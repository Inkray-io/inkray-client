/**
 * Centralized configuration management with runtime validation
 * Replaces hardcoded values with proper environment variable handling
 */

import { z } from 'zod';
import { log } from './utils/Logger';

// ========================================
// ENVIRONMENT VALIDATION SCHEMAS
// ========================================

const NetworkSchema = z.enum(['testnet', 'mainnet', 'devnet', 'localnet'], {
  message: 'Network must be one of: testnet, mainnet, devnet, localnet'
});

const ConfigSchema = z.object({
  // Sui Configuration
  PACKAGE_ID: z.string().min(1, 'NEXT_PUBLIC_PACKAGE_ID is required').regex(
    /^0x[a-fA-F0-9]{60,64}$/,
    'NEXT_PUBLIC_PACKAGE_ID must be a valid Sui address (0x followed by 60-64 hex characters)'
  ),
  NFT_MINT_CONFIG_ID: z.string().min(1, 'NEXT_PUBLIC_NFT_MINT_CONFIG_ID is required').regex(
    /^0x[a-fA-F0-9]{60,64}$/,
    'NEXT_PUBLIC_NFT_MINT_CONFIG_ID must be a valid Sui address (0x followed by 60-64 hex characters)'
  ),
  NETWORK: NetworkSchema,

  // Walrus Configuration
  WALRUS_AGGREGATOR_URL: z.string().url('NEXT_PUBLIC_WALRUS_AGGREGATOR_URL must be a valid URL'),
  WALRUS_PUBLISHER_URL: z.string().url('NEXT_PUBLIC_WALRUS_PUBLISHER_URL must be a valid URL'),

  // Seal Configuration
  SEAL_API_URL: z.string().url('NEXT_PUBLIC_SEAL_API_URL must be a valid URL'),
  SEAL_KEY_SERVER_IDS: z.string().optional(),

  // Application Configuration
  API_URL: z.string().url('NEXT_PUBLIC_API_URL must be a valid URL'),
  APP_NAME: z.string().min(1, 'NEXT_PUBLIC_APP_NAME is required'),
});

// Default configuration based on network
const getDefaultConfig = (network: string) => {
  const defaults = {
    testnet: {
      WALRUS_AGGREGATOR_URL: 'https://aggregator-devnet.walrus.space',
      WALRUS_PUBLISHER_URL: 'https://publisher-devnet.walrus.space',
      SEAL_API_URL: 'https://seal-testnet.mystenlabs.com',
    },
    mainnet: {
      WALRUS_AGGREGATOR_URL: 'https://aggregator.walrus.space',
      WALRUS_PUBLISHER_URL: 'https://publisher.walrus.space',
      SEAL_API_URL: 'https://seal.mystenlabs.com',
    },
    devnet: {
      WALRUS_AGGREGATOR_URL: 'https://aggregator-devnet.walrus.space',
      WALRUS_PUBLISHER_URL: 'https://publisher-devnet.walrus.space',
      SEAL_API_URL: 'https://seal-devnet.mystenlabs.com',
    },
    localnet: {
      WALRUS_AGGREGATOR_URL: 'http://localhost:8080',
      WALRUS_PUBLISHER_URL: 'http://localhost:8081',
      SEAL_API_URL: 'http://localhost:8082',
    },
  };

  return defaults[network as keyof typeof defaults] || defaults.testnet;
};

// ========================================
// CONFIGURATION LOADING AND VALIDATION
// ========================================

function loadAndValidateConfig() {
  try {
    const rawNetwork = process.env.NEXT_PUBLIC_NETWORK || 'testnet';
    const defaults = getDefaultConfig(rawNetwork);

    const rawConfig = {
      PACKAGE_ID: process.env.NEXT_PUBLIC_PACKAGE_ID || '',
      NFT_MINT_CONFIG_ID: process.env.NEXT_PUBLIC_NFT_MINT_CONFIG_ID || '',
      NETWORK: rawNetwork,
      WALRUS_AGGREGATOR_URL: process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR_URL || defaults.WALRUS_AGGREGATOR_URL,
      WALRUS_PUBLISHER_URL: process.env.NEXT_PUBLIC_WALRUS_PUBLISHER_URL || defaults.WALRUS_PUBLISHER_URL,
      SEAL_API_URL: process.env.NEXT_PUBLIC_SEAL_API_URL || defaults.SEAL_API_URL,
      SEAL_KEY_SERVER_IDS: process.env.NEXT_PUBLIC_SEAL_KEY_SERVER_IDS,
      API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
      APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'Inkray',
    };

    // Debug logging for troubleshooting
    if (process.env.NODE_ENV === 'development') {
      log.debug('Loading configuration...', {
        packageId: rawConfig.PACKAGE_ID ? `${rawConfig.PACKAGE_ID.substring(0, 10)}...` : 'MISSING',
        network: rawConfig.NETWORK,
        apiUrl: rawConfig.API_URL
      }, 'Config');
    }

    const validatedConfig = ConfigSchema.parse(rawConfig);

    if (process.env.NODE_ENV === 'development') {
      log.debug('Configuration validation successful', undefined, 'Config');
    }

    return validatedConfig;
  } catch (error) {
    // Enhanced error handling with more context
    log.error('Configuration validation failed', { error }, 'Config');

    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map(err => {
        const path = err.path.join('.');
        return `${path}: ${err.message}`;
      }).join('\n');

      const errorMsg =
        `Configuration Error - Please check your environment variables:\n\n${errorMessages}\n\n` +
        `Make sure you have copied .env.example to .env.local and filled in all required values.\n` +
        `See .env.example for detailed configuration instructions.\n\n` +
        `If this error persists, check the browser console for more details.`;

      log.error(errorMsg, { issues: error.issues }, 'Config');
      throw new Error(errorMsg);
    }

    log.error('Unknown configuration error', { error }, 'Config');
    throw error;
  }
}

// ========================================
// EXPORTED CONFIGURATION
// ========================================

// Load and validate configuration with fallback for development
let CONFIG: ReturnType<typeof loadAndValidateConfig>;

try {
  CONFIG = loadAndValidateConfig();
} catch (error) {
  // In development, provide a fallback configuration to prevent app crashes
  if (process.env.NODE_ENV === 'development') {
    log.warn('Using fallback configuration due to validation error', { error }, 'Config');
    log.warn('Some features may not work properly until configuration is fixed', undefined, 'Config');

    CONFIG = {
      PACKAGE_ID: process.env.NEXT_PUBLIC_PACKAGE_ID || '0x0000000000000000000000000000000000000000000000000000000000000000',
      NFT_MINT_CONFIG_ID: process.env.NEXT_PUBLIC_NFT_MINT_CONFIG_ID || '0x0000000000000000000000000000000000000000000000000000000000000001',
      NETWORK: (process.env.NEXT_PUBLIC_NETWORK as 'testnet' | 'mainnet' | 'devnet' | 'localnet') || 'testnet',
      WALRUS_AGGREGATOR_URL: process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR_URL || 'https://aggregator-devnet.walrus.space',
      WALRUS_PUBLISHER_URL: process.env.NEXT_PUBLIC_WALRUS_PUBLISHER_URL || 'https://publisher-devnet.walrus.space',
      SEAL_API_URL: process.env.NEXT_PUBLIC_SEAL_API_URL || 'https://seal-testnet.mystenlabs.com',
      SEAL_KEY_SERVER_IDS: process.env.NEXT_PUBLIC_SEAL_KEY_SERVER_IDS,
      API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
      APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'Inkray',
    };
  } else {
    // In production, fail fast with configuration errors
    throw error;
  }
}

export { CONFIG };

// Type-safe configuration object
export type AppConfig = typeof CONFIG;

// ========================================
// CONFIGURATION HELPERS
// ========================================

/**
 * Check if we're running in development mode
 */
export const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Check if we're running in production mode
 */
export const isProduction = process.env.NODE_ENV === 'production';

/**
 * Get the current environment info for debugging
 */
export const getEnvironmentInfo = () => ({
  nodeEnv: process.env.NODE_ENV,
  network: CONFIG.NETWORK,
  hasPackageId: !!CONFIG.PACKAGE_ID,
  walrusEndpoints: {
    aggregator: CONFIG.WALRUS_AGGREGATOR_URL,
    publisher: CONFIG.WALRUS_PUBLISHER_URL,
  },
  sealEndpoint: CONFIG.SEAL_API_URL,
  apiEndpoint: CONFIG.API_URL,
});

/**
 * Validate configuration at runtime (useful for debugging)
 */
export const validateConfiguration = (): { valid: boolean; errors: string[] } => {
  try {
    ConfigSchema.parse({
      PACKAGE_ID: CONFIG.PACKAGE_ID,
      NFT_MINT_CONFIG_ID: CONFIG.NFT_MINT_CONFIG_ID,
      NETWORK: CONFIG.NETWORK,
      WALRUS_AGGREGATOR_URL: CONFIG.WALRUS_AGGREGATOR_URL,
      WALRUS_PUBLISHER_URL: CONFIG.WALRUS_PUBLISHER_URL,
      SEAL_API_URL: CONFIG.SEAL_API_URL,
      API_URL: CONFIG.API_URL,
      APP_NAME: CONFIG.APP_NAME,
    });
    return { valid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.issues.map(err => `${err.path.join('.')}: ${err.message}`)
      };
    }
    return { valid: false, errors: [String(error)] };
  }
};

/**
 * Log configuration status (for development debugging)
 */
export const logConfigurationStatus = () => {
  if (!isDevelopment) return;

  const info = getEnvironmentInfo();
  const validation = validateConfiguration();

  log.debug('Inkray Configuration Status', {
    network: info.network,
    packageId: info.hasPackageId ? 'Set' : 'Missing',
    walrusAggregator: info.walrusEndpoints.aggregator,
    walrusPublisher: info.walrusEndpoints.publisher,
    sealAPI: info.sealEndpoint,
    backendAPI: info.apiEndpoint,
    isValid: validation.valid,
    errors: validation.valid ? undefined : validation.errors
  }, 'Config');
};

// ========================================
// SEAL KEY SERVER MANAGEMENT
// ========================================

/**
 * Parse key server IDs from configuration
 * Format: comma-separated list of Sui object IDs
 */
export const parseKeyServerIds = (): string[] => {
  if (!CONFIG.SEAL_KEY_SERVER_IDS) {
    log.warn('No Seal key server IDs configured. Seal encryption will not work.', undefined, 'Config');
    return [];
  }

  const ids = CONFIG.SEAL_KEY_SERVER_IDS.split(',').map(id => id.trim());
  const validIds = ids.filter(id => /^0x[a-fA-F0-9]{64}$/.test(id));

  if (validIds.length !== ids.length) {
    log.warn('Some key server IDs are invalid and were filtered out', {
      totalIds: ids.length,
      validIds: validIds.length
    }, 'Config');
  }

  return validIds;
};

/**
 * Get default key server configurations for development
 * Note: These are placeholder values and should not be used in production
 */
export const getDefaultKeyServerIds = (network: string): string[] => {
  // In production, these should come from environment variables
  // These are placeholders for development
  const defaults = {
    testnet: [
      // Placeholder IDs - replace with actual testnet key server IDs
      '0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75',
      '0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8',
    ],
    mainnet: [
      // Placeholder IDs - replace with actual mainnet key server IDs  
      '0x0000000000000000000000000000000000000000000000000000000000000003',
      '0x0000000000000000000000000000000000000000000000000000000000000004',
    ],
    devnet: [
      // Placeholder IDs - replace with actual devnet key server IDs
      '0x0000000000000000000000000000000000000000000000000000000000000005',
      '0x0000000000000000000000000000000000000000000000000000000000000006',
    ],
    localnet: [
      // Placeholder IDs for local development
      '0x0000000000000000000000000000000000000000000000000000000000000007',
      '0x0000000000000000000000000000000000000000000000000000000000000008',
    ],
  };

  return defaults[network as keyof typeof defaults] || defaults.testnet;
};

/**
 * Get key server IDs with fallback to defaults for development
 */
export const getKeyServerIds = (): string[] => {
  const configuredIds = parseKeyServerIds();

  if (configuredIds.length > 0) {
    return configuredIds;
  }

  // Fallback to defaults for development
  if (isDevelopment) {
    log.warn('Using default key server IDs for development. Set NEXT_PUBLIC_SEAL_KEY_SERVER_IDS for production.', {
      network: CONFIG.NETWORK
    }, 'Config');
    return getDefaultKeyServerIds(CONFIG.NETWORK);
  }

  throw new Error(
    'Seal key server IDs not configured. Set NEXT_PUBLIC_SEAL_KEY_SERVER_IDS environment variable with comma-separated Sui object IDs.'
  );
};

// Log configuration status in development
if (isDevelopment && typeof window !== 'undefined') {
  logConfigurationStatus();
}