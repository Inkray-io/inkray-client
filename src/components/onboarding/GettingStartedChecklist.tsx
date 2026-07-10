"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import {
  HiCheckCircle,
  HiXMark,
  HiChevronRight,
  HiUser,
  HiUserGroup,
  HiHeart,
  HiPencilSquare,
} from "react-icons/hi2"
import { SiMedium } from "react-icons/si"
import { useAuth } from "@/contexts/AuthContext"
import { useProfile } from "@/hooks/useProfile"
import { useImportWritingLink } from "@/hooks/useImportWritingLink"
import { followsAPI, likesAPI, bookmarksAPI } from "@/lib/api"
import { ROUTES } from "@/constants/routes"
import { cn } from "@/lib/utils"

const DISMISSED_KEY = "inkray-getting-started-dismissed"
const FOLLOW_TARGET = 3

interface ChecklistItem {
  id: string
  icon: typeof HiUser
  label: string
  hint: string
  href: string
  done: boolean
}

function extractList(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>
    for (const key of ["follows", "likes", "bookmarks", "articles", "items", "data"]) {
      if (Array.isArray(obj[key])) return obj[key] as unknown[]
    }
  }
  return []
}

/**
 * Persistent activation checklist shown at the top of the feed for new users.
 *
 * Four steps, live-detected from real account state (research-backed: 3–5
 * items, visible progress, each row deep-links to the action). Disappears on
 * its own once everything is done, or when dismissed.
 */
export function GettingStartedChecklist() {
  const { account, isAuthenticated } = useAuth()
  const [dismissed, setDismissed] = useState(true) // assume dismissed until hydrated
  const { profile } = useProfile(isAuthenticated ? account?.publicKey : undefined)
  const importHref = useImportWritingLink()

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISSED_KEY) === "true")
    } catch {
      setDismissed(false)
    }
  }, [])

  const { data: activity } = useQuery({
    queryKey: ["getting-started-activity"],
    enabled: isAuthenticated && !dismissed,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const [follows, likes, bookmarks] = await Promise.all([
        followsAPI.getMyFollows({ limit: FOLLOW_TARGET }),
        likesAPI.getMyLikedArticles({ limit: 1 }),
        bookmarksAPI.getMyBookmarkedArticles({ limit: 1 }),
      ])
      return {
        followCount: extractList(follows.data.data ?? follows.data).length,
        hasReacted:
          extractList(likes.data.data ?? likes.data).length > 0 ||
          extractList(bookmarks.data.data ?? bookmarks.data).length > 0,
      }
    },
  })

  if (!isAuthenticated || dismissed || !activity) return null

  const items: ChecklistItem[] = [
    {
      id: "follow",
      icon: HiUserGroup,
      label: `Follow ${FOLLOW_TARGET} publications`,
      hint: "Build a feed worth opening",
      href: ROUTES.PUBLICATIONS,
      done: activity.followCount >= FOLLOW_TARGET,
    },
    {
      id: "profile",
      icon: HiUser,
      label: "Complete your profile",
      hint: "Add a bio so readers know who you are",
      href: ROUTES.PROFILE,
      done: Boolean(profile?.description && profile.description.trim().length > 0),
    },
    {
      id: "react",
      icon: HiHeart,
      label: "Like or bookmark an article",
      hint: "Reactions earn XP, too",
      href: ROUTES.FEED_POPULAR,
      done: activity.hasReacted,
    },
    {
      id: "publish",
      icon: HiPencilSquare,
      label: "Publish your first article",
      hint: "Permanent, unblockable, yours",
      href: ROUTES.CREATE,
      done: (profile?.stats?.articlesCount ?? 0) > 0,
    },
  ]

  const doneCount = items.filter((i) => i.done).length

  // Everything done — the checklist has served its purpose
  if (doneCount === items.length) return null

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISSED_KEY, "true")
    } catch {
      // non-fatal
    }
    setDismissed(true)
  }

  return (
    <div className="bg-white rounded-2xl p-4 mb-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
          Getting started
        </h3>
        <button
          onClick={handleDismiss}
          className="p-1 -m-1 rounded-md text-gray-300 hover:text-gray-500 hover:bg-gray-50 transition-colors"
          aria-label="Dismiss getting started checklist"
          title="Dismiss"
        >
          <HiXMark className="size-4" />
        </button>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2.5 mb-3">
        <div className="h-1.5 flex-1 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${(doneCount / items.length) * 100}%` }}
          />
        </div>
        <span className="text-[11px] font-semibold tabular-nums text-gray-500 shrink-0">
          {doneCount}/{items.length}
        </span>
      </div>

      {/* Items */}
      <div className="space-y-0.5">
        {items.map((item) =>
          item.done ? (
            <div
              key={item.id}
              className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg"
            >
              <HiCheckCircle className="size-5 shrink-0 text-green-500" />
              <span className="text-sm text-gray-400 line-through decoration-gray-300">
                {item.label}
              </span>
            </div>
          ) : (
            <Link
              key={item.id}
              href={item.href}
              className="group flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="flex size-5 shrink-0 items-center justify-center">
                <item.icon className="size-4 text-primary" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="text-sm font-medium text-foreground">
                  {item.label}
                </span>
                <span className="hidden sm:inline text-xs text-gray-400 ml-2">
                  {item.hint}
                </span>
              </span>
              <HiChevronRight
                className={cn(
                  "size-4 shrink-0 text-gray-300",
                  "opacity-0 group-hover:opacity-100 transition-opacity",
                )}
              />
            </Link>
          ),
        )}
      </div>

      {/* Discovery hook: bring existing writing in from Medium / elsewhere */}
      <Link
        href={importHref}
        className="group mt-2 flex items-center gap-2.5 border-t border-gray-50 px-2 pt-2.5 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <span className="flex size-5 shrink-0 items-center justify-center">
          <SiMedium className="size-4" />
        </span>
        <span className="flex-1 text-xs">
          Already write on Medium? Import your posts
        </span>
        <HiChevronRight className="size-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
      </Link>
    </div>
  )
}
