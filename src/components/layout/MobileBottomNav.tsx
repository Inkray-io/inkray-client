"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { ROUTES } from "@/constants/routes"
import { MobileMenu } from "./MobileMenu"
import {
  HiBolt,
  HiBookmark,
  HiRocketLaunch,
  HiPlus,
  HiBars3,
} from "react-icons/hi2"
import type { IconType } from "react-icons"

interface NavItem {
  id: string
  label: string
  icon: IconType
  href: string
  isActive: (pathname: string, type: string | null) => boolean
}

// Two tabs flank the centered Create action on each side. The rest of the
// destinations (profile, leaderboard, categories, wallet) live in the menu.
const LEFT_ITEMS: NavItem[] = [
  {
    id: "home",
    label: "Home",
    icon: HiBolt,
    href: ROUTES.FEED_FRESH,
    isActive: (p, type) => p === "/feed" && type !== "bookmarks",
  },
  {
    id: "bookmarks",
    label: "Saved",
    icon: HiBookmark,
    href: ROUTES.FEED_BOOKMARKS,
    isActive: (p, type) => p === "/feed" && type === "bookmarks",
  },
]

const RIGHT_ITEMS: NavItem[] = [
  {
    id: "quests",
    label: "Quests",
    icon: HiRocketLaunch,
    href: ROUTES.QUESTS,
    isActive: (p) => p === "/quests",
  },
]

/**
 * Fixed bottom navigation for mobile/tablet (hidden on lg+, where the left
 * sidebar takes over). A raised, centered Create button is the primary action;
 * two tabs flank it and the Menu opens the full drawer.
 */
export function MobileBottomNav() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const type = searchParams.get("type")

  const renderTab = (item: NavItem) => {
    const active = item.isActive(pathname, type)
    return (
      <button
        key={item.id}
        onClick={() => router.push(item.href)}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 min-h-14 transition-colors",
          active ? "text-primary" : "text-gray-500 hover:text-foreground",
        )}
      >
        <item.icon className="size-5 shrink-0" />
        <span className="text-[10px] font-medium leading-none">{item.label}</span>
      </button>
    )
  }

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-100 pb-[env(safe-area-inset-bottom)]"
      aria-label="Primary"
    >
      <div className="flex items-stretch justify-around px-1">
        {LEFT_ITEMS.map(renderTab)}

        {/* Create — the primary action, raised and centered */}
        <button
          onClick={() => router.push(ROUTES.CREATE)}
          aria-label="Create article"
          className="flex flex-1 flex-col items-center justify-center gap-1 py-2 min-h-14"
        >
          <span className="-mt-6 flex size-12 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/30 ring-4 ring-neutral-50 transition-transform active:scale-95">
            <HiPlus className="size-6" />
          </span>
          <span className="text-[10px] font-medium leading-none text-primary">
            Create
          </span>
        </button>

        {RIGHT_ITEMS.map(renderTab)}

        {/* Menu opener — opens the full drawer */}
        <MobileMenu>
          <button
            className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 min-h-14 text-gray-500 hover:text-foreground transition-colors"
            aria-label="Open menu"
          >
            <HiBars3 className="size-5 shrink-0" />
            <span className="text-[10px] font-medium leading-none">Menu</span>
          </button>
        </MobileMenu>
      </div>
    </nav>
  )
}
