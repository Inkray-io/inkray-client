"use client"

import { Sprout } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface EarlyAdopterBadgeProps {
  /**
   * full — icon + "Early adopter" label pill (profile/publication headers).
   * minimal — icon only with tooltip (feed cards and dense listings).
   */
  variant?: "full" | "minimal"
  /** Icon size for the minimal variant — sm for feed cards, lg for headers */
  size?: "sm" | "md" | "lg"
  className?: string
  /** Whether to show the tooltip on the minimal variant */
  showTooltip?: boolean
}

const sizeConfig = {
  sm: "size-3.5",
  md: "size-4",
  lg: "size-5",
}

/**
 * EarlyAdopterBadge — marks accounts and publications that joined within the
 * launch window (see isEarlyAdopter). An emerald sprout, deliberately distinct
 * from the blue verified checkmark.
 */
export function EarlyAdopterBadge({
  variant = "minimal",
  size = "sm",
  className,
  showTooltip = true,
}: EarlyAdopterBadgeProps) {
  if (variant === "full") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50",
          "px-2 py-0.5 text-[11px] font-semibold leading-none text-emerald-700 whitespace-nowrap",
          className
        )}
        aria-label="Early adopter"
      >
        <Sprout className="size-3.5 shrink-0" />
        Early adopter
      </span>
    )
  }

  const badge = (
    <Sprout
      className={cn(
        sizeConfig[size],
        "text-emerald-500 inline-block shrink-0",
        "transition-transform duration-150 ease-out hover:scale-110",
        className
      )}
      aria-label="Early adopter"
    />
  )

  if (!showTooltip) {
    return badge
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center">{badge}</span>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        sideOffset={4}
        hideArrow
        className="bg-gray-900 dark:bg-gray-800 text-white text-[11px] font-medium px-2 py-1 rounded-md shadow-lg"
      >
        Early adopter
      </TooltipContent>
    </Tooltip>
  )
}
