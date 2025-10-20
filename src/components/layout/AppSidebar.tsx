"use client"

import { cn } from "@/lib/utils"
import { ROUTES } from "@/constants/routes"
import { useSidebarMode } from "@/hooks/useSidebarMode"
import { SidebarToggle } from "./SidebarToggle"
import { ExpandableTooltip } from "./ExpandableTooltip"
import { useRouter, useSearchParams } from "next/navigation"

interface AppSidebarProps {
  currentPage?: string
  className?: string
}

export function AppSidebar({ currentPage = "feed", className }: AppSidebarProps) {
  const { isCompact, toggleMode, isHydrated } = useSidebarMode()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Determine current feed type from URL
  const currentFeedType = searchParams.get('type') || 'fresh'
  const topics = [
    { name: "Protocols", color: "bg-purple-400" },
    { name: "DeFi", color: "bg-yellow-300" },
    { name: "AI", color: "bg-green-400" },
    { name: "Governance", color: "bg-orange-300" },
    { name: "Investments", color: "bg-pink-500" },
    { name: "Community", color: "bg-blue-900" },
    { name: "Markets", color: "bg-purple-500" },
    { name: "Builders", color: "bg-orange-500" },
    { name: "Events", color: "bg-red-500" }
  ]

  const navigationItems = [
    {
      id: "popular",
      label: "Popular",
      icon: "👑",
      active: currentPage === "feed" && currentFeedType === "popular",
      href: ROUTES.FEED_POPULAR
    },
    {
      id: "fresh",
      label: "Fresh",
      icon: "⚡",
      active: currentPage === "feed" && currentFeedType === "fresh",
      href: ROUTES.FEED_FRESH,
      hasNotification: false
    },
    {
      id: "my-feed",
      label: "My feed",
      icon: "🖱️",
      active: currentPage === "feed" && currentFeedType === "my",
      href: ROUTES.FEED_MY_FEED
    }
  ]

  const inkrayLinks = [
    {
      id: "about",
      label: "About the project",
      icon: "ℹ️",
      href: ROUTES.ABOUT
    },
    {
      id: "rules",
      label: "Rules",
      icon: "📋",
      href: ROUTES.RULES
    },
    {
      id: "advertising",
      label: "Advertising",
      icon: "⭐",
      href: ROUTES.ADVERTISING
    }
  ]

  return (
    <div
      className={cn(
        "bg-white rounded-2xl p-4 h-fit relative",
        isHydrated && "transition-all duration-300",
        isCompact ? "w-[60px]" : "w-[240px]",
        className
      )}
    >
      {/* Toggle Button */}
      <SidebarToggle isCompact={isCompact} onToggle={toggleMode} />

      <div className={cn("space-y-4 mt-10", isCompact && "items-center")}>
        {/* Navigation */}
        <div className="space-y-0.5">
          {navigationItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between">
              <ExpandableTooltip
                label={item.label}
                isCompact={isCompact}
                isActive={item.active}
                hasNotification={item.hasNotification}
              >
                <button
                  onClick={() => router.push(item.href)}
                  className={cn(
                    "flex items-center gap-2 px-2.5 py-1.5 rounded-lg w-full text-left transition-colors text-sm",
                    item.active
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-gray-50 text-black",
                    isCompact && "justify-center px-2"
                  )}
                >
                  <div className="size-4 text-xs flex-shrink-0">{item.icon}</div>
                  {!isCompact && <span className="font-medium">{item.label}</span>}
                </button>
              </ExpandableTooltip>
              {item.hasNotification && !isCompact && (
                <div className="size-1.5 bg-primary rounded mr-2"></div>
              )}
            </div>
          ))}
        </div>

        {/* Topics */}
        {!isCompact && (
          <div className="space-y-0.5">
            <div className="px-2.5 py-1.5">
              <h3 className="font-medium text-black text-sm">Topics</h3>
            </div>

            <div className="space-y-0.5">
              {topics.map((topic) => (
                <button
                  key={topic.name}
                  className="w-full px-2.5 py-1.5 rounded-lg hover:bg-gray-50 text-left transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className={`size-4 rounded-lg ${topic.color}`} />
                    <span className="font-medium text-black text-sm">{topic.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Topics - Compact Mode */}
        {isCompact && (
          <div className="space-y-0.5">
            {topics.slice(0, 3).map((topic) => (
              <ExpandableTooltip
                key={topic.name}
                label={topic.name}
                isCompact={isCompact}
              >
                <button className="w-full px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors flex justify-center">
                  <div className={`size-4 rounded-lg ${topic.color}`} />
                </button>
              </ExpandableTooltip>
            ))}
            {topics.length > 3 && (
              <ExpandableTooltip
                label="More topics..."
                isCompact={isCompact}
              >
                <button className="w-full px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors flex justify-center">
                  <div className="size-4 rounded-lg bg-gray-400" />
                </button>
              </ExpandableTooltip>
            )}
          </div>
        )}

        {/* Inkray.io */}
        {!isCompact && (
          <div className="space-y-0.5">
            <div className="px-2.5 py-1.5">
              <h3 className="font-medium text-black text-sm">Inkray.io</h3>
            </div>

            <div className="space-y-0.5">
              {inkrayLinks.map((link) => (
                <button
                  key={link.id}
                  className="w-full px-2.5 py-1.5 rounded-lg hover:bg-gray-50 text-left transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="size-4 text-xs">{link.icon}</div>
                    <span className="font-medium text-black text-sm">{link.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Inkray.io - Compact Mode */}
        {isCompact && (
          <div className="space-y-0.5">
            {inkrayLinks.map((link) => (
              <ExpandableTooltip
                key={link.id}
                label={link.label}
                isCompact={isCompact}
              >
                <button className="w-full px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors flex justify-center">
                  <div className="size-4 text-xs">{link.icon}</div>
                </button>
              </ExpandableTooltip>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}