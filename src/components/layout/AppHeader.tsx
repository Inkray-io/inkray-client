"use client"

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

  return (
    <>
      <SearchModal open={isSearchOpen} onOpenChange={setSearchOpen} />
      <header className="fixed top-0 left-0 right-0 z-50 bg-neutral-50">
        <div className="flex items-center justify-between px-4 sm:px-8 lg:px-[60px] xl:px-[80px] py-4 max-w-[2000px] xl:max-w-[2600px] 2xl:max-w-[3000px] mx-auto w-full">
          {/* Left side - Logo (mobile menu now lives in the bottom nav) */}
          <div className="flex items-center gap-4">
            <Link href={ROUTES.FEED}>
              <img src="/logo.svg" alt="Inkray" className="h-8 lg:h-10 cursor-pointer hover:opacity-80 transition-opacity" />
            </Link>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-4 lg:gap-6">
            {/* Desktop Actions - Show based on wallet connection state */}
            <div className="hidden lg:flex items-center gap-4">
              {isConnected ? (
                <>
                  {/* Connected: Show search, notifications, and user profile */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-10"
                    onClick={openSearch}
                    title="Search (⌘K)"
                  >
                    <HiMagnifyingGlass className="size-6" />
                  </Button>
                  <NotificationsBell />
                  <UserProfile />
                </>
              ) : (
                /* Disconnected: Show connect button */
                <ConnectButton />
              )}
            </div>

            {/* Mobile - Show connect button only if not connected (profile is in mobile menu) */}
            <div className="lg:hidden">
              {!isConnected && <ConnectButton />}
            </div>

            {/* Create Button - desktop only (mobile uses the bottom-nav FAB) */}
            {isConnected && (
              <Link href={ROUTES.CREATE} className="hidden lg:block">
                <Button className="bg-primary hover:bg-primary/90 text-white gap-2 text-sm lg:text-base px-3 lg:px-4 min-h-[40px]">
                  <HiPlus className="size-4 lg:size-5" />
                  <span className="hidden sm:inline">Create</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>
    </>
  )
}
