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
  Calendar,
  User,
  Eye,
  Lock,
  Unlock,
  RefreshCw,
  ExternalLink,
  Tag
} from "lucide-react";
import ReactMarkdown from "react-markdown";

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
    loadingStateInfo,
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
        <div className="py-6 space-y-6">
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

          {/* Early Loading State - When no article metadata yet */}
          {loadingStage === 'metadata' && (
            <div className="bg-white rounded-2xl p-8">
              <div className="text-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                <div className="space-y-2">
                  <p className="font-medium">{loadingStateInfo.message}</p>
                  <p className="text-sm text-muted-foreground">
                    {loadingStateInfo.description}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Article Content */}
          {article && (
            <div className="space-y-6">
              {/* Article Header */}
              <div className="bg-white rounded-2xl p-8">
                <div className="space-y-6">
                  {/* Article Meta */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>{article.authorShortAddress || (article.author ? `${article.author.slice(0, 6)}...${article.author.slice(-4)}` : 'Unknown Author')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {article.timeAgo || (article.createdAt ? new Date(article.createdAt).toLocaleDateString() : 'Unknown date')}
                      </span>
                    </div>
                    {article.category && (
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-blue-600" />
                        <span className="text-blue-600 font-medium">{article.category.name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      {article.gated ? (
                        <>
                          <Lock className="h-4 w-4 text-orange-600" />
                          <span className="text-orange-600">Premium Article</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="h-4 w-4 text-green-600" />
                          <span className="text-green-600">Free Article</span>
                        </>
                      )}
                      {article.contentSealId && (
                        <span className="text-xs text-blue-600 ml-2">
                          🔒 Encrypted with Seal
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Article Title */}
                  <h1 className="text-4xl font-bold text-gray-900 leading-tight">
                    {article.title || 'Untitled Article'}
                  </h1>

                  {/* Article Summary */}
                  {article.summary && (
                    <p className="text-lg text-gray-600 leading-relaxed italic">
                      {article.summary}
                    </p>
                  )}

                  {/* Article Stats */}
                  <div className="flex items-center gap-6 text-sm text-muted-foreground border-t pt-4">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      <span>Reading time: ~{Math.ceil((content?.length || 0) / 1000)} min</span>
                    </div>
                    <div>
                      {content?.length || 0} characters
                    </div>
                  </div>
                </div>
              </div>

              {/* Article Body */}
              <div className="bg-white rounded-2xl p-8">
                {content ? (
                  <div className="prose prose-lg max-w-none">
                    <ReactMarkdown
                      components={{
                        // Custom styling for markdown elements
                        h1: ({ children }) => <h1 className="text-3xl font-bold mb-6 text-gray-900">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-2xl font-semibold mb-4 mt-8 text-gray-900">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-xl font-semibold mb-3 mt-6 text-gray-900">{children}</h3>,
                        p: ({ children }) => <p className="mb-4 text-gray-700 leading-relaxed">{children}</p>,
                        strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                        em: ({ children }) => <em className="italic text-gray-800">{children}</em>,
                        code: ({ children }) => (
                          <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800">
                            {children}
                          </code>
                        ),
                        pre: ({ children }) => (
                          <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto mb-4">
                            {children}
                          </pre>
                        ),
                      }}
                    >
                      {content}
                    </ReactMarkdown>
                  </div>
                ) : isProcessing || isWaitingForWallet ? (
                  /* Unified Loading State */
                  <div className="text-center py-12 space-y-6">
                    {loadingStateInfo.showSpinner && (
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    )}
                    
                    {/* Stage-specific icons */}
                    {loadingStage === 'waiting-wallet' && (
                      <Lock className="h-12 w-12 text-orange-500 mx-auto" />
                    )}
                    {loadingStage === 'decrypting' && (
                      <div className="relative">
                        <Lock className="h-12 w-12 text-blue-500 mx-auto" />
                        <div className="absolute -top-1 -right-1">
                          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-3">
                      <p className="text-xl font-medium text-gray-900">
                        {loadingStateInfo.message}
                      </p>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        {loadingStateInfo.description}
                      </p>
                      
                      {/* Stage-specific additional info */}
                      {loadingStage === 'waiting-wallet' && article?.contentSealId && (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 max-w-md mx-auto">
                          <div className="flex items-center gap-2 text-orange-700 mb-2">
                            <Lock className="h-4 w-4" />
                            <span className="font-medium">Encrypted Content</span>
                          </div>
                          <p className="text-sm text-orange-600">
                            Content will automatically decrypt once wallet is connected
                          </p>
                        </div>
                      )}
                      
                      {loadingStage === 'decrypting' && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                          <div className="flex items-center gap-2 text-blue-700 mb-2">
                            <Lock className="h-4 w-4" />
                            <span className="font-medium">Seal IBE Decryption</span>
                          </div>
                          <p className="text-sm text-blue-600">
                            Decrypting content using Identity-Based Encryption
                          </p>
                        </div>
                      )}
                      
                      {loadingStage === 'content' && article?.contentSealId && (
                        <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
                          <Lock className="h-4 w-4" />
                          <span>Encrypted content - decryption will begin shortly</span>
                        </div>
                      )}
                    </div>
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

              {/* Article Footer */}
              <div className="bg-white rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
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