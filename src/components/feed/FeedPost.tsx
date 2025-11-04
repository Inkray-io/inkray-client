"use client"

import { useRouter } from "next/navigation"
import { MoreHorizontal, MessageCircle, Link, Share, Check, ExternalLink, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/constants/routes"
import { TipButton } from "@/components/article/TipButton"
import { TipDisplay } from "@/components/ui/TipDisplay"
import { Avatar } from "@/components/ui/Avatar"
import { createPublicationAvatarConfig, createUserAvatarConfig } from "@/lib/utils/avatar"
import { SuiIcon } from "@/components/ui/SuiIcon"
import { LikeButton } from "@/components/like/LikeButton"
import { useLikes } from "@/hooks/useLikes"
import { useState } from "react"
import { copyToClipboard, formatAddress } from "@/utils/address"
import { SubscriptionButton } from "@/components/subscription"
import { log } from "@/lib/utils/Logger"
import { useFollows } from "@/hooks/useFollows"
import { FollowButton } from "@/components/follow/FollowButton"
import { useWalletConnection } from "@/hooks/useWalletConnection"

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
    isLiked?: boolean
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
  isDeleting?: boolean
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
  isDeleting = false
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
    <div className="bg-white rounded-2xl p-4 sm:p-5 md:p-6">
      {/* Author Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Avatar
            {...displayAvatarConfig}
          />
          <div className="flex flex-col">
            {publication ? (
              <button
                type="button"
                onClick={handlePublicationClick}
                className="font-semibold text-black text-sm text-left hover:text-primary transition-colors"
              >
                {publication.name}
              </button>
            ) : (
              <div className="font-semibold text-black text-sm">{author.name}</div>
            )}
            <div className="text-xs text-gray-500">
              By{" "}
              <span className="font-semibold">
                {displayAuthor}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
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
              className="min-h-[36px]"
            />
          )}
          {canDeleteArticle ? (
            <Button 
              variant="ghost" 
              size="icon" 
              className="min-h-[36px] min-w-[36px] text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleDeleteArticle}
              disabled={isDeleting}
            >
              <Trash2 className="size-5" />
            </Button>
          ) : (
            <Button variant="ghost" size="icon" className="min-h-[36px] min-w-[36px]">
              <MoreHorizontal className="size-5" />
            </Button>
          )}
        </div>
      </div>
      
      {/* Content */}
      <div className="space-y-4">
        <div>
          <h2
            className="text-base sm:text-lg font-semibold text-black cursor-pointer hover:text-primary transition-colors leading-snug"
            onClick={handleArticleClick}
          >
            {title}
          </h2>
          <div className="text-xs text-gray-500 mt-1">
            Minted by <span className="font-semibold">{author.mintedBy}</span> • {author.date} • {author.readTime}
          </div>
          <p className="text-gray-700 text-sm sm:text-base mt-3 leading-relaxed">
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
              className="w-full h-[200px] sm:h-[250px] md:h-[300px] lg:h-[333px] object-cover"
            />
          </div>
        )}

        {(hasReadMore || engagement) && (
          <div className="space-y-3">
            {hasReadMore && (
              <div 
                className="text-primary text-sm font-medium cursor-pointer hover:underline"
                onClick={handleArticleClick}
              >
                Read more
              </div>
            )}
            
            {engagement && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                  {articleId ? (
                    <LikeButton
                      isLiked={likesHook.isLiked}
                      isLoading={likesHook.isLoading}
                      likeCount={likesHook.likeCount}
                      onToggleLike={handleLikeToggle}
                      showLikeCount={true}
                      variant="engagement"
                    />
                  ) : (
                    <button className="flex items-center gap-1.5 p-1 rounded-md hover:bg-gray-100 transition-colors group">
                      <span className="text-xs text-gray-500">{engagement.likes}</span>
                    </button>
                  )}
                  <button className="flex items-center gap-1.5 p-1 rounded-md hover:bg-gray-100 transition-colors group">
                    <MessageCircle className="size-4 text-gray-600 group-hover:text-gray-700" />
                    <span className="text-gray-600 text-sm group-hover:text-gray-700">{engagement.comments}</span>
                  </button>
                  {publicationId && (
                    <button 
                      className="flex items-center gap-1.5 p-1 rounded-md hover:bg-gray-100 transition-colors group"
                      onClick={() => setIsTipDialogOpen(true)}
                    >
                      <SuiIcon className="size-4 text-gray-600 group-hover:text-gray-700" />
                      <span className="text-gray-600 text-sm group-hover:text-gray-700">
                        <TipDisplay amount={totalTips || 0} size="sm" showIcon={false} inheritColor={true} />
                      </span>
                    </button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="size-8 hover:bg-gray-100 transition-colors"
                    onClick={handleCopyLink}
                  >
                    {copied ? (
                      <Check className="size-4 text-green-600" />
                    ) : (
                      <Link className="size-4 text-gray-600" />
                    )}
                  </Button>
                  <div className="relative">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="size-8 hover:bg-gray-100 transition-colors"
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
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="size-2 bg-primary rounded"></div>
                  <span className="text-gray-600 text-sm">{engagement.views} views</span>
                </div>
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
