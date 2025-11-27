/**
 * Hooks Index
 * 
 * Centralized exports for all custom hooks to improve import organization
 * and provide a clean API for consuming components.
 */

// Wallet and Connection Hooks
export { useWalletConnection, type WalletConnectionState } from './useWalletConnection';
export { useSuiNS } from './useSuiNS';

// Article Management Hooks
export { 
  useArticleCreation, 
} from './useArticleCreation';

export { 
  type ArticleCreationState,
  type MediaFile,
  type ArticleUploadResult,
} from '@/types/article';

export { 
  useContentDecryption, 
  type UseContentDecryptionReturn,
} from './useContentDecryption';

export { 
  useArticle,
} from './useArticle';

export { 
  useArticleContent,
} from './useArticleContent';

// Feed Management Hooks
export { 
  useFeedArticles, 
} from './useFeedArticles';

export { 
  type FeedArticle,
} from '@/types/article';

// Publication Management Hooks
export { 
  usePublicationFlow, 
  type PublicationResult,
  type ContributorResult,
} from './usePublicationFlow';

// Transaction Hooks
export { 
  useEnhancedTransaction, 
  type EnhancedTransactionResult,
} from './useEnhancedTransaction';

// Subscription Management Hooks
export { 
  useSubscription,
} from './useSubscription';

export { 
  useUserSubscriptions,
} from './useUserSubscriptions';

// UI Hooks
export { useIsMobile as useMobile } from './use-mobile';
export { useToast, toast } from './use-toast';

// Export Hooks
export { useExportFollowers } from './useExportFollowers';