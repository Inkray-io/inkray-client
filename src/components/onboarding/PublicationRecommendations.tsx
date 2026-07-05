"use client"

import { useState, useCallback } from "react"
import { motion } from "framer-motion"
import { UserPlus, Check, Loader2, BadgeCheck } from "lucide-react"
import { RecommendedPublication } from "@/lib/api"
import { followsAPI } from "@/lib/api"
import { Avatar } from "@/components/ui/Avatar"
import { createPublicationAvatarConfig } from "@/lib/utils/avatar"
import { cn } from "@/lib/utils"
import { log } from "@/lib/utils/Logger"

interface PublicationRecommendationsProps {
  publications: RecommendedPublication[]
  isFallback: boolean
  isLoading?: boolean
  onFollowsChange?: (followedIds: string[]) => void
}

interface FollowStates {
  [publicationId: string]: {
    isFollowing: boolean
    isLoading: boolean
  }
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 350,
      damping: 25,
    },
  },
}

function formatFollowerCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`
  }
  return count.toString()
}

function PublicationCardSkeleton() {
  return (
    <div className="flex items-center gap-2.5 px-3 py-2.5 animate-pulse">
      <div className="size-9 rounded-full bg-muted shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 w-28 bg-muted rounded" />
        <div className="h-3 w-40 bg-muted rounded" />
      </div>
      <div className="h-7 w-16 bg-muted rounded-full" />
    </div>
  )
}

export function PublicationRecommendations({
  publications,
  isFallback,
  isLoading = false,
  onFollowsChange,
}: PublicationRecommendationsProps) {
  const [followStates, setFollowStates] = useState<FollowStates>({})

  const handleToggleFollow = useCallback(
    async (publicationId: string) => {
      const currentState = followStates[publicationId] || {
        isFollowing: false,
        isLoading: false,
      }

      if (currentState.isLoading) return

      // Optimistic update
      setFollowStates((prev) => ({
        ...prev,
        [publicationId]: {
          isFollowing: !currentState.isFollowing,
          isLoading: true,
        },
      }))

      try {
        await followsAPI.toggleFollow(publicationId)

        setFollowStates((prev) => ({
          ...prev,
          [publicationId]: {
            isFollowing: !currentState.isFollowing,
            isLoading: false,
          },
        }))

        // Notify parent of follow changes
        if (onFollowsChange) {
          const newFollowedIds = Object.entries({
            ...followStates,
            [publicationId]: { isFollowing: !currentState.isFollowing, isLoading: false },
          })
            .filter(([, state]) => state.isFollowing)
            .map(([id]) => id)
          onFollowsChange(newFollowedIds)
        }
      } catch (error) {
        log.error("Failed to toggle follow", { publicationId, error }, "PublicationRecommendations")

        // Revert optimistic update
        setFollowStates((prev) => ({
          ...prev,
          [publicationId]: {
            isFollowing: currentState.isFollowing,
            isLoading: false,
          },
        }))
      }
    },
    [followStates, onFollowsChange]
  )

  if (isLoading) {
    return (
      <div className="flex flex-col items-center space-y-4">
        <div className="text-center space-y-1.5">
          <div className="h-6 w-44 bg-muted animate-pulse rounded-md mx-auto" />
          <div className="h-3.5 w-60 bg-muted animate-pulse rounded-md mx-auto" />
        </div>
        <div className="w-full rounded-xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <PublicationCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  const followedCount = Object.values(followStates).filter((s) => s.isFollowing).length

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Header — counter lives here instead of a separate pill */}
      <div className="text-center space-y-1">
        <h2 className="text-lg font-semibold text-foreground">
          {isFallback ? "Popular publications" : "Recommended for you"}
        </h2>
        <p className="text-muted-foreground text-xs">
          {followedCount > 0 ? (
            <>
              Following{" "}
              <span className="font-semibold text-primary">{followedCount}</span>{" "}
              {followedCount === 1 ? "publication" : "publications"} — they&apos;ll
              shape your feed
            </>
          ) : isFallback ? (
            "No exact topic matches — here are the ones people follow most"
          ) : (
            "Follow a few to build a feed worth opening"
          )}
        </p>
      </div>

      {/* Publications list — capped height so Continue stays in view */}
      <motion.div
        className="w-full rounded-xl border border-gray-100 divide-y divide-gray-50 overflow-y-auto max-h-80 overscroll-contain"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {publications.map((publication) => {
          const followState = followStates[publication.id] || {
            isFollowing: false,
            isLoading: false,
          }
          const avatarConfig = createPublicationAvatarConfig(
            {
              id: publication.id,
              name: publication.name,
              avatar: publication.avatar,
            },
            "md"
          )

          return (
            <motion.div
              key={publication.id}
              variants={itemVariants}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2.5 transition-colors",
                followState.isFollowing ? "bg-primary/3" : "hover:bg-gray-50"
              )}
            >
              <Avatar {...avatarConfig} className="size-9 shrink-0" />

              {/* Name + meta on two tight lines */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <h3 className="text-sm font-medium text-foreground truncate">
                    {publication.name}
                  </h3>
                  {publication.isVerified && (
                    <BadgeCheck className="size-3.5 text-primary shrink-0" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {formatFollowerCount(publication.followerCount)}{" "}
                  {publication.followerCount === 1 ? "follower" : "followers"}
                  {publication.description && (
                    <span className="text-gray-400"> · {publication.description}</span>
                  )}
                </p>
              </div>

              {/* Compact follow pill */}
              <button
                onClick={() => handleToggleFollow(publication.id)}
                disabled={followState.isLoading}
                className={cn(
                  "flex items-center gap-1 h-7 px-2.5 rounded-full text-xs font-semibold transition-all shrink-0",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                  followState.isFollowing
                    ? "bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600"
                    : "bg-primary text-white hover:bg-primary/90",
                  followState.isLoading && "opacity-60 cursor-not-allowed"
                )}
              >
                {followState.isLoading ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : followState.isFollowing ? (
                  <Check className="size-3.5" />
                ) : (
                  <UserPlus className="size-3.5" />
                )}
                {followState.isFollowing ? "Following" : "Follow"}
              </button>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Empty state */}
      {publications.length === 0 && !isLoading && (
        <div className="text-center py-6 text-muted-foreground text-sm">
          <p>No publications found. Try selecting different topics.</p>
        </div>
      )}
    </div>
  )
}
