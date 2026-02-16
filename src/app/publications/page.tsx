"use client"

import { RequireAuth } from "@/components/auth/RequireAuth"
import { AppLayout } from "@/components/layout"
import { usePublications } from "@/hooks/usePublications"
import { Avatar } from "@/components/ui/Avatar"
import { VerifiedBadge } from "@/components/ui/VerifiedBadge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { BackButton } from "@/components/ui/BackButton"
import { ROUTES } from "@/constants/routes"
import { useRouter } from "next/navigation"
import { Loader2, Search, Users, FileText, AlertCircle, RefreshCw } from "lucide-react"
import { useEffect, useState } from "react"

function PublicationsPageContent() {
  const router = useRouter()
  const {
    publications,
    pagination,
    isLoading,
    error,
    search,
    setSearch,
    loadMore,
    refetch,
  } = usePublications(20)

  const [searchInput, setSearchInput] = useState('')

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput, setSearch])

  return (
    <AppLayout currentPage="publications" showRightSidebar={false}>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <BackButton fallbackHref={ROUTES.FEED} />
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-black">Publications</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                Discover publications on Inkray
                {pagination && (
                  <span className="text-gray-400 ml-2">
                    ({pagination.total} total)
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search publications..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10 h-10 bg-gray-50 border-gray-200 focus:bg-white"
            />
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-white rounded-2xl p-6 border border-red-100">
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
              <AlertCircle className="h-8 w-8 text-gray-400" />
              <p className="text-sm text-gray-600">{error}</p>
              <Button variant="ghost" size="sm" onClick={refetch} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Try again
              </Button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && publications.length === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100">
                <div className="flex items-start gap-4">
                  <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <div className="flex gap-4 mt-3">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Publications Grid */}
        {!error && publications.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {publications.map((publication) => (
              <button
                key={publication.id}
                onClick={() => router.push(ROUTES.PUBLICATION_WITH_ID(publication.id))}
                className="bg-white rounded-2xl p-5 border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all text-left w-full"
              >
                <div className="flex items-start gap-4">
                  <Avatar {...publication.avatarConfig} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="font-semibold text-black text-sm truncate">
                        {publication.name}
                      </span>
                      {publication.isVerified && <VerifiedBadge size="sm" />}
                    </div>
                    {publication.description && (
                      <p className="text-gray-500 text-xs line-clamp-2 mb-2">
                        {publication.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {publication.followerCount} follower{publication.followerCount !== 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {publication.articleCount} article{publication.articleCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {publication.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {publication.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-[10px]"
                          >
                            {tag}
                          </span>
                        ))}
                        {publication.tags.length > 3 && (
                          <span className="px-2 py-0.5 text-gray-400 text-[10px]">
                            +{publication.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && publications.length === 0 && (
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                <Search className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-gray-600 text-sm font-medium mb-1">
                No publications found
              </p>
              {search && (
                <p className="text-gray-400 text-xs">
                  Try a different search term
                </p>
              )}
            </div>
          </div>
        )}

        {/* Load More */}
        {pagination?.hasMore && (
          <div className="text-center py-4">
            <Button
              variant="ghost"
              onClick={loadMore}
              disabled={isLoading}
              className="gap-2 text-gray-500 hover:text-gray-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                'Load more publications'
              )}
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

export default function PublicationsPage() {
  return (
    <RequireAuth redirectTo="/">
      <PublicationsPageContent />
    </RequireAuth>
  )
}
