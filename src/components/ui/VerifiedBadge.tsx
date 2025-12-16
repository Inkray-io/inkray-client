"use client"

import { BadgeCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface VerifiedBadgeProps {
  /** Size variant - sm for feed cards, md for article headers, lg for publication pages */
  size?: "sm" | "md" | "lg"
  /** Additional CSS classes */
  className?: string
  /** Whether to show tooltip on hover */
  showTooltip?: boolean
}

const sizeConfig = {
  sm: "size-3.5",
  md: "size-4",
  lg: "size-5",
}

/**
 * VerifiedBadge - A trust seal badge for verified publications
 * Displays a blue checkmark icon with optional tooltip
 */
export function VerifiedBadge({
  size = "sm",
  className,
  showTooltip = true,
}: VerifiedBadgeProps) {
  const badge = (
    <BadgeCheck
      className={cn(
        sizeConfig[size],
        "text-white",                           // White checkmark stroke
        "fill-blue-500 dark:fill-blue-400",    // Blue background
        "inline-block shrink-0",
        "transition-transform duration-150 ease-out",
        "hover:scale-110",
        className
      )}
      aria-label="Verified publication"
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
        Verified Publication
      </TooltipContent>
    </Tooltip>
  )
}
