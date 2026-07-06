"use client"

import { useState } from "react"
import {
  HiFire,
  HiBolt,
  HiRectangleStack,
  HiBookmark,
  HiPencilSquare,
  HiTrophy,
  HiRocketLaunch,
  HiInformationCircle,
  HiShieldCheck,
  HiMegaphone,
  HiUser,
  HiTicket,
  HiCog6Tooth,
  HiPlus,
  HiNewspaper,
  HiBanknotes,
  HiDevicePhoneMobile,
  HiArrowTopRightOnSquare,
  HiArrowRightOnRectangle,
  HiClipboard,
  HiCheck,
} from "react-icons/hi2"
import type { IconType } from "react-icons"
import { ConnectButton } from "@mysten/dapp-kit"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet"
import { Avatar } from "@/components/ui/Avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { useWalletConnection } from "@/hooks/useWalletConnection"
import { useAuth } from "@/contexts/AuthContext"
import { useUserPublications } from "@/hooks/useUserPublications"
import { useCategories } from "@/hooks/useCategories"
import { getCategoryIcon } from "@/constants/categoryIcons"
import { getDisplayName, copyToClipboard } from "@/utils/address"
import { createUserAvatarConfig } from "@/lib/utils/avatar"
import { ROUTES } from "@/constants/routes"
import { CONFIG } from "@/lib/config"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { MobileConnectPopup } from "@/components/auth/MobileConnectPopup"

interface MobileMenuProps {
  children: React.ReactNode
  currentPage?: string
}

/** Shared row grammar — mirrors the desktop AppSidebar / profile menu. */
const ROW =
  "flex items-center gap-2.5 px-2.5 py-2 rounded-lg w-full text-left text-sm transition-colors"

/** Quick-action tile — the desktop profile-menu shortcuts, thumb-sized. */
const QUICK_TILE =
  "flex flex-col items-center gap-1.5 rounded-xl bg-white p-3 text-center hover:bg-gray-50 transition-colors"
const QUICK_TILE_ICON =
  "flex size-9 items-center justify-center rounded-full bg-primary/10"
const QUICK_TILE_LABEL = "text-[11px] font-medium text-foreground leading-tight"

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="px-2.5 mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
      {children}
    </h3>
  )
}

export function MobileMenu({ children }: MobileMenuProps) {
  const { isConnected, address, suiNSName, suiNSLoading, disconnect } =
    useWalletConnection()
  const { account, logout } = useAuth()
  const { hasPublications, firstPublication } = useUserPublications()
  const { categories, isLoading: categoriesLoading } = useCategories()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [copying, setCopying] = useState(false)
  const [showMobileConnect, setShowMobileConnect] = useState(false)

  const feedType = searchParams.get("type") || "popular"
  const activeCategory = searchParams.get("category")
  const onFeed = pathname === "/feed"

  const navItems: {
    id: string
    label: string
    icon: IconType
    href: string
    active: boolean
  }[] = [
    {
      id: "popular",
      label: "Popular",
      icon: HiFire,
      href: ROUTES.FEED_POPULAR,
      active: onFeed && feedType === "popular" && !activeCategory,
    },
    {
      id: "fresh",
      label: "Fresh",
      icon: HiBolt,
      href: ROUTES.FEED_FRESH,
      active: onFeed && feedType === "fresh" && !activeCategory,
    },
    {
      id: "my-feed",
      label: "My feed",
      icon: HiRectangleStack,
      href: ROUTES.FEED_MY_FEED,
      active: onFeed && feedType === "my",
    },
    {
      id: "bookmarks",
      label: "Bookmarks",
      icon: HiBookmark,
      href: ROUTES.FEED_BOOKMARKS,
      active: onFeed && feedType === "bookmarks",
    },
    {
      id: "drafts",
      label: "My drafts",
      icon: HiPencilSquare,
      href: ROUTES.DRAFTS,
      active: pathname === ROUTES.DRAFTS,
    },
    {
      id: "leaderboard",
      label: "Leaderboard",
      icon: HiTrophy,
      href: ROUTES.LEADERBOARD,
      active: pathname === ROUTES.LEADERBOARD,
    },
    {
      id: "quests",
      label: "Quests",
      icon: HiRocketLaunch,
      href: ROUTES.QUESTS,
      active: pathname === ROUTES.QUESTS,
    },
  ]

  const inkrayLinks: { id: string; label: string; icon: IconType; href: string }[] =
    [
      {
        id: "about",
        label: "About the project",
        icon: HiInformationCircle,
        href: ROUTES.ABOUT,
      },
      { id: "rules", label: "Rules", icon: HiShieldCheck, href: ROUTES.RULES },
      {
        id: "advertising",
        label: "Advertising",
        icon: HiMegaphone,
        href: ROUTES.ADVERTISING,
      },
    ]

  const { primary, secondary } = getDisplayName(suiNSName, address || "")

  const handleCopyAddress = async () => {
    if (!address || copying) return
    setCopying(true)
    try {
      await copyToClipboard(address)
    } catch {
      // Failed to copy — continue silently
    } finally {
      setTimeout(() => setCopying(false), 1000)
    }
  }

  const handleDisconnect = () => {
    logout()
    disconnect()
    setTimeout(() => router.push("/"), 100)
  }

  const handleOnRamp = () => {
    if (!address || !CONFIG.ONRAMP_URL) return
    window.open(`${CONFIG.ONRAMP_URL}${address}`, "_blank", "noopener,noreferrer")
  }

  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent
        side="right"
        className="w-75 sm:w-85 p-0 gap-0 bg-neutral-50"
      >
        <SheetHeader className="px-4 pt-4 pb-3">
          <SheetTitle className="text-left text-base">Menu</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-3 pb-6 space-y-5">
          {/* Profile / connect */}
          {isConnected ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-xl bg-white p-3">
                {account ? (
                  <Avatar
                    {...createUserAvatarConfig(
                      {
                        id: account.id,
                        publicKey: address || account.publicKey,
                        name: account.username,
                        avatar: account.avatar,
                      },
                      "md",
                    )}
                  />
                ) : (
                  <Avatar
                    src={null}
                    alt="User avatar"
                    size="md"
                    fallbackText="??"
                    gradientColors="from-gray-400 to-gray-500"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-foreground text-sm truncate">
                    {suiNSLoading ? "Loading…" : primary}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500 truncate font-mono">
                      {secondary || primary}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyAddress}
                      disabled={copying}
                      className="p-0.5 rounded hover:bg-gray-100 transition-colors shrink-0"
                      title={copying ? "Copied!" : "Copy address"}
                    >
                      {copying ? (
                        <HiCheck className="size-3 text-green-600" />
                      ) : (
                        <HiClipboard className="size-3 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick actions — the desktop profile-menu shortcuts */}
              <div className="grid grid-cols-3 gap-2">
                <SheetClose asChild>
                  <Link href={ROUTES.PROFILE} className={QUICK_TILE}>
                    <span className={QUICK_TILE_ICON}>
                      <HiUser className="size-5 text-primary" />
                    </span>
                    <span className={QUICK_TILE_LABEL}>Profile</span>
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link
                    href={
                      hasPublications && firstPublication
                        ? ROUTES.PUBLICATION_WITH_ID(firstPublication.publicationId)
                        : "/create-publication"
                    }
                    className={QUICK_TILE}
                  >
                    <span className={QUICK_TILE_ICON}>
                      {hasPublications && firstPublication ? (
                        <HiNewspaper className="size-5 text-primary" />
                      ) : (
                        <HiPlus className="size-5 text-primary" />
                      )}
                    </span>
                    <span className={QUICK_TILE_LABEL}>
                      {hasPublications && firstPublication
                        ? "Publication"
                        : "New pub"}
                    </span>
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link href={ROUTES.INVITES} className={QUICK_TILE}>
                    <span className={QUICK_TILE_ICON}>
                      <HiTicket className="size-5 text-primary" />
                    </span>
                    <span className={QUICK_TILE_LABEL}>Invites</span>
                  </Link>
                </SheetClose>
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-white p-4 text-center">
              <h3 className="font-semibold text-foreground text-sm mb-1">
                Connect wallet
              </h3>
              <p className="text-xs text-gray-500 mb-3">
                Connect to read, write, and earn.
              </p>
              <ConnectButton />
            </div>
          )}

          {/* Browse — mirrors the desktop left nav */}
          <nav className="space-y-0.5">
            {navItems.map((item) => (
              <SheetClose asChild key={item.id}>
                <Link
                  href={item.href}
                  className={cn(
                    ROW,
                    item.active
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-gray-100 text-foreground",
                  )}
                >
                  <item.icon className="size-4 shrink-0" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </SheetClose>
            ))}
          </nav>

          {/* Categories */}
          <div className="space-y-0.5">
            <Eyebrow>Categories</Eyebrow>
            {categoriesLoading ? (
              <div className="space-y-0.5">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-2.5 px-2.5 py-2">
                    <Skeleton className="size-4 rounded" />
                    <Skeleton className="h-3.5 flex-1" />
                  </div>
                ))}
              </div>
            ) : (
              categories.map((category) => {
                const { icon: CategoryIcon } = getCategoryIcon(
                  category.slug,
                )
                const active = activeCategory === category.slug
                return (
                  <SheetClose asChild key={category.id}>
                    <Link
                      href={ROUTES.FEED_CATEGORY(category.slug)}
                      className={cn(
                        ROW,
                        active
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-gray-100 text-foreground",
                      )}
                    >
                      <CategoryIcon
                        className={cn(
                          "size-4 shrink-0",
                          active ? "text-primary" : "text-gray-400",
                        )}
                      />
                      <span className="font-medium">{category.name}</span>
                    </Link>
                  </SheetClose>
                )
              })
            )}
          </div>

          {/* Publication settings — owner-only, kept out of the quick tiles */}
          {isConnected && hasPublications && firstPublication && (
            <div className="space-y-0.5">
              <Eyebrow>Manage</Eyebrow>
              <SheetClose asChild>
                <Link
                  href={ROUTES.PUBLICATION_SETTINGS(firstPublication.publicationId)}
                  className={cn(ROW, "hover:bg-gray-100 text-foreground")}
                >
                  <HiCog6Tooth className="size-4 shrink-0 text-gray-500" />
                  <span className="font-medium">Publication settings</span>
                </Link>
              </SheetClose>
            </div>
          )}

          {/* Wallet */}
          {isConnected && (
            <div className="space-y-0.5">
              <Eyebrow>Wallet</Eyebrow>
              <button
                type="button"
                onClick={() => setShowMobileConnect(true)}
                className={cn(ROW, "hover:bg-gray-100 text-foreground")}
              >
                <HiDevicePhoneMobile className="size-4 shrink-0 text-gray-500" />
                <span className="font-medium">Mobile connect</span>
              </button>
              {CONFIG.ONRAMP_URL && (
                <SheetClose asChild>
                  <button
                    type="button"
                    onClick={handleOnRamp}
                    className={cn(ROW, "hover:bg-gray-100 text-foreground")}
                  >
                    <HiBanknotes className="size-4 shrink-0 text-gray-500" />
                    <span className="font-medium flex-1">On-ramp</span>
                    <HiArrowTopRightOnSquare className="size-3 text-gray-400" />
                  </button>
                </SheetClose>
              )}
            </div>
          )}

          {/* Inkray.xyz */}
          <div className="space-y-0.5">
            <Eyebrow>Inkray.xyz</Eyebrow>
            {inkrayLinks.map((link) => (
              <SheetClose asChild key={link.id}>
                <Link href={link.href} className={cn(ROW, "hover:bg-gray-100 text-foreground")}>
                  <link.icon className="size-4 shrink-0 text-gray-500" />
                  <span className="font-medium">{link.label}</span>
                </Link>
              </SheetClose>
            ))}
          </div>

          {/* Sign out */}
          {isConnected && (
            <div className="pt-1">
              <button
                type="button"
                onClick={handleDisconnect}
                className={cn(
                  ROW,
                  "text-red-600 hover:bg-red-50 hover:text-red-700",
                )}
              >
                <HiArrowRightOnRectangle className="size-4 shrink-0" />
                <span className="font-medium">Sign out</span>
              </button>
            </div>
          )}
        </div>
      </SheetContent>

      <MobileConnectPopup
        open={showMobileConnect}
        onOpenChange={setShowMobileConnect}
      />
    </Sheet>
  )
}
