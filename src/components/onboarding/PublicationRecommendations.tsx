"use client"

import { useState, useCallback } from "react"
import { motion } from "framer-motion"
import { UserPlus, UserMinus, Loader2, BadgeCheck, Sparkles } from "lucide-react"
import { RecommendedPublication } from "@/lib/api"
import { followsAPI } from "@/lib/api"
import { Avatar } from "@/components/ui/Avatar"
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
    <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card animate-pulse">
      <div className="w-12 h-12 rounded-full bg-muted" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-32 bg-muted rounded" />
        <div className="h-3 w-48 bg-muted rounded" />
        <div className="h-3 w-20 bg-muted rounded" />
      </div>
      <div className="h-8 w-20 bg-muted rounded-lg" />
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
      <div className="flex flex-col items-center space-y-6">
        <div className="text-center space-y-2">
          <div className="h-7 w-48 bg-muted animate-pulse rounded-md mx-auto" />
          <div className="h-4 w-64 bg-muted animate-pulse rounded-md mx-auto" />
        </div>
        <div className="w-full max-w-md space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <PublicationCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  const followedCount = Object.values(followStates).filter((s) => s.isFollowing).length

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">
          {isFallback ? "Popular publications" : "Recommended for you"}
        </h2>
        <p className="text-muted-foreground text-sm">
          {isFallback
            ? "Discover these trending publications"
            : "Follow publications to see their articles in your feed"}
        </p>
      </div>

      {/* Followed counter */}
      {followedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20"
        >
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">
            Following {followedCount} {followedCount === 1 ? "publication" : "publications"}
          </span>
        </motion.div>
      )}

      {/* Fallback message */}
      {isFallback && !isLoading && publications.length > 0 && (
        <div className="w-full max-w-md px-4 py-3 bg-amber-50 border border-amber-100 rounded-lg text-center">
          <p className="text-sm text-amber-700">
            No exact matches for your topics — here are some popular publications instead.
          </p>
        </div>
      )}

      {/* Publications list */}
      <motion.div
        className="w-full max-w-md space-y-3"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {publications.map((publication) => {
          const followState = followStates[publication.id] || {
            isFollowing: false,
            isLoading: false,
          }

          return (
            <motion.div
              key={publication.id}
              variants={itemVariants}
              className={cn(
                "flex items-center gap-4 p-4 rounded-xl border transition-all duration-200",
                followState.isFollowing
                  ? "border-primary/30 bg-primary/5"
                  : "border-border bg-card hover:border-border/80 hover:bg-accent/30"
              )}
            >
              {/* Avatar */}
              <Avatar
                src={publication.avatar}
                alt={publication.name}
                size="lg"
                fallbackText={publication.name.charAt(0).toUpperCase()}
                gradientColors="from-blue-500 to-purple-600"
              />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-semibold text-foreground truncate">
                    {publication.name}
                  </h3>
                  {publication.isVerified && (
                    <BadgeCheck className="w-4 h-4 text-primary flex-shrink-0" />
                  )}
                </div>
                {publication.description && (
                  <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                    {publication.description}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {formatFollowerCount(publication.followerCount)}{" "}
                  {publication.followerCount === 1 ? "follower" : "followers"}
                </p>
              </div>

              {/* Follow button */}
              <motion.button
                onClick={() => handleToggleFollow(publication.id)}
                disabled={followState.isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                  followState.isFollowing
                    ? "bg-muted text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                    : "bg-primary text-primary-foreground hover:bg-primary/90",
                  followState.isLoading && "opacity-60 cursor-not-allowed"
                )}
              >
                {followState.isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : followState.isFollowing ? (
                  <UserMinus className="w-4 h-4" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                <span>{followState.isFollowing ? "Following" : "Follow"}</span>
              </motion.button>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Empty state */}
      {publications.length === 0 && !isLoading && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No publications found. Try selecting different topics.</p>
        </div>
      )}
    </div>
  )
}
