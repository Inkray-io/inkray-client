"use client"

import { AppLayout } from "@/components/layout"
import { usePublications } from "@/hooks/usePublications"
import { Avatar } from "@/components/ui/Avatar"
import { VerifiedBadge } from "@/components/ui/VerifiedBadge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { BackButton } from "@/components/ui/BackButton"
import { ROUTES } from "@/constants/routes"
import { mastheadGradient } from "@/components/ui/Identicon"
import { useRouter } from "next/navigation"
import { Loader2, Search, Users, FileText, AlertCircle, RefreshCw, Globe } from "lucide-react"
import { FaXTwitter, FaGithub, FaDiscord, FaTelegram } from "react-icons/fa6"
import type { IconType } from "react-icons"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <Skeleton className="h-20 w-full rounded-none" />
                <div className="px-4 pb-4">
                  <Skeleton className="size-12 rounded-full -mt-8 mb-2 ring-4 ring-white" />
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-3 w-24 mb-3" />
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="flex gap-4 mt-4 pt-3 border-t border-gray-100">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Publications Grid */}
        {!error && publications.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {publications.map((publication) => {
              const priceMist = Number(publication.subscriptionPrice || '0')
              const priceLabel =
                priceMist > 0
                  ? `${(priceMist / 1e9).toLocaleString(undefined, { maximumFractionDigits: 4 })} SUI/mo`
                  : 'Free'
              const sinceLabel = publication.createdAt
                ? new Date(publication.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    year: 'numeric',
                  })
                : ''
              const s = publication.socialAccounts
              const socials: { key: string; Icon: IconType }[] = s
                ? ([
                    s.twitter && { key: 'twitter', Icon: FaXTwitter },
                    s.website && { key: 'website', Icon: Globe },
                    s.github && { key: 'github', Icon: FaGithub },
                    s.discord && { key: 'discord', Icon: FaDiscord },
                    s.telegram && { key: 'telegram', Icon: FaTelegram },
                  ].filter(Boolean) as { key: string; Icon: IconType }[])
                : []

              return (
                <button
                  key={publication.id}
                  onClick={() => router.push(ROUTES.PUBLICATION_WITH_ID(publication.id))}
                  className="group flex flex-col bg-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all text-left w-full overflow-hidden"
                >
                  {/* Masthead — same deterministic hue family as the
                      publication's identicon (and its page masthead) */}
                  <div
                    className="relative h-20"
                    style={{
                      background: mastheadGradient(
                        publication.avatarConfig.seed ?? publication.id,
                      ),
                    }}
                  >
                    <span className="absolute top-2.5 right-2.5 rounded-full bg-white/85 backdrop-blur-sm px-2.5 py-1 text-[11px] font-semibold text-gray-700 shadow-sm">
                      {priceLabel}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="flex flex-1 flex-col px-4 pb-4">
                    {/* Emblem overlapping the masthead */}
                    <div className="relative z-10 -mt-8 mb-2">
                      <Avatar
                        {...publication.avatarConfig}
                        className="ring-4 ring-white shadow-sm"
                      />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-black text-base truncate group-hover:text-primary transition-colors">
                        {publication.name}
                      </span>
                      {publication.isVerified && <VerifiedBadge size="sm" />}
                    </div>
                    {sinceLabel && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Publishing since {sinceLabel}
                      </p>
                    )}

                    <p className="text-gray-500 text-sm line-clamp-2 mt-3">
                      {publication.description || 'No description yet.'}
                    </p>

                    {/* Tags */}
                    {publication.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {publication.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-[11px] font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                        {publication.tags.length > 3 && (
                          <span className="px-2 py-0.5 text-gray-400 text-[11px]">
                            +{publication.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Footer: stats + socials, pinned to the bottom */}
                    <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-3">
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1.5">
                          <Users className="size-3.5" />
                          <span className="tabular-nums font-semibold text-gray-700">
                            {publication.followerCount}
                          </span>
                          follower{publication.followerCount !== 1 ? 's' : ''}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <FileText className="size-3.5" />
                          <span className="tabular-nums font-semibold text-gray-700">
                            {publication.articleCount}
                          </span>
                          article{publication.articleCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                      {socials.length > 0 && (
                        <div className="flex items-center gap-2 text-gray-400">
                          {socials.slice(0, 4).map(({ key, Icon }) => (
                            <Icon key={key} className="size-3.5" />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
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
  return <PublicationsPageContent />
}
