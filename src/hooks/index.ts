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

export {
  useDrafts,
} from './useDrafts';

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

// Topic and Recommendation Hooks (Onboarding)
export { useTopics } from './useTopics';
export { useRecommendedPublications } from './useRecommendedPublications';

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

// Profile Hooks
export {
  useProfile,
  type Profile,
  type ProfileStats,
} from './useProfile';

export {
  useUserArticles,
  type UserArticle,
} from './useUserArticles';
