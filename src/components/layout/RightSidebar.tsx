"use client"

import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface RightSidebarProps {
  children: ReactNode
  className?: string
}

export function RightSidebar({ children, className }: RightSidebarProps) {
  return (
    <div className={cn("space-y-5", className)}>
      {children}
    </div>
  )
}