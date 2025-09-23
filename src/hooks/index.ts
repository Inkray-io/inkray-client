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
  type ArticleCreationState,
  type MediaFile,
  type ArticleUploadResult,
} from './useArticleCreation';

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
  type FeedArticle,
  type FeedArticlesState,
} from './useFeedArticles';

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

// UI Hooks
export { useMobile } from './use-mobile';
export { useToast, toast } from './use-toast';