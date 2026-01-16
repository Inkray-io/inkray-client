"use client"

import { useState, useEffect, useCallback } from "react"
import { getCachedPublication } from "@/lib/cache-manager"
import { log } from "@/lib/utils/Logger"

const STORAGE_PREFIX = 'inkray-publication-completion-prompted-'
const FRESHNESS_THRESHOLD = 5 * 60 * 1000 // 5 minutes in milliseconds

interface UsePublicationCompletionReturn {
  shouldShow: boolean
  complete: () => void
  skip: () => void
  publicationId: string | null
  isHydrated: boolean
}

function getStorageValue(key: string): boolean {
  if (typeof window === "undefined") {
    return false
  }

  try {
    return localStorage.getItem(key) === 'true'
  } catch (error) {
    log.warn(`Failed to read ${key} from localStorage`, { error }, "usePublicationCompletion")
    return false
  }
}

function setStorageValue(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch (error) {
    log.warn(`Failed to save ${key} to localStorage`, { error }, "usePublicationCompletion")
  }
}

export function usePublicationCompletion(): UsePublicationCompletionReturn {
  const [isHydrated, setIsHydrated] = useState(false)
  const [isPrompted, setIsPrompted] = useState(false)
  const [publicationId, setPublicationId] = useState<string | null>(null)
  const [isRecentlyCreated, setIsRecentlyCreated] = useState(false)

  // Mark as hydrated after mount and check publication cache
  useEffect(() => {
    setIsHydrated(true)

    const cachedPub = getCachedPublication()
    if (cachedPub) {
      setPublicationId(cachedPub.publicationId)

      // Check if publication was recently created (within freshness threshold)
      const age = Date.now() - cachedPub.timestamp
      const isRecent = age < FRESHNESS_THRESHOLD
      setIsRecentlyCreated(isRecent)

      // Check if already prompted for this publication
      const storageKey = `${STORAGE_PREFIX}${cachedPub.publicationId}`
      const alreadyPrompted = getStorageValue(storageKey)
      setIsPrompted(alreadyPrompted)

      log.debug("Publication completion check", {
        publicationId: cachedPub.publicationId,
        age,
        isRecent,
        alreadyPrompted,
        threshold: FRESHNESS_THRESHOLD,
      }, "usePublicationCompletion")
    }
  }, [])

  const markAsCompleted = useCallback(() => {
    if (!publicationId) return

    const storageKey = `${STORAGE_PREFIX}${publicationId}`
    setStorageValue(storageKey, 'true')
    setIsPrompted(true)
    log.debug("Publication completion marked as done", { publicationId }, "usePublicationCompletion")
  }, [publicationId])

  const complete = useCallback(() => {
    markAsCompleted()
  }, [markAsCompleted])

  const skip = useCallback(() => {
    markAsCompleted()
    log.debug("Publication completion skipped", { publicationId }, "usePublicationCompletion")
  }, [markAsCompleted, publicationId])

  // Show publication completion prompt when:
  // 1. Component is hydrated (SSR safe)
  // 2. There is a cached publication
  // 3. Publication was recently created (within 5 minutes)
  // 4. User hasn't been prompted for this publication yet
  const shouldShow = isHydrated && !!publicationId && isRecentlyCreated && !isPrompted

  return {
    shouldShow,
    complete,
    skip,
    publicationId,
    isHydrated,
  }
}
