"use client"

import { ReactNode } from "react"
import { AppHeader } from "./AppHeader"
import { AppSidebar } from "./AppSidebar"
import { cn } from "@/lib/utils"

interface AppLayoutProps {
  children: ReactNode
  rightSidebar?: ReactNode
  showRightSidebar?: boolean
  className?: string
  currentPage?: string
}

export function AppLayout({ 
  children, 
  rightSidebar, 
  showRightSidebar = true, 
  className,
  currentPage = "feed"
}: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-neutral-50">
      <AppHeader />

      {/* Main Content */}
      <div className={cn("px-4 sm:px-8 lg:px-[60px] xl:px-[80px] pb-[124px] max-w-[2000px] xl:max-w-[2600px] 2xl:max-w-[3000px] mx-auto", className)}>
        <div className="flex flex-col lg:flex-row gap-5 lg:gap-10">
          {/* Left Sidebar - Hidden on mobile, shown in mobile menu */}
          <div className="hidden lg:block flex-shrink-0">
            <AppSidebar currentPage={currentPage} />
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            {children}
          </div>

          {/* Right Sidebar - Responsive */}
          {showRightSidebar && rightSidebar && (
            <div className="w-full lg:w-[240px]">
              {rightSidebar}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}