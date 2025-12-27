"use client"

import { useRouter } from "next/navigation"
import { MoreHorizontal, MessageCircle, Link, Share, Check, ExternalLink, Trash2, FileText, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/constants/routes"
import { TipButton } from "@/components/article/TipButton"
import { TipDisplay } from "@/components/ui/TipDisplay"
import { Avatar } from "@/components/ui/Avatar"
import { createPublicationAvatarConfig, createUserAvatarConfig } from "@/lib/utils/avatar"
import { SuiIcon } from "@/components/ui/SuiIcon"
import { LikeButton } from "@/components/like/LikeButton"
import { BookmarkButton } from "@/components/bookmark/BookmarkButton"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { useLikes } from "@/hooks/useLikes"
import { useBookmarks } from "@/hooks/useBookmarks"
import { useState } from "react"
import { copyToClipboard, formatAddress } from "@/utils/address"
import { SubscriptionButton } from "@/components/subscription"
import { log } from "@/lib/utils/Logger"
import { useFollows } from "@/hooks/useFollows"
import { FollowButton } from "@/components/follow/FollowButton"
import { useWalletConnection } from "@/hooks/useWalletConnection"
import { VerifiedBadge } from "@/components/ui/VerifiedBadge"

interface FeedPostProps {
  author: {
    name: string
    avatar: string | null
    address?: string // Full address for proper avatar config generation
    mintedBy: number
    date: string
    readTime: string
  }
  title: string
  description: string
  image?: string
  hasReadMore?: boolean
  engagement?: {
    likes: number
    comments: number
    views: number
    pageViews?: number
    chatViews?: number
    isLiked?: boolean
    isBookmarked?: boolean
    bookmarkCount?: number
  }
  // Optional slug for navigation - if not provided, will generate from title
  slug?: string
  // Click handler to allow custom navigation
  onClick?: () => void
  // Publication information for linking
  publication?: {
    id: string
    name: string
    avatar?: string | null
    owner?: string
    isVerified?: boolean
  }
  // Article information for tipping
  articleId?: string
  publicationId?: string
  totalTips?: number
  // Subscription information
  subscriptionInfo?: {
    id: string
    subscriptionPrice: number // in MIST
    subscriptionPeriod: number // in days
    publicationName?: string
    isSubscribed?: boolean
    subscriptionExpiresAt?: Date
  }
  // Follow information
  isFollowing?: boolean
  followerCount?: number
  // Control whether to show follow button (hide on publication-specific feeds)
  showFollowButton?: boolean
  // Article deletion props
  vaultId?: string
  onDelete?: (articleId: string, publicationId: string, vaultId: string) => void
  isDeleting?: boolean;
  isOffline?: boolean;
}

export function FeedPost({
  author,
  title,
  description,
  image,
  hasReadMore = false,
  engagement,
  slug,
  onClick,
  publication,
  articleId,
  publicationId,
  totalTips,
  subscriptionInfo,
  isFollowing,
  followerCount,
  showFollowButton = true, // Default to true for backward compatibility
  vaultId,
  onDelete,
  isDeleting = false,
  isOffline = false,
}: FeedPostProps) {
  const router = useRouter()
  const { address } = useWalletConnection()
  const [isTipDialogOpen, setIsTipDialogOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)
  // const [isSubscriptionDialogOpen, setIsSubscriptionDialogOpen] = useState(false) // Commented out as it's not used yet

  // Initialize follows hook if publicationId is available
  const followsHook = useFollows(
    publicationId || '',
    publicationId ? {
      isFollowing: isFollowing || false,
      followerCount: followerCount || 0,
    } : undefined
  )

  // Initialize likes hook if articleId is available
  const likesHook = useLikes(
    articleId || '',
    articleId ? {
      isLiked: engagement?.isLiked || false,
      likeCount: engagement?.likes || 0,
    } : undefined
  )

  // Initialize bookmarks hook if articleId is available
  const bookmarksHook = useBookmarks(
    articleId || '',
    articleId ? {
      isBookmarked: engagement?.isBookmarked || false,
      bookmarkCount: engagement?.bookmarkCount || 0,
    } : undefined
  )
  
  // Create proper avatar config for the author
  const authorAvatarConfig = createUserAvatarConfig({
    publicKey: author.address || author.name, // Use full address if available, otherwise use name
    avatar: author.avatar,
  }, 'md');

  const publicationAvatarConfig = publication
    ? createPublicationAvatarConfig(
        {
          id: publication.id,
          name: publication.name,
          avatar: publication.avatar ?? null,
        },
        'md'
      )
    : null;

  const displayAvatarConfig = publicationAvatarConfig || authorAvatarConfig;

  const displayAuthor = author.address
    ? formatAddress(author.address)
    : author.name;

  // Check if current user can delete this article (publication owner)
  const canDeleteArticle = publication && 
    address === publication.owner && 
    articleId && 
    publicationId && 
    vaultId && 
    onDelete;
  
  const handleArticleClick = () => {
    if (onClick) {
      onClick()
    } else if (slug) {
      // Use the real slug if provided
      router.push(ROUTES.ARTICLE_WITH_ID(slug))
    } else {
      // Fallback: generate ID from title
      const articleId = title.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
      router.push(ROUTES.ARTICLE_WITH_ID(articleId))
    }
  }

  const handlePublicationClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (publication?.id) {
      router.push(ROUTES.PUBLICATION_WITH_ID(publication.id))
    }
  }

  const handleLikeToggle = async () => {
    await likesHook.toggleLike();
  }

  const handleBookmarkToggle = async () => {
    await bookmarksHook.toggleBookmark();
  }

  const handleFollowToggle = async () => {
    await followsHook.toggleFollow();
  }

  const handleCopyLink = async () => {
    if (copied) return // Prevent multiple clicks while in copied state
    
    try {
      // Generate article URL
      const articleSlug = slug || title.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
      
      const articleUrl = `${window.location.origin}${ROUTES.ARTICLE_WITH_ID(articleSlug)}`
      
      // Copy to clipboard
      await copyToClipboard(articleUrl)
      
      // Show success state
      setCopied(true)
      
      // Reset after 2 seconds
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      // Silently fail - no toast needed as per requirement
      log.error('Failed to copy link', { error }, 'FeedPost')
    }
  }

  const generateShareUrls = (articleUrl: string, title: string) => {
    const encodedUrl = encodeURIComponent(articleUrl)
    const encodedTitle = encodeURIComponent(title)
    
    return {
      twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      reddit: `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
    }
  }

  const handleShareClick = () => {
    setIsShareOpen(!isShareOpen)
  }

  const handleSharePlatform = (platform: string) => {
    // Generate article URL
    const articleSlug = slug || title.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
    
    const articleUrl = `${window.location.origin}${ROUTES.ARTICLE_WITH_ID(articleSlug)}`
    const shareUrls = generateShareUrls(articleUrl, title)
    
    // Open sharing URL in new tab
    const url = shareUrls[platform as keyof typeof shareUrls]
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
    
    // Close popup
    setIsShareOpen(false)
  }

  const handleDeleteArticle = () => {
    if (canDeleteArticle && articleId && publicationId && vaultId && onDelete) {
      onDelete(articleId, publicationId, vaultId)
    }
  }
  
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5">
      {/* Author Header */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2.5">
          <Avatar
            {...displayAvatarConfig}
            size="sm"
          />
          <div className="flex flex-col">
            {publication ? (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePublicationClick}
                  className="font-semibold text-black text-xs text-left hover:text-primary transition-colors"
                >
                  {publication.name}
                </button>
                {publication.isVerified && <VerifiedBadge size="sm" />}
              </div>
            ) : (
              <div className="font-semibold text-black text-xs">{author.name}</div>
            )}
            <div className="text-[11px] text-gray-500">
              By{" "}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (author.address) {
                    router.push(ROUTES.PROFILE_WITH_ID(author.address))
                  }
                }}
                className="font-medium hover:text-primary hover:underline transition-colors"
              >
                {displayAuthor}
              </button>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Subscription Button - show only if subscription is available */}
          {subscriptionInfo && publicationId && (
            <SubscriptionButton
              publicationId={publicationId}
              subscriptionInfo={subscriptionInfo}
              isSubscribed={subscriptionInfo.isSubscribed}
              subscriptionExpiresAt={subscriptionInfo.subscriptionExpiresAt}
              onSubscriptionSuccess={() => {
                // Refresh feed or show success state
                log.debug('Subscription successful', {}, 'FeedPost');
              }}
              variant="button"
            />
          )}

          {/* Follow Button */}
          {publicationId && showFollowButton && (
            <FollowButton
              isFollowing={followsHook.isFollowing}
              isLoading={followsHook.isLoading}
              followerCount={followsHook.followerCount}
              onToggleFollow={handleFollowToggle}
              showFollowerCount={false}
              className="h-7 px-2.5 text-xs"
              disabled={isOffline}
            />
          )}
          {canDeleteArticle && !isOffline ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleDeleteArticle}
              disabled={isOffline || isDeleting}
            >
              <Trash2 className="size-4" />
            </Button>
          ) : (
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="size-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2.5">
        <div>
          <h2
            className="text-sm sm:text-base font-semibold text-black cursor-pointer hover:text-primary transition-colors leading-snug"
            onClick={handleArticleClick}
          >
            {title}
          </h2>
          <div className="text-[11px] text-gray-500 mt-0.5">
            Minted by <span className="font-medium">{author.mintedBy}</span> • {author.date} • {author.readTime}
          </div>
          <p className="text-gray-600 text-xs sm:text-sm mt-1.5 leading-relaxed line-clamp-2">
            {description}
          </p>
        </div>

        {image && (
          <div
            className="rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
            onClick={handleArticleClick}
          >
            <img
              src={image}
              alt="Post image"
              className="w-full h-[140px] sm:h-[180px] md:h-[200px] object-cover"
            />
          </div>
        )}

        {(hasReadMore || engagement) && (
          <div className="space-y-2">
            {hasReadMore && (
              <div
                className="text-primary text-xs font-medium cursor-pointer hover:underline"
                onClick={handleArticleClick}
              >
                Read more
              </div>
            )}

            {engagement && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 sm:gap-3 flex-wrap">
                  {articleId ? (
                    <LikeButton
                      isLiked={likesHook.isLiked}
                      isLoading={likesHook.isLoading}
                      likeCount={likesHook.likeCount}
                      onToggleLike={handleLikeToggle}
                      showLikeCount={true}
                      variant="engagement"
                      disabled={isOffline}
                    />
                  ) : (
                    <button className="flex items-center gap-1 p-0.5 rounded hover:bg-gray-100 transition-colors group">
                      <span className="text-[11px] text-gray-500">{engagement.likes}</span>
                    </button>
                  )}
                  <button className="flex items-center gap-1 p-0.5 rounded hover:bg-gray-100 transition-colors group">
                    <MessageCircle className="size-3.5 text-gray-500 group-hover:text-gray-600" />
                    <span className="text-gray-500 text-xs group-hover:text-gray-600">{engagement.comments}</span>
                  </button>
                  {publicationId && (
                    <button
                      className="flex items-center gap-1 p-0.5 rounded hover:bg-gray-100 transition-colors group"
                      onClick={() => setIsTipDialogOpen(true)}
                    >
                      <SuiIcon className="size-3.5 text-gray-500 group-hover:text-gray-600" />
                      <span className="text-gray-500 text-xs group-hover:text-gray-600">
                        <TipDisplay amount={totalTips || 0} size="sm" showIcon={false} inheritColor={true} />
                      </span>
                    </button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6 hover:bg-gray-100 transition-colors"
                    onClick={handleCopyLink}
                  >
                    {copied ? (
                      <Check className="size-3.5 text-green-600" />
                    ) : (
                      <Link className="size-3.5 text-gray-500" />
                    )}
                  </Button>
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6 hover:bg-gray-100 transition-colors"
                      onClick={handleShareClick}
                    >
                      <Share className="size-3.5 text-gray-500" />
                    </Button>

                    {/* Share Popup */}
                    {isShareOpen && (
                      <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                        <div className="py-0.5">
                          <button
                            onClick={() => handleSharePlatform('twitter')}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-gray-50 transition-colors"
                          >
                            <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-[10px] font-bold">𝕏</span>
                            </div>
                            <span className="text-xs font-medium text-gray-700">Twitter</span>
                            <ExternalLink className="w-3 h-3 text-gray-400 ml-auto" />
                          </button>

                          <button
                            onClick={() => handleSharePlatform('linkedin')}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-gray-50 transition-colors"
                          >
                            <div className="w-6 h-6 bg-blue-700 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-[10px] font-bold">in</span>
                            </div>
                            <span className="text-xs font-medium text-gray-700">LinkedIn</span>
                            <ExternalLink className="w-3 h-3 text-gray-400 ml-auto" />
                          </button>

                          <button
                            onClick={() => handleSharePlatform('facebook')}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-gray-50 transition-colors"
                          >
                            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-[10px] font-bold">f</span>
                            </div>
                            <span className="text-xs font-medium text-gray-700">Facebook</span>
                            <ExternalLink className="w-3 h-3 text-gray-400 ml-auto" />
                          </button>

                          <button
                            onClick={() => handleSharePlatform('reddit')}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-gray-50 transition-colors"
                          >
                            <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-[10px] font-bold">r</span>
                            </div>
                            <span className="text-xs font-medium text-gray-700">Reddit</span>
                            <ExternalLink className="w-3 h-3 text-gray-400 ml-auto" />
                          </button>

                          <hr className="my-0.5" />

                          <button
                            onClick={handleCopyLink}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-gray-50 transition-colors"
                          >
                            <div className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center flex-shrink-0">
                              {copied ? (
                                <Check className="w-3 h-3 text-white" />
                              ) : (
                                <Link className="w-3 h-3 text-white" />
                              )}
                            </div>
                            <span className="text-xs font-medium text-gray-700">
                              {copied ? 'Copied!' : 'Copy Link'}
                            </span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  {articleId && (
                    <BookmarkButton
                      isBookmarked={bookmarksHook.isBookmarked}
                      isLoading={bookmarksHook.isLoading}
                      bookmarkCount={bookmarksHook.bookmarkCount}
                      onToggleBookmark={handleBookmarkToggle}
                      showBookmarkCount={true}
                      variant="engagement"
                      disabled={isOffline}
                    />
                  )}
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 cursor-default group/views">
                      <div className="size-1.5 bg-primary rounded-full group-hover/views:scale-110 transition-transform"></div>
                      <span className="text-gray-500 text-xs group-hover/views:text-gray-700 transition-colors">{engagement.views} views</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    sideOffset={8}
                    hideArrow={true}
                    className="bg-white border border-gray-100 shadow-lg rounded-lg px-3 py-2.5 text-gray-900"
                  >
                    <div className="flex flex-col gap-1.5 min-w-[140px]">
                      <div className="text-[11px] font-semibold text-gray-900 border-b border-gray-100 pb-1.5 mb-0.5">
                        Views Breakdown
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-1.5">
                          <FileText className="size-3 text-blue-500" />
                          <span className="text-[11px] text-gray-600">Article page</span>
                        </div>
                        <span className="text-[11px] font-medium text-gray-900 tabular-nums">
                          {engagement.pageViews ?? 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="size-3 text-amber-500" />
                          <span className="text-[11px] text-gray-600">AI chat</span>
                        </div>
                        <span className="text-[11px] font-medium text-gray-900 tabular-nums">
                          {engagement.chatViews ?? 0}
                        </span>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}
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
      {publicationId && isTipDialogOpen && (
        <TipButton 
          publicationId={publicationId}
          articleTitle={title}
          isOpen={isTipDialogOpen}
          onOpenChange={setIsTipDialogOpen}
        />
      )}
    </div>
  )
}
