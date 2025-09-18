"use client"

import { AppLayout, RightSidebar } from "@/components/layout"
import { FeedPost } from "@/components/feed/FeedPost"
import { TopWriters } from "@/components/widgets/TopWriters"
import { PopularComments } from "@/components/widgets/PopularComments"
import { Button } from "@/components/ui/button"
import { useFeedArticles } from "@/hooks/useFeedArticles"
import { Loader2, AlertCircle, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"

export default function FeedPage() {
  const router = useRouter()
  const { 
    articles, 
    isLoading, 
    error, 
    hasMore, 
    loadMore, 
    refresh, 
    clearError,
    formatArticleForDisplay 
  } = useFeedArticles()

  const handleArticleClick = (slug: string) => {
    router.push(`/article?id=${encodeURIComponent(slug)}`)
  }

  const handleRetry = () => {
    clearError()
    refresh()
  }

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
              key={article.id}
              author={displayArticle.author}
              title={displayArticle.title}
              description={displayArticle.description}
              engagement={displayArticle.engagement}
              hasReadMore={true}
              slug={article.slug}
              onClick={() => handleArticleClick(article.slug)}
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
                  No Articles Found
                </h2>
                <p className="text-muted-foreground">
                  No articles have been published yet. Be the first to create content!
                </p>
              </div>
              <Button onClick={() => router.push('/create')} className="gap-2">
                Create Article
              </Button>
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