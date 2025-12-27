"use client"

import { useState, useEffect, useRef, useCallback } from "react"

type ScrollDirection = "up" | "down" | null

interface UseScrollDirectionOptions {
  threshold?: number // Minimum scroll delta before changing direction
}

interface UseScrollDirectionReturn {
  scrollDirection: ScrollDirection
  isAtTop: boolean
  scrollY: number
}

/**
 * Hook to detect scroll direction with a threshold for stability
 * Returns current scroll direction, whether at top of page, and scroll position
 */
export function useScrollDirection(
  options: UseScrollDirectionOptions = {}
): UseScrollDirectionReturn {
  const { threshold = 5 } = options

  const [scrollDirection, setScrollDirection] = useState<ScrollDirection>(null)
  const [isAtTop, setIsAtTop] = useState(true)
  const [scrollY, setScrollY] = useState(0)

  // Track the scroll position where direction last changed
  const directionChangeY = useRef(0)
  const lastScrollY = useRef(0)
  const currentDirection = useRef<ScrollDirection>(null)
  const ticking = useRef(false)

  const updateScrollDirection = useCallback(() => {
    const currentScrollY = window.scrollY

    setScrollY(currentScrollY)
    setIsAtTop(currentScrollY < 10)

    // Calculate delta from last direction change point
    const delta = currentScrollY - directionChangeY.current

    // Determine new direction if we've moved past threshold
    if (Math.abs(delta) >= threshold) {
      const newDirection: ScrollDirection = delta > 0 ? "down" : "up"

      if (newDirection !== currentDirection.current) {
        currentDirection.current = newDirection
        setScrollDirection(newDirection)
        directionChangeY.current = currentScrollY
      }
    }

    lastScrollY.current = currentScrollY
    ticking.current = false
  }, [threshold])

  useEffect(() => {
    // Set initial scroll position
    const initialY = window.scrollY
    lastScrollY.current = initialY
    directionChangeY.current = initialY
    setScrollY(initialY)
    setIsAtTop(initialY < 10)

    const onScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(updateScrollDirection)
        ticking.current = true
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true })

    return () => {
      window.removeEventListener("scroll", onScroll)
    }
  }, [updateScrollDirection])

  return { scrollDirection, isAtTop, scrollY }
}
