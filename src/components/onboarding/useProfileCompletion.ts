"use client"

import { useState, useEffect, useCallback } from "react"
import { usePathname } from "next/navigation"
import { ONBOARDING_CONFIG } from "./onboarding-config"
import { log } from "@/lib/utils/Logger"

const PROFILE_COMPLETION_STORAGE_KEY = 'inkray-profile-completion-prompted'

interface UseProfileCompletionReturn {
  shouldShow: boolean
  complete: () => void
  skip: () => void
  isHydrated: boolean
}

function getStorageValue(key: string): boolean {
  if (typeof window === "undefined") {
    return false
  }

  try {
    return localStorage.getItem(key) === 'true'
  } catch (error) {
    log.warn(`Failed to read ${key} from localStorage`, { error }, "useProfileCompletion")
    return false
  }
}

function setStorageValue(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch (error) {
    log.warn(`Failed to save ${key} to localStorage`, { error }, "useProfileCompletion")
  }
}

function shouldShowForRoute(pathname: string): boolean {
  // Don't show on the homepage/landing page
  if (pathname === '/') {
    return false
  }

  // Show on app pages (same routes as onboarding)
  const appRoutes = ['/feed', '/auth', '/create', '/publication', '/article']
  return appRoutes.some(route => pathname.startsWith(route))
}

export function useProfileCompletion(): UseProfileCompletionReturn {
  const pathname = usePathname()
  const [isHydrated, setIsHydrated] = useState(false)
  const [isPrompted, setIsPrompted] = useState<boolean>(() => getStorageValue(PROFILE_COMPLETION_STORAGE_KEY))
  const [isOnboardingComplete, setIsOnboardingComplete] = useState<boolean>(() => getStorageValue(ONBOARDING_CONFIG.localStorageKey))

  // Mark as hydrated after mount
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Recheck localStorage after hydration and listen for changes
  useEffect(() => {
    if (isHydrated) {
      setIsPrompted(getStorageValue(PROFILE_COMPLETION_STORAGE_KEY))
      setIsOnboardingComplete(getStorageValue(ONBOARDING_CONFIG.localStorageKey))
    }
  }, [isHydrated])

  // Listen for storage changes (when onboarding completes)
  useEffect(() => {
    const handleStorageChange = () => {
      setIsOnboardingComplete(getStorageValue(ONBOARDING_CONFIG.localStorageKey))
      setIsPrompted(getStorageValue(PROFILE_COMPLETION_STORAGE_KEY))
    }

    // Check periodically for localStorage changes (same-tab updates don't trigger storage event)
    const interval = setInterval(handleStorageChange, 500)

    // Also listen for storage events from other tabs
    window.addEventListener('storage', handleStorageChange)

    return () => {
      clearInterval(interval)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  const markAsCompleted = useCallback(() => {
    setStorageValue(PROFILE_COMPLETION_STORAGE_KEY, 'true')
    setIsPrompted(true)
    log.debug("Profile completion marked as done", {}, "useProfileCompletion")
  }, [])

  const complete = useCallback(() => {
    markAsCompleted()
  }, [markAsCompleted])

  const skip = useCallback(() => {
    markAsCompleted()
    log.debug("Profile completion skipped", {}, "useProfileCompletion")
  }, [markAsCompleted])

  // Show profile completion prompt when:
  // 1. Component is hydrated (SSR safe)
  // 2. Onboarding is complete
  // 3. Profile completion hasn't been prompted yet
  // 4. User is on an eligible route
  const shouldShow = isHydrated && isOnboardingComplete && !isPrompted && shouldShowForRoute(pathname)

  return {
    shouldShow,
    complete,
    skip,
    isHydrated,
  }
}
