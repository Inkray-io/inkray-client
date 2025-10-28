"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { AppLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { useArticle } from "@/hooks/useArticle";
import { RequireAuth } from "@/components/auth/RequireAuth";
import {
  AlertCircle,
  ArrowLeft,
  User,
  Lock,
  RefreshCw,
  ExternalLink,
  Tag,
  Link,
  Share,
  Check
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { ArticleSkeletonLoader } from "@/components/ui/ArticleSkeletonLoader";
import { ArticleSkeleton } from "@/components/article/ArticleSkeleton";
import { FollowBar } from "@/components/follow";
import { NftMintingSection } from "@/components/nft";
import { TipButton } from "@/components/article/TipButton";
import { TipDisplay } from "@/components/ui/TipDisplay";
import { LikeButton } from "@/components/like/LikeButton";
import { useLikes } from "@/hooks/useLikes";
import { SubscriptionPaywall } from "@/components/subscription";
import { copyToClipboard } from "@/utils/address";
import { ROUTES } from "@/constants/routes";

function ArticlePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [articleSlug, setArticleSlug] = useState<string | null>(null);
  const [isTipDialogOpen, setIsTipDialogOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  // Mark as hydrated after mount to prevent SSR/client mismatch
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Get article slug from query parameters (only after hydration)
  useEffect(() => {
    if (isHydrated) {
      const id = searchParams.get('id');
      setArticleSlug(id);
    }
  }, [isHydrated, searchParams]);

  const {
    article,
    content,
    isProcessing,
    error,
    clearError,
    retry,
    reloadContent,
    canLoadContent,
    isWaitingForWallet,
    needsWalletForContent,
    loadingStage,
    hasDecryptionAccess,
    refetchSubscription,
  } = useArticle(articleSlug);

  // Initialize likes hook if article is available
  const likesHook = useLikes(
    article?.articleId || '',
    article ? {
      isLiked: false, // TODO: Get from article data when backend supports it
      likeCount: 0, // TODO: Get from article data when backend supports it
    } : undefined
  );

  const handleBack = () => {
    router.push('/feed');
  };

  const handleRetry = () => {
    clearError();
    retry();
  };

  const handleLikeToggle = async () => {
    await likesHook.toggleLike();
  };

  const handleCopyLink = async () => {
    if (copied) return; // Prevent multiple clicks while in copied state

    try {
      // Generate article URL
      const articleUrl = `${window.location.origin}${ROUTES.ARTICLE_WITH_ID(articleSlug || '')}`;

      // Copy to clipboard
      await copyToClipboard(articleUrl);

      // Show success state
      setCopied(true);

      // Reset after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const generateShareUrls = (articleUrl: string, title: string) => {
    const encodedUrl = encodeURIComponent(articleUrl);
    const encodedTitle = encodeURIComponent(title);

    return {
      twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      reddit: `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
    };
  };

  const handleShareClick = () => {
    setIsShareOpen(!isShareOpen);
  };

  const handleSharePlatform = (platform: string) => {
    // Generate article URL
    const articleUrl = `${window.location.origin}${ROUTES.ARTICLE_WITH_ID(articleSlug || '')}`;
    const shareUrls = generateShareUrls(articleUrl, article?.title || 'Article');

    // Open sharing URL in new tab
    const url = shareUrls[platform as keyof typeof shareUrls];
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }

    // Close popup
    setIsShareOpen(false);
  };

  // Show loading state during hydration to prevent SSR mismatch
  if (!isHydrated) {
    return (
      <RequireAuth redirectTo="/">
        <AppLayout currentPage="feed">
          <div className="max-w-4xl mx-auto py-8 space-y-6">
            {/* Back Button Skeleton */}
            <div className="flex items-center gap-4">
              <div className="h-9 w-32 bg-accent animate-pulse rounded-md" />
            </div>
            <ArticleSkeleton />
          </div>
        </AppLayout>
      </RequireAuth>
    );
  }

  // Show loading state when no slug is available
  if (!articleSlug) {
    return (
      <RequireAuth redirectTo="/">
        <AppLayout currentPage="feed">
          <div className="max-w-4xl mx-auto py-8">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-orange-500 mx-auto" />
              <h1 className="text-2xl font-bold">Article Not Found</h1>
              <p className="text-muted-foreground">
                No article specified in the URL.
              </p>
              <Button onClick={handleBack} variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Feed
              </Button>
            </div>
          </div>
        </AppLayout>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth redirectTo="/">
      <AppLayout currentPage="feed" showRightSidebar={false}>
        <div className="space-y-6">
          {/* Back Button */}
          <div className="flex items-center gap-4">
            <Button
              onClick={handleBack}
              variant="ghost"
              size="sm"
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Feed
            </Button>
          </div>


          {/* Error State - but don't show access denied errors when user lacks subscription access */}
          {error && !isWaitingForWallet && !(hasDecryptionAccess === false && error.includes('access')) && (
            <div className="bg-white rounded-2xl p-8">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                  {error.includes('Wallet connection required') || error.includes('Waiting for wallet') ? (
                    <Lock className="w-8 h-8 text-orange-600" />
                  ) : (
                    <AlertCircle className="w-8 h-8 text-red-600" />
                  )}
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-gray-900">
                    {error.includes('Wallet connection required') || error.includes('Waiting for wallet') ? 'Wallet Required' :
                      error.includes('Decryption') ? 'Decryption Failed' :
                        'Failed to Load Article'}
                  </h2>
                  <p className={`max-w-md mx-auto ${error.includes('Wallet connection required') || error.includes('Waiting for wallet') ? 'text-orange-700' : 'text-red-700'
                    }`}>
                    {error.includes('Waiting for wallet') ? 'Please connect your wallet to decrypt this encrypted article content.' : error}
                  </p>
                  {article?.contentSealId && (
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-3">
                      <Lock className="h-4 w-4" />
                      <span>This article contains encrypted content</span>
                    </div>
                  )}
                  {needsWalletForContent && (
                    <div className="flex items-center justify-center gap-2 text-sm text-blue-600 mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <span>Connect your wallet to access encrypted content</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-3 justify-center">
                  <Button onClick={handleRetry} className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Try Again
                  </Button>
                  <Button onClick={handleBack} variant="outline">
                    Back to Feed
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Article Content */}
          {article && (
            <div className="space-y-6">
              {/* Unified Article Container */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 md:p-6 lg:p-8">
                <div className="space-y-6">
                  {/* Article Author */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <User className="size-10 text-gray-400 bg-gray-100 rounded-full p-2" />
                      <div>
                        <div className="font-semibold text-black text-sm">
                          {article.authorShortAddress || (article.author ? `${article.author.slice(0, 6)}...${article.author.slice(-4)}` : 'Unknown Author')}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <span>
                            {article.timeAgo || (article.createdAt ? new Date(article.createdAt).toLocaleDateString() : 'Unknown date')}
                            {content && ` • ${Math.ceil((content.length || 0) / 1000)} min read`}
                          </span>
                          {article.category && (
                            <>
                              <span>•</span>
                              <Tag className="size-3" />
                              <span>{article.category.name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Like Button */}
                      {article.articleId && (
                        <LikeButton
                          isLiked={likesHook.isLiked}
                          isLoading={likesHook.isLoading}
                          likeCount={likesHook.likeCount}
                          onToggleLike={handleLikeToggle}
                          showLikeCount={false}
                          variant="engagement"
                        />
                      )}

                      {/* Copy Link Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-9 sm:size-8 hover:bg-gray-100 transition-colors min-h-[36px] min-w-[36px]"
                        onClick={handleCopyLink}
                      >
                        {copied ? (
                          <Check className="size-4 text-green-600" />
                        ) : (
                          <Link className="size-4 text-gray-600" />
                        )}
                      </Button>

                      {/* Share Button with Dropdown */}
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-9 sm:size-8 hover:bg-gray-100 transition-colors min-h-[36px] min-w-[36px]"
                          onClick={handleShareClick}
                        >
                          <Share className="size-4 text-gray-600" />
                        </Button>

                        {/* Share Popup */}
                        {isShareOpen && (
                          <div className="absolute top-full right-0 mt-1 w-56 sm:w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-w-[calc(100vw-2rem)]">
                            <div className="py-1">
                              <button
                                onClick={() => handleSharePlatform('twitter')}
                                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                              >
                                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                                  <span className="text-white text-xs font-bold">𝕏</span>
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">Twitter</div>
                                  <div className="text-xs text-gray-500">Share on Twitter</div>
                                </div>
                                <ExternalLink className="w-4 h-4 text-gray-400 ml-auto" />
                              </button>

                              <button
                                onClick={() => handleSharePlatform('linkedin')}
                                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                              >
                                <div className="w-8 h-8 bg-blue-700 rounded-full flex items-center justify-center flex-shrink-0">
                                  <span className="text-white text-xs font-bold">in</span>
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">LinkedIn</div>
                                  <div className="text-xs text-gray-500">Share on LinkedIn</div>
                                </div>
                                <ExternalLink className="w-4 h-4 text-gray-400 ml-auto" />
                              </button>

                              <button
                                onClick={() => handleSharePlatform('facebook')}
                                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                              >
                                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                                  <span className="text-white text-xs font-bold">f</span>
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">Facebook</div>
                                  <div className="text-xs text-gray-500">Share on Facebook</div>
                                </div>
                                <ExternalLink className="w-4 h-4 text-gray-400 ml-auto" />
                              </button>

                              <button
                                onClick={() => handleSharePlatform('reddit')}
                                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                              >
                                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                                  <span className="text-white text-xs font-bold">r</span>
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">Reddit</div>
                                  <div className="text-xs text-gray-500">Share on Reddit</div>
                                </div>
                                <ExternalLink className="w-4 h-4 text-gray-400 ml-auto" />
                              </button>

                              <hr className="my-1" />

                              <button
                                onClick={handleCopyLink}
                                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                              >
                                <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center flex-shrink-0">
                                  {copied ? (
                                    <Check className="w-4 h-4 text-white" />
                                  ) : (
                                    <Link className="w-4 h-4 text-white" />
                                  )}
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {copied ? 'Copied!' : 'Copy Link'}
                                  </div>
                                  <div className="text-xs text-gray-500">Copy article link</div>
                                </div>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Support Button */}
                      {article?.publicationId ? (
                        <button
                          className="px-3 py-1.5 bg-blue-50 text-primary text-xs font-semibold rounded-lg hover:bg-blue-100 transition-colors min-h-[36px]"
                          onClick={() => setIsTipDialogOpen(true)}
                        >
                          Support
                        </button>
                      ) : (
                        <div className="px-3 py-1.5 bg-blue-50 text-primary text-xs font-semibold rounded-lg min-h-[36px] flex items-center">
                          Support
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Article Metadata */}
                  <div className="space-y-4">
                    {/* Article Title */}
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-black leading-tight">
                      {article.title || 'Untitled Article'}
                    </h1>

                    {/* Article Summary */}
                    {article.summary && (
                      <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
                        {article.summary}
                      </p>
                    )}

                  </div>

                  {/* Article Body */}
                  <div className="border-t border-gray-100 pt-6">
                    {/* Show skeleton loader while loading content */}
                    {(loadingStage !== 'idle' && !content) ? (
                      <ArticleSkeletonLoader />
                    ) : content ? (
                      <div className="prose prose-base sm:prose-lg max-w-none">
                        <ReactMarkdown
                          components={{
                            // Custom styling for markdown elements
                            h1: ({ children }) => <h1 className="text-xl sm:text-2xl font-semibold mb-4 text-black">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-lg sm:text-xl font-semibold mb-3 mt-6 text-black">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-base sm:text-lg font-semibold mb-2 mt-4 text-black">{children}</h3>,
                            p: ({ children }) => <p className="mb-4 text-gray-700 text-base sm:text-lg leading-relaxed">{children}</p>,
                            strong: ({ children }) => <strong className="font-semibold text-black">{children}</strong>,
                            em: ({ children }) => <em className="italic text-gray-600">{children}</em>,
                            code: ({ children }) => (
                              <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono text-gray-800">
                                {children}
                              </code>
                            ),
                            pre: ({ children }) => (
                              <pre className="bg-gray-100 p-3 rounded-lg overflow-x-auto mb-3 text-sm">
                                {children}
                              </pre>
                            ),
                          }}
                        >
                          {content}
                        </ReactMarkdown>
                      </div>
                    ) : canLoadContent ? (
                      // Only show manual decryption controls if user has decryption access
                      hasDecryptionAccess !== false ? (
                        <div className="text-center py-12 space-y-4">
                          {article.contentSealId ? (
                            <Lock className="h-12 w-12 text-blue-500 mx-auto" />
                          ) : (
                            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto" />
                          )}
                          <div>
                            <p className="font-medium">
                              {article.contentSealId ? 'Encrypted content available' : 'Content not loaded'}
                            </p>
                            <p className="text-muted-foreground text-sm">
                              {article.contentSealId ?
                                'Click to decrypt and load the article content using Seal' :
                                'Click to load the article content'
                              }
                            </p>
                            {article.contentSealId && (
                              <p className="text-xs text-blue-600 mt-2">
                                Wallet connection required for decryption
                              </p>
                            )}
                          </div>
                          <Button onClick={reloadContent} className="gap-2">
                            {article.contentSealId ? (
                              <>
                                <Lock className="h-4 w-4" />
                                Decrypt Content
                              </>
                            ) : (
                              <>
                                <RefreshCw className="h-4 w-4" />
                                Load Content
                              </>
                            )}
                          </Button>
                        </div>
                      ) : (
                        // For subscription-gated content without access, show subscription paywall inline
                        <div className="py-8">
                          <SubscriptionPaywall
                            publicationInfo={{
                              id: article.publicationId,
                              name: article.followInfo?.publicationName || 'Publication',
                              description: undefined, // description not available in followInfo
                              avatar: article.followInfo?.publicationAvatar || undefined,
                              totalSubscribers: article.followInfo?.followerCount,
                              totalArticles: undefined, // articleCount not available in followInfo
                            }}
                            subscriptionInfo={{
                              id: article.publicationSubscriptionInfo?.id || '',
                              subscriptionPrice: article.publicationSubscriptionInfo?.subscriptionPrice || 0,
                              subscriptionPeriod: article.publicationSubscriptionInfo?.subscriptionPeriod || 30,
                              publicationName: article.followInfo?.publicationName,
                            }}
                            isSubscribed={article.hasActivePublicationSubscription}
                            subscriptionExpiresAt={article.publicationSubscriptionExpiresAt ? new Date(article.publicationSubscriptionExpiresAt) : undefined}
                            onSubscriptionSuccess={() => {
                              // Reload both article data and subscription status
                              retry();
                              refetchSubscription();
                            }}
                            articleTitle={article.title}
                          />
                        </div>
                      )
                    ) : (
                      <div className="text-center py-12 space-y-4">
                        <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
                        <div>
                          <p className="font-medium text-red-700">Content unavailable</p>
                          <p className="text-muted-foreground text-sm">This article does not have content available for loading</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>


              {/* Follow Bar */}
              {article.followInfo && (
                <FollowBar
                  publicationId={article.publicationId}
                  publicationName={article.followInfo.publicationName}
                  publicationAvatar={article.followInfo.publicationAvatar || null}
                  initialFollowInfo={{
                    isFollowing: article.followInfo.isFollowing,
                    followerCount: article.followInfo.followerCount,
                    followedAt: article.followInfo.followedAt,
                  }}
                  className="mb-6"
                />
              )}

              {/* NFT Minting Section */}
              {article.articleId && (
                <NftMintingSection
                  articleId={article.articleId}
                  articleTitle={article.title || 'Untitled Article'}
                  authorAddress={article.author}
                />
              )}

              {/* Tip Section */}
              {article.publicationId && (
                <div className="bg-white rounded-2xl p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-4">
                      <h3 className="text-sm font-semibold">Support this article</h3>
                      <TipDisplay amount={article.totalTips || 0} size="default" />
                    </div>
                    <button
                      className="px-3 py-1.5 bg-blue-50 text-primary text-xs font-semibold rounded-lg hover:bg-blue-100 transition-colors min-h-[36px]"
                      onClick={() => setIsTipDialogOpen(true)}
                    >
                      Tip
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Tips help support content creators on the platform
                  </p>
                </div>
              )}


              {/* Article Footer */}
              <div className="bg-white rounded-2xl p-4 sm:p-5">
                <div className="text-xs text-gray-500">
                  <p>Published on Sui blockchain</p>
                  <p className="flex items-center gap-2">
                    Object ID:{' '}
                    <button
                      onClick={() => article.articleId && window.open(`https://suiexplorer.com/object/${article.articleId}?network=testnet`, '_blank')}
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                    >
                      <span className="font-mono">
                        {article.articleId ?
                          `${article.articleId.slice(0, 8)}...${article.articleId.slice(-8)}` :
                          'Unknown'
                        }
                      </span>
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Empty state when no content but no error AND no article metadata */}
          {!isProcessing && !error && !content && !article && (
            <div className="bg-white rounded-2xl p-8">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle className="w-8 h-8 text-gray-400" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-gray-900">
                    Article Not Found
                  </h2>
                  <p className="text-muted-foreground">
                    The article &ldquo;{articleSlug}&rdquo; could not be found.
                  </p>
                </div>
                <Button onClick={handleBack} variant="outline">
                  Back to Feed
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Click outside to close share popup */}
        {isShareOpen && (
          <div
            className="fixed inset-0 z-0"
            onClick={() => setIsShareOpen(false)}
          />
        )}

        {/* Tip Dialog */}
        {article?.publicationId && isTipDialogOpen && (
          <TipButton
            publicationId={article.publicationId}
            articleTitle={article.title || 'Untitled Article'}
            isOpen={isTipDialogOpen}
            onOpenChange={setIsTipDialogOpen}
          />
        )}
      </AppLayout>
    </RequireAuth>
  );
}

export default function ArticlePage() {
  return (
    <Suspense fallback={
      <RequireAuth redirectTo="/">
        <AppLayout currentPage="feed">
          <div className="max-w-4xl mx-auto py-8 space-y-6">
            {/* Back Button Skeleton */}
            <div className="flex items-center gap-4">
              <div className="h-9 w-32 bg-accent animate-pulse rounded-md" />
            </div>
            <ArticleSkeleton />
          </div>
        </AppLayout>
      </RequireAuth>
    }>
      <ArticlePageContent />
    </Suspense>
  );
}