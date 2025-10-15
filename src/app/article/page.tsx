"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { AppLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { useArticle } from "@/hooks/useArticle";
import { RequireAuth } from "@/components/auth/RequireAuth";
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  User,
  Lock,
  Unlock,
  RefreshCw,
  ExternalLink,
  Tag
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { ArticleAnimatedLoader } from "@/components/ui/ArticleAnimatedLoader";
import { FollowBar } from "@/components/follow";
import { NftMintingSection } from "@/components/nft";
import { TipButton } from "@/components/article/TipButton";
import { TipDisplay } from "@/components/ui/TipDisplay";

function ArticlePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [articleSlug, setArticleSlug] = useState<string | null>(null);

  // Get article slug from query parameters
  useEffect(() => {
    const id = searchParams.get('id');
    setArticleSlug(id);
  }, [searchParams]);

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
  } = useArticle(articleSlug);

  const handleBack = () => {
    router.push('/feed');
  };

  const handleRetry = () => {
    clearError();
    retry();
  };

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


          {/* Error State */}
          {error && !isWaitingForWallet && (
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
              <div className="bg-white rounded-2xl p-5">
                <div className="space-y-6">
                  {/* Article Author */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <User className="size-10 text-gray-400 bg-gray-100 rounded-full p-2" />
                      <div>
                        <div className="font-semibold text-black text-sm">
                          {article.authorShortAddress || (article.author ? `${article.author.slice(0, 6)}...${article.author.slice(-4)}` : 'Unknown Author')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {article.timeAgo || (article.createdAt ? new Date(article.createdAt).toLocaleDateString() : 'Unknown date')}
                          {content && ` • ${Math.ceil((content.length || 0) / 1000)} min read`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="px-3 py-1.5 bg-blue-50 text-primary text-xs font-semibold rounded-lg">
                        Support
                      </div>
                    </div>
                  </div>

                  {/* Article Metadata */}
                  <div className="space-y-4">
                    {/* Article Title */}
                    <h1 className="text-2xl font-semibold text-black leading-tight">
                      {article.title || 'Untitled Article'}
                    </h1>

                    {/* Article Summary */}
                    {article.summary && (
                      <p className="text-gray-700 text-sm leading-relaxed">
                        {article.summary}
                      </p>
                    )}

                    {/* Article Meta Info */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                      {article.category && (
                        <div className="flex items-center gap-1">
                          <Tag className="size-3" />
                          <span>{article.category.name}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        {article.gated ? (
                          <>
                            <Lock className="size-3" />
                            <span>Premium</span>
                          </>
                        ) : (
                          <>
                            <Unlock className="size-3" />
                            <span>Free</span>
                          </>
                        )}
                      </div>
                      {article.contentSealId && (
                        <div className="flex items-center gap-1">
                          <Lock className="size-3" />
                          <span>Encrypted</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Article Body */}
                  <div className="border-t border-gray-100 pt-6">
                    {/* Show animated loader while loading content */}
                    {(loadingStage !== 'idle' && !content) ? (
                      <ArticleAnimatedLoader
                        currentStage={loadingStage}
                        isEncrypted={!!article.contentSealId}
                      />
                    ) : content ? (
                      <div className="prose prose-lg max-w-none">
                        <ReactMarkdown
                          components={{
                            // Custom styling for markdown elements
                            h1: ({ children }) => <h1 className="text-2xl font-semibold mb-4 text-black">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-xl font-semibold mb-3 mt-6 text-black">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-lg font-semibold mb-2 mt-4 text-black">{children}</h3>,
                            p: ({ children }) => <p className="mb-3 text-gray-700 text-sm leading-relaxed">{children}</p>,
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
              {article.articleId && article.publicationId && (
                <div className="bg-white rounded-2xl p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <h3 className="text-sm font-semibold">Support this article</h3>
                      <TipDisplay amount={article.totalTips || 0} size="default" />
                    </div>
                    <TipButton
                      articleId={article.articleId}
                      publicationId={article.publicationId}
                      articleTitle={article.title || 'Untitled Article'}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Tips help support content creators on the platform
                  </p>
                </div>
              )}


              {/* Article Footer */}
              <div className="bg-white rounded-2xl p-5">
                <div className="flex items-center justify-between">
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

                  <div className="flex gap-3">
                    <Button variant="outline" size="sm">
                      Share Article
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Empty state when no content but no error */}
          {!isProcessing && !error && !content && (
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
      </AppLayout>
    </RequireAuth>
  );
}

export default function ArticlePage() {
  return (
    <Suspense fallback={
      <RequireAuth redirectTo="/">
        <AppLayout currentPage="feed">
          <div className="max-w-4xl mx-auto py-8">
            <div className="bg-white rounded-2xl p-8">
              <div className="text-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                <p className="font-medium">Loading article...</p>
              </div>
            </div>
          </div>
        </AppLayout>
      </RequireAuth>
    }>
      <ArticlePageContent />
    </Suspense>
  );
}