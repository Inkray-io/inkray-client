"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SidebarToggleProps {
  isCompact: boolean
  onToggle: () => void
  className?: string
}

export function SidebarToggle({ isCompact, onToggle, className }: SidebarToggleProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onToggle}
      className={cn(
        "hidden lg:flex h-6 w-6 p-0 hover:bg-gray-100 transition-colors absolute top-4 right-4",
        className
      )}
      title={isCompact ? "Expand sidebar" : "Collapse sidebar"}
    >
      {isCompact ? (
        <ChevronRight className="h-3 w-3" />
      ) : (
        <ChevronLeft className="h-3 w-3" />
      )}
    </Button>
  )
}