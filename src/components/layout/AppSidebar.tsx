"use client"

import { Fragment } from "react"
import { cn } from "@/lib/utils"
import { ROUTES } from "@/constants/routes"
import { useSidebarMode } from "@/hooks/useSidebarMode"
import { useCategories } from "@/hooks/useCategories"
import { useCommunities } from "@/hooks/useCommunities"
import { getCategoryIcon } from "@/constants/categoryIcons"
import { SidebarToggle } from "./SidebarToggle"
import { ExpandableTooltip } from "./ExpandableTooltip"
import { Skeleton } from "@/components/ui/skeleton"
import { useRouter, useSearchParams } from "next/navigation"
import {
  HiFire,
  HiBolt,
  HiRectangleStack,
  HiBookmark,
  HiPencilSquare,
  HiInformationCircle,
  HiShieldCheck,
  HiMegaphone,
  HiSquares2X2,
  HiTrophy,
  HiRocketLaunch,
  HiUserGroup,
} from "react-icons/hi2"

interface AppSidebarProps {
  currentPage?: string
  className?: string
}

export function AppSidebar({ currentPage = "feed", className }: AppSidebarProps) {
  const { isCompact, toggleMode, isHydrated } = useSidebarMode()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { categories, isLoading: categoriesLoading } = useCategories()
  const { communities } = useCommunities()

  // Determine current feed type and category from URL
  const currentFeedType = searchParams.get('type') || 'popular'
  const currentCategory = searchParams.get('category')
  // Top 3 communities (the list endpoint is already sorted by member count) for
  // quick access as inline sub-items under the Communities nav entry.
  const topCommunities = communities.slice(0, 3)
  const currentCommunityId = searchParams.get('id')
  
  const navigationItems = [
    {
      id: "popular",
      label: "Popular",
      icon: HiFire,
      active: currentPage === "feed" && currentFeedType === "popular",
      href: ROUTES.FEED_POPULAR
    },
    {
      id: "fresh",
      label: "Fresh",
      icon: HiBolt,
      active: currentPage === "feed" && currentFeedType === "fresh",
      href: ROUTES.FEED_FRESH,
      hasNotification: false
    },
    {
      id: "my-feed",
      label: "My feed",
      icon: HiRectangleStack,
      active: currentPage === "feed" && currentFeedType === "my",
      href: ROUTES.FEED_MY_FEED
    },
    {
      id: "bookmarks",
      label: "Bookmarks",
      icon: HiBookmark,
      active: currentPage === "feed" && currentFeedType === "bookmarks",
      href: ROUTES.FEED_BOOKMARKS
    },
    {
      id: "drafts",
      label: "My drafts",
      icon: HiPencilSquare,
      active: currentPage === "drafts",
      href: ROUTES.DRAFTS
    },
    {
      id: "leaderboard",
      label: "Leaderboard",
      icon: HiTrophy,
      active: currentPage === "leaderboard",
      href: ROUTES.LEADERBOARD
    },
    {
      id: "quests",
      label: "Quests",
      icon: HiRocketLaunch,
      active: currentPage === "quests",
      href: ROUTES.QUESTS
    },
    {
      id: "communities",
      label: "Communities",
      icon: HiUserGroup,
      active: currentPage === "communities",
      href: ROUTES.COMMUNITIES
    },
  ]

  const inkrayLinks = [
    {
      id: "about",
      label: "About the project",
      icon: HiInformationCircle,
      href: ROUTES.ABOUT
    },
    {
      id: "rules",
      label: "Rules",
      icon: HiShieldCheck,
      href: ROUTES.RULES
    },
    {
      id: "advertising",
      label: "Advertising",
      icon: HiMegaphone,
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
            <Fragment key={item.id}>
              <div className="flex items-center justify-between">
                <ExpandableTooltip
                  label={item.label}
                  isCompact={isCompact}
                  isActive={item.active}
                  hasNotification={item.hasNotification}
                >
                  <button
                    onClick={() => router.push(item.href)}
                    className={cn(
                      "flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg w-full text-left transition-colors text-sm",
                      item.active
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-gray-50 text-foreground",
                      isCompact && "justify-center px-2"
                    )}
                  >
                    <item.icon className="size-4 shrink-0" />
                    {!isCompact && <span className="font-medium">{item.label}</span>}
                  </button>
                </ExpandableTooltip>
                {item.hasNotification && !isCompact && (
                  <div className="size-1.5 bg-primary rounded mr-2"></div>
                )}
              </div>

              {/* Top-3 communities as inline sub-items for quick access */}
              {!isCompact && item.id === "communities" && topCommunities.length > 0 && (
                <div className="ml-3 mt-0.5 space-y-0.5 border-l border-gray-100 pl-2.5">
                  {topCommunities.map((c) => {
                    const active =
                      currentPage === "communities" && currentCommunityId === c.slug
                    return (
                      <button
                        key={c.id}
                        onClick={() => router.push(ROUTES.COMMUNITY_WITH_ID(c.slug))}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-lg px-2.5 py-1 text-left text-[13px] transition-colors",
                          active
                            ? "bg-primary/10 text-primary"
                            : "text-gray-500 hover:bg-gray-50 hover:text-foreground"
                        )}
                      >
                        {c.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={c.avatar}
                            alt=""
                            className="size-4 shrink-0 rounded object-cover"
                          />
                        ) : (
                          <span className="flex size-4 shrink-0 items-center justify-center rounded bg-primary/10">
                            <HiUserGroup className="size-2.5 text-primary" />
                          </span>
                        )}
                        <span className="truncate">{c.name}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </Fragment>
          ))}
        </div>

        {/* Categories */}
        {!isCompact && (
          <div className="space-y-0.5">
            <h3 className="px-2.5 mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Categories
            </h3>

            <div className="space-y-0.5">
              {categoriesLoading ? (
                <div className="space-y-0.5">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-2.5 px-2.5 py-1.5">
                      <Skeleton className="size-4 rounded" />
                      <Skeleton className="h-3.5 flex-1" />
                    </div>
                  ))}
                </div>
              ) : (
                categories.map((category) => {
                  const { icon: CategoryIcon } = getCategoryIcon(category.slug)
                  const isActive = currentCategory === category.slug
                  return (
                    <button
                      key={category.id}
                      onClick={() => router.push(ROUTES.FEED_CATEGORY(category.slug))}
                      className={cn(
                        "group w-full px-2.5 py-1.5 rounded-lg text-left transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-gray-50 text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <CategoryIcon className={cn("size-4 shrink-0 transition-colors", isActive ? "text-primary" : "text-gray-400 group-hover:text-gray-600")} />
                        <span className="font-medium text-sm">{category.name}</span>
                      </div>
                    </button>
                  )
                })

              )}
            </div>
          </div>
        )}

        {/* Categories - Compact Mode */}
        {isCompact && (
          <div className="space-y-0.5">
            {!categoriesLoading && categories.slice(0, 3).map((category) => {
              const { icon: CategoryIcon } = getCategoryIcon(category.slug)
              const isActive = currentCategory === category.slug
              return (
                <ExpandableTooltip
                  key={category.id}
                  label={category.name}
                  isCompact={isCompact}
                  isActive={isActive}
                >
                  <button
                    onClick={() => router.push(ROUTES.FEED_CATEGORY(category.slug))}
                    className={cn(
                      "group w-full px-2 py-1.5 rounded-lg transition-colors flex justify-center",
                      isActive
                        ? "bg-primary/10"
                        : "hover:bg-gray-50"
                    )}
                  >
                    <CategoryIcon className={cn("size-4 transition-colors", isActive ? "text-primary" : "text-gray-400 group-hover:text-gray-600")} />
                  </button>
                </ExpandableTooltip>
              )
            })}
            {!categoriesLoading && categories.length > 3 && (
              <ExpandableTooltip
                label="More categories..."
                isCompact={isCompact}
              >
                <button className="w-full px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors flex justify-center">
                  <HiSquares2X2 className="size-4 text-gray-400" />
                </button>
              </ExpandableTooltip>
            )}
          </div>
        )}

        {/* Inkray.io */}
        {!isCompact && (
          <div className="space-y-0.5">
            <h3 className="px-2.5 mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Inkray.xyz
            </h3>

            <div className="space-y-0.5">
              {inkrayLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => router.push(link.href)}
                  className="w-full px-2.5 py-1.5 rounded-lg hover:bg-gray-50 text-left transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <link.icon className="size-4 text-gray-500 shrink-0" />
                    <span className="font-medium text-foreground text-sm">{link.label}</span>
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
                <button
                  onClick={() => router.push(link.href)}
                  className="w-full px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors flex justify-center"
                >
                  <link.icon className="size-4 text-gray-500" />
                </button>
              </ExpandableTooltip>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
