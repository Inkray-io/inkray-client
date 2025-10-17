"use client"

import { AppLayout, RightSidebar } from "@/components/layout"
import { FeedPost } from "@/components/feed/FeedPost"
import { TopWriters } from "@/components/widgets/TopWriters"
import { PopularComments } from "@/components/widgets/PopularComments"
import { Button } from "@/components/ui/button"
import { useFeedArticles } from "@/hooks/useFeedArticles"
import FeedTypeSelector, { FeedType, TimeFrame } from "@/components/feed/FeedTypeSelector"
import { Loader2, AlertCircle, RefreshCw } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

export default function FeedPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Extract feed type and timeframe from URL params
  const [feedType, setFeedType] = useState<FeedType>(() => {
    const typeParam = searchParams.get('type') as FeedType
    return ['fresh', 'popular', 'my'].includes(typeParam) ? typeParam : 'fresh'
  })
  
  const [timeframe, setTimeframe] = useState<TimeFrame>(() => {
    const timeframeParam = searchParams.get('timeframe') as TimeFrame
    return ['day', 'week', 'month'].includes(timeframeParam) ? timeframeParam : 'week'
  })

  const { 
    articles, 
    isLoading, 
    error, 
    hasMore, 
    loadMore, 
    refresh, 
    clearError,
    formatArticleForDisplay 
  } = useFeedArticles(feedType, timeframe)

  const handleArticleClick = (slug: string) => {
    router.push(`/article?id=${encodeURIComponent(slug)}`)
  }

  const handleRetry = () => {
    clearError()
    refresh()
  }

  // Update URL when feed type or timeframe changes
  const updateURL = useCallback((newFeedType: FeedType, newTimeframe: TimeFrame) => {
    const params = new URLSearchParams()
    
    if (newFeedType !== 'fresh') {
      params.set('type', newFeedType)
    }
    
    if (newFeedType === 'popular' && newTimeframe !== 'week') {
      params.set('timeframe', newTimeframe)
    }
    
    const query = params.toString()
    const newURL = query ? `/feed?${query}` : '/feed'
    
    router.replace(newURL, { scroll: false })
  }, [router])

  const handleFeedTypeChange = useCallback((newFeedType: FeedType) => {
    setFeedType(newFeedType)
    updateURL(newFeedType, timeframe)
  }, [timeframe, updateURL])

  const handleTimeframeChange = useCallback((newTimeframe: TimeFrame) => {
    setTimeframe(newTimeframe)
    updateURL(feedType, newTimeframe)
  }, [feedType, updateURL])

  // Sync state with URL params when they change
  useEffect(() => {
    const typeParam = searchParams.get('type') as FeedType
    const timeframeParam = searchParams.get('timeframe') as TimeFrame
    
    const newType = ['fresh', 'popular', 'my'].includes(typeParam) ? typeParam : 'fresh'
    const newTimeframe = ['day', 'week', 'month'].includes(timeframeParam) ? timeframeParam : 'week'
    
    if (newType !== feedType) {
      setFeedType(newType)
    }
    
    if (newTimeframe !== timeframe) {
      setTimeframe(newTimeframe)
    }
  }, [searchParams, feedType, timeframe])

  return (
    <AppLayout 
      currentPage="feed"
      rightSidebar={
        <RightSidebar>
          <TopWriters />
          <PopularComments />
        </RightSidebar>
      }
    >
      <div className="space-y-5">
        {/* Feed Type Selector */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Article Feed
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {feedType === 'fresh' && 'Latest articles from all publications'}
                {feedType === 'popular' && `Trending articles from the ${timeframe}`}
                {feedType === 'my' && 'Articles from publications you follow'}
              </p>
            </div>
            <FeedTypeSelector
              currentFeedType={feedType}
              currentTimeframe={timeframe}
              onFeedTypeChange={handleFeedTypeChange}
              onTimeframeChange={handleTimeframeChange}
              showTimeframe={true}
            />
          </div>
        </div>
        {/* Loading State */}
        {isLoading && articles.length === 0 && (
          <div className="bg-white rounded-2xl p-8">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <div className="space-y-2">
                <p className="font-medium">Loading articles...</p>
                <p className="text-sm text-muted-foreground">
                  Fetching the latest articles from the blockchain
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-white rounded-2xl p-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-red-600" />
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
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Articles */}
        {articles.map((article) => {
          const displayArticle = formatArticleForDisplay(article)
          return (
            <FeedPost
              key={article.articleId}
              author={displayArticle.author}
              title={displayArticle.title}
              description={displayArticle.description}
              engagement={displayArticle.engagement}
              hasReadMore={true}
              slug={article.slug}
              onClick={() => handleArticleClick(article.slug)}
              publication={{
                id: article.publicationId,
                name: (article as { publicationName?: string }).publicationName || article.followInfo?.publicationName || `Publication ${article.publicationId.slice(0, 8)}...`
              }}
              articleId={article.articleId}
              publicationId={article.publicationId}
              totalTips={article.totalTips}
            />
          )
        })}

        {/* Empty State */}
        {!isLoading && !error && articles.length === 0 && (
          <div className="bg-white rounded-2xl p-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-gray-400" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-gray-900">
                  {feedType === 'fresh' && 'No Articles Found'}
                  {feedType === 'popular' && `No Popular Articles This ${timeframe === 'day' ? 'Day' : timeframe === 'week' ? 'Week' : 'Month'}`}
                  {feedType === 'my' && 'No Articles in Your Feed'}
                </h2>
                <p className="text-muted-foreground">
                  {feedType === 'fresh' && 'No articles have been published yet. Be the first to create content!'}
                  {feedType === 'popular' && `No articles have gained popularity in the selected timeframe. Try a different timeframe or check back later.`}
                  {feedType === 'my' && 'You haven\'t followed any publications yet, or they haven\'t published articles recently.'}
                </p>
              </div>
              <div className="flex gap-3 justify-center">
                {feedType === 'fresh' && (
                  <Button onClick={() => router.push('/create')} className="gap-2">
                    Create Article
                  </Button>
                )}
                {feedType === 'my' && (
                  <Button onClick={() => router.push('/feed?type=fresh')} variant="outline">
                    Browse All Articles
                  </Button>
                )}
                {feedType === 'popular' && (
                  <Button onClick={() => setTimeframe('week')} variant="outline">
                    Try Week View
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
              <Loader2 className="h-4 w-4" />
              Load More Articles
            </Button>
          </div>
        )}

      </div>
    </AppLayout>
  )
}