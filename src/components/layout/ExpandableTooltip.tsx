"use client"

import { ReactNode, useState } from "react"
import { cn } from "@/lib/utils"

interface ExpandableTooltipProps {
  children: ReactNode
  label: string
  isCompact: boolean
  isActive?: boolean
  hasNotification?: boolean
}

export function ExpandableTooltip({ 
  children, 
  label, 
  isCompact, 
  isActive = false,
  hasNotification = false 
}: ExpandableTooltipProps) {
  const [isHovered, setIsHovered] = useState(false)

  if (!isCompact) {
    return <>{children}</>
  }

  return (
    <div className="relative group">
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {children}
      </div>
      
      {/* Hover expansion */}
      <div
        className={cn(
          "absolute left-0 top-0 bg-white rounded-lg shadow-lg border transition-all duration-200 z-50 whitespace-nowrap",
          "opacity-0 scale-95 translate-x-2 pointer-events-none",
          isHovered && "opacity-100 scale-100 translate-x-14 pointer-events-auto",
          isActive ? "border-primary/20" : "border-gray-200"
        )}
      >
        <div className={cn(
          "flex items-center gap-2 px-3 py-2 text-sm font-medium",
          isActive ? "text-primary" : "text-black"
        )}>
          <span>{label}</span>
          {hasNotification && (
            <div className="size-1.5 bg-primary rounded"></div>
          )}
        </div>
      </div>
    </div>
  )
}