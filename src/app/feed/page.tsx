"use client"

import { RequireAuth } from "@/components/auth/RequireAuth"
import { AppLayout, RightSidebar } from "@/components/layout"
import { FeedPost } from "@/components/feed/FeedPost"
import { FeedPostSkeleton } from "@/components/feed/FeedPostSkeleton"
import { TopWriters } from "@/components/widgets/TopWriters"
import { Button } from "@/components/ui/button"
import { useFeedArticles } from "@/hooks/useFeedArticles"
import { useCategories } from "@/hooks/useCategories"
import { FeedType, TimeFrame } from "@/components/feed/FeedTypeSelector"
import { Loader2, AlertCircle, RefreshCw, Info } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { useArticleDeletion } from "@/hooks/useArticleDeletion"
import { listAllCachedArticles } from "@/lib/idb";
import { Article } from "@/types/article";
import { log } from "@/lib/utils/Logger";

function FeedPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { categories } = useCategories()

  // Extract feed type and category from URL params
  const [ feedType, setFeedType ] = useState<FeedType>(() => {
    const typeParam = searchParams.get('type') as FeedType
    return [ 'fresh', 'popular', 'my', 'bookmarks' ].includes(typeParam) ? typeParam : 'fresh'
  })

  // Get category from URL and find the corresponding category ID
  const categorySlug = searchParams.get('category')
  const selectedCategory = categories.find(cat => cat.slug === categorySlug)

  // Popular feed always uses week timeframe (as requested)
  const timeframe: TimeFrame = 'week'

  const {
    articles,
    isLoading,
    error,
    hasMore,
    loadMore,
    refresh,
    clearError,
    formatArticleForDisplay
  } = useFeedArticles(feedType, timeframe, selectedCategory?.id)

  // Article deletion hook
  const { deleteArticle, isDeletingArticle } = useArticleDeletion({
    onSuccess: (_articleId) => {
      // Refresh the feed after successful deletion
      refresh()
    },
    onError: (error, _articleId) => {
      // Handle deletion error - could show toast notification here
      console.error('Failed to delete article:', error)
    }
  })

  const [ cachedArticles, setCachedArticles ] = useState<Article[] | null>(null);
  const [ loadingCachedArticles, setLoadingCachedArticles ] = useState(false);
  const hasCachedArticles = useMemo(() => {
    return cachedArticles !== null && cachedArticles.length > 0
  }, [ cachedArticles ]);

  useEffect(() => {
    if (isLoading) {return;}
    if (error) {
      loadCachedArticles()
    } else {
      setCachedArticles(null);
    }
  }, [ error, isLoading ]);

  const handleArticleClick = (article: Article) => {
    if (article.cached) {
      window.location.assign(`/offline/article?id=${encodeURIComponent(article.slug)}`);
    } else {
      router.push(`/article?id=${encodeURIComponent(article.slug)}`);
    }
  }


  const handleRetry = () => {
    clearError()
    refresh()
  }

  const handleDeleteArticle = (articleId: string, publicationId: string, vaultId: string) => {
    deleteArticle({ articleId, publicationId, vaultId })
  }

  // Sync state with URL params when they change
  useEffect(() => {
    const typeParam = searchParams.get('type') as FeedType
    const newType = [ 'fresh', 'popular', 'my', 'bookmarks' ].includes(typeParam) ? typeParam : 'fresh'

    if (newType !== feedType) {
      setFeedType(newType)
    }
    // Note: Category changes are handled automatically through selectedCategory
    // which updates when searchParams or categories change
  }, [ searchParams, feedType ])

  // Use cachedArticles if present, otherwise use fetched articles
  const articlesToDisplay = cachedArticles || articles;

  const loadCachedArticles = async () => {
    setLoadingCachedArticles(true);
    try {
      const cached = await listAllCachedArticles();
      setCachedArticles(cached.map(c => ({ ...c.article, cached: true })));
    } catch (err) {
      log.error('Failed to load cached articles from IDB:', err);
    } finally {
      setLoadingCachedArticles(false);
    }
  }

  useEffect(() => {
    const handleOffline = () => {
      loadCachedArticles();
    };
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
      <AppLayout
          currentPage="feed"
          rightSidebar={
            <RightSidebar>
              <TopWriters/>
              {/* TODO: Temporary disable this until we implemented it */}
              {/* <PopularComments /> */}
            </RightSidebar>
          }
      >
        {/* Offline Info Section */}
        {hasCachedArticles && (
            <div className="bg-blue-50 rounded-2xl p-6 flex items-center justify-start gap-3 mb-6">
              <Info className="w-8 h-8 text-blue-600"/>
              <div className="text-sm text-blue-700">
                You are viewing cached articles.
              </div>
            </div>
        )}
        <div className="space-y-5">
          {/* Loading State */}
          {(isLoading || loadingCachedArticles) && articlesToDisplay.length === 0 && (
              <>
                <FeedPostSkeleton/>
                <FeedPostSkeleton/>
                <FeedPostSkeleton/>
              </>
          )}

          {/* Error State */}
          {error && !hasCachedArticles && !loadingCachedArticles && (
              <div className="bg-white rounded-2xl p-8">
                <div className="text-center space-y-4">
                  <div
                      className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                    <AlertCircle className="w-8 h-8 text-red-600"/>
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl font-bold text-gray-900">
                      Failed to Load Articles
                    </h2>
                    <p className="text-red-700 max-w-md mx-auto">
                      {error}
                    </p>
                  </div>
                  <div className="flex gap-3 justify-center">
                    <Button onClick={handleRetry} className="gap-2">
                      <RefreshCw className="h-4 w-4"/>
                      Try Again
                    </Button>
                  </div>
                </div>
              </div>
          )}

          {/* Articles */}
          {articlesToDisplay.map((article) => {
            const displayArticle = formatArticleForDisplay(article);
            const publicationObj = {
              id: article.publicationId,
              name: (article as {
                publicationName?: string
              }).publicationName || article.followInfo?.publicationName || `Publication ${article.publicationId?.slice(0, 8) ?? ''}...`,
              avatar: article.followInfo?.publicationAvatar || null,
              owner: (article as { publicationOwner?: string }).publicationOwner
            };

            return (
                <FeedPost
                    key={article.articleId}
                    author={displayArticle.author}
                    title={displayArticle.title}
                    description={displayArticle.description}
                    image={displayArticle.image}
                    engagement={displayArticle.engagement}
                    hasReadMore={true}
                    slug={article.slug}
                    onClick={() => handleArticleClick(article)}
                    publication={publicationObj}
                    articleId={article.articleId}
                    publicationId={article.publicationId}
                    totalTips={article.totalTips}
                    isFollowing={article.followInfo?.isFollowing}
                    followerCount={article.followInfo?.followerCount}
                    showFollowButton={true}
                    vaultId={article.vaultId}
                    onDelete={handleDeleteArticle}
                    isDeleting={isDeletingArticle(article.articleId)}
                    isOffline={article.cached || false}
                />
            );
          })}

          {/* Empty State */}
          {!isLoading && !error && articlesToDisplay.length === 0 && (
              <div className="bg-white rounded-2xl p-8">
                <div className="text-center space-y-4">
                  <div
                      className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                    <AlertCircle className="w-8 h-8 text-gray-400"/>
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl font-bold text-gray-900">
                      {selectedCategory && `No ${selectedCategory.name} Articles Found`}
                      {!selectedCategory && feedType === 'fresh' && 'No Articles Found'}
                      {!selectedCategory && feedType === 'popular' && 'No Popular Articles This Week'}
                      {!selectedCategory && feedType === 'my' && 'No Articles in Your Feed'}
                      {!selectedCategory && feedType === 'bookmarks' && 'No Bookmarked Articles'}
                    </h2>
                    <p className="text-muted-foreground">
                      {selectedCategory && `No articles have been published in the ${selectedCategory.name} category yet.`}
                      {!selectedCategory && feedType === 'fresh' && 'No articles have been published yet. Be the first to create content!'}
                      {!selectedCategory && feedType === 'popular' && `No articles have gained popularity in the selected timeframe. Try a different timeframe or check back later.`}
                      {!selectedCategory && feedType === 'my' && 'You haven\'t followed any publications yet, or they haven\'t published articles recently.'}
                      {!selectedCategory && feedType === 'bookmarks' && 'You haven\'t bookmarked any articles yet. Bookmark articles you want to read later!'}
                    </p>
                  </div>
                  <div className="flex gap-3 justify-center">
                    {selectedCategory && (
                        <Button onClick={() => router.push('/feed')} variant="outline">
                          Browse All Articles
                        </Button>
                    )}
                    {!selectedCategory && feedType === 'fresh' && (
                        <Button onClick={() => router.push('/create')} className="gap-2">
                          Create Article
                        </Button>
                    )}
                    {!selectedCategory && feedType === 'my' && (
                        <Button onClick={() => router.push('/feed?type=fresh')} variant="outline">
                          Browse All Articles
                        </Button>
                    )}
                    {!selectedCategory && feedType === 'popular' && (
                        <Button onClick={() => router.push('/feed')} variant="outline">
                          Browse Fresh Articles
                        </Button>
                    )}
                    {!selectedCategory && feedType === 'bookmarks' && (
                        <Button onClick={() => router.push('/feed')} variant="outline">
                          Browse Articles
                        </Button>
                    )}
                  </div>
                </div>
              </div>
          )}

          {/* Load More Button */}
          {hasMore && !isLoading && (
              <div className="text-center py-6">
                <Button onClick={loadMore} variant="outline" className="gap-2">
                  <Loader2 className="h-4 w-4"/>
                  Load More Articles
                </Button>
              </div>
          )}

        </div>
      </AppLayout>
  )
}

export default function FeedPage() {
  return (
      <RequireAuth>
        <FeedPageContent/>
      </RequireAuth>
  )
}
