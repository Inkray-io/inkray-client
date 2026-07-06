"use client"

import { useEffect, useState } from "react"
import { HiMagnifyingGlass, HiPlus } from "react-icons/hi2"
import { Button } from "@/components/ui/button"
import { ConnectButton } from "@mysten/dapp-kit"
import { UserProfile } from "@/components/wallet/UserProfile"
import { useWalletConnection } from "@/hooks/useWalletConnection"
import { useSearchModal } from "@/hooks/useSearchModal"
import { SearchModal } from "@/components/search/SearchModal"
import { ROUTES } from "@/constants/routes"
import Link from "next/link"
import NotificationsBell from "@/components/layout/NotificationsBell"

export function AppHeader() {
  const { isConnected } = useWalletConnection()
  const { isOpen: isSearchOpen, setIsOpen: setSearchOpen, open: openSearch } = useSearchModal()

  // ⌘ on Apple platforms, Ctrl elsewhere. Set after mount so SSR and the
  // first client render agree (no hydration mismatch).
  const [modKey, setModKey] = useState("⌘")
  useEffect(() => {
    const platform = navigator.platform ?? navigator.userAgent
    if (!/Mac|iPhone|iPad|iPod/.test(platform)) setModKey("Ctrl")
  }, [])

  return (
    <>
      <SearchModal open={isSearchOpen} onOpenChange={setSearchOpen} />
      <header className="fixed top-0 left-0 right-0 z-50 bg-neutral-50/90 backdrop-blur-md border-b border-gray-100">
        <div className="flex items-center justify-between gap-3 px-4 sm:px-8 lg:px-15 xl:px-20 py-4 max-w-500 xl:max-w-650 2xl:max-w-750 mx-auto w-full">
          {/* Left side - Logo (mobile menu lives in the bottom nav) */}
          <Link href={ROUTES.FEED} className="shrink-0">
            <img src="/logo.svg" alt="Inkray" className="h-8 lg:h-10 cursor-pointer hover:opacity-80 transition-opacity" />
          </Link>

          {/* Right side - Actions */}
          <div className="flex items-center gap-2 lg:gap-3">
            {/* Search — public (reading and search don't require an account) */}
            <>
                {/* Search — input-look pill with the shortcut on desktop */}
                <button
                  onClick={openSearch}
                  className="hidden lg:flex items-center gap-2 h-10 w-52 xl:w-64 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-400 hover:border-gray-300 hover:text-gray-500 transition-colors"
                  aria-label="Search (shortcut: Command or Control + K)"
                >
                  <HiMagnifyingGlass className="size-4 shrink-0" />
                  <span className="flex-1 text-left">Search</span>
                  <kbd className="rounded-md border border-gray-200 bg-gray-50 px-1.5 py-0.5 font-mono text-[11px] leading-none text-gray-500">
                    {modKey} K
                  </kbd>
                </button>

                {/* Search — plain icon on mobile (no keyboard there) */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden size-9 text-gray-600"
                  onClick={openSearch}
                  aria-label="Search"
                >
                  <HiMagnifyingGlass className="size-5" />
                </Button>
            </>

            {isConnected ? (
              <>
                <div className="hidden lg:flex items-center gap-1">
                  <NotificationsBell />
                  <UserProfile />
                </div>

                {/* Create — desktop only (mobile uses the bottom-nav FAB) */}
                <Link href={ROUTES.CREATE} className="hidden lg:block">
                  <Button className="bg-primary hover:bg-primary/90 text-white gap-2 text-sm px-4 h-10">
                    <HiPlus className="size-4" />
                    Create
                  </Button>
                </Link>
              </>
            ) : (
              <ConnectButton />
            )}
          </div>
        </div>
      </header>
    </>
  )
}
