"use client"

import { useState, useEffect, useCallback } from "react"
import { log } from '@/lib/utils/Logger'

type SidebarMode = "expanded" | "compact"

const SIDEBAR_MODE_KEY = "inkray-sidebar-mode"
const DEFAULT_MODE: SidebarMode = "expanded"

interface UseSidebarModeReturn {
  isCompact: boolean
  isExpanded: boolean
  mode: SidebarMode
  toggleMode: () => void
  setMode: (mode: SidebarMode) => void
  isHydrated: boolean
}

// Function to get initial mode synchronously
function getInitialMode(): SidebarMode {
  if (typeof window === "undefined") {
    return DEFAULT_MODE
  }
  
  try {
    const savedMode = localStorage.getItem(SIDEBAR_MODE_KEY) as SidebarMode
    return (savedMode === "expanded" || savedMode === "compact") ? savedMode : DEFAULT_MODE
  } catch (error) {
    return DEFAULT_MODE
  }
}

/**
 * Hook for managing sidebar mode with localStorage persistence
 * Prevents hydration mismatch and flash of wrong state
 */
export function useSidebarMode(): UseSidebarModeReturn {
  const [mode, setModeState] = useState<SidebarMode>(() => getInitialMode())
  const [isHydrated, setIsHydrated] = useState(false)

  // Mark as hydrated after mount
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Save mode to localStorage whenever it changes
  const setMode = useCallback((newMode: SidebarMode) => {
    setModeState(newMode)
    try {
      localStorage.setItem(SIDEBAR_MODE_KEY, newMode)
    } catch (error) {
      log.warn("Failed to save sidebar mode to localStorage", { error }, 'useSidebarMode')
    }
  }, [])

  // Toggle between modes
  const toggleMode = useCallback(() => {
    if (!isHydrated) return
    const newMode = mode === "expanded" ? "compact" : "expanded"
    setMode(newMode)
  }, [mode, setMode, isHydrated])

  return {
    isCompact: mode === "compact",
    isExpanded: mode === "expanded", 
    mode,
    toggleMode,
    setMode,
    isHydrated
  }
}
