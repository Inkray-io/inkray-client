"use client"

import { HiMagnifyingGlass, HiPlus, HiBars3 } from "react-icons/hi2"
import { Button } from "@/components/ui/button"
import { ConnectButton } from "@mysten/dapp-kit"
import { MobileMenu } from "./MobileMenu"
import { UserProfile } from "@/components/wallet/UserProfile"
import { useWalletConnection } from "@/hooks/useWalletConnection"
import { useSearchModal } from "@/hooks/useSearchModal"
import { SearchModal } from "@/components/search/SearchModal"
import { ROUTES } from "@/constants/routes"
import Link from "next/link"
import NotificationsBell from "@/components/layout/NotificationsBell"
import { useScrollDirection } from "@/hooks/useScrollDirection"
import { cn } from "@/lib/utils"

interface AppHeaderProps {
  currentPage?: string
}

export function AppHeader({ currentPage = "feed" }: AppHeaderProps) {
  const { isConnected } = useWalletConnection()
  const { isOpen: isSearchOpen, setIsOpen: setSearchOpen, open: openSearch } = useSearchModal()
  const { scrollDirection, isAtTop } = useScrollDirection({ threshold: 5 })

  // Show header when: at top, scrolling up, or initially (scrollDirection is null)
  const showHeader = isAtTop || scrollDirection === "up" || scrollDirection === null

  return (
    <>
      <SearchModal open={isSearchOpen} onOpenChange={setSearchOpen} />
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 bg-neutral-50 transition-transform duration-300 ease-in-out",
        showHeader ? "translate-y-0" : "-translate-y-full"
      )}
    >
      <div className="flex items-center justify-between px-4 sm:px-8 lg:px-[60px] xl:px-[80px] py-6 lg:py-10 max-w-[2000px] xl:max-w-[2600px] 2xl:max-w-[3000px] mx-auto w-full">
      {/* Left side - Logo and Mobile Menu */}
      <div className="flex items-center gap-4">
        <Link href={ROUTES.FEED}>
          <img src="/logo.svg" alt="Inkray" className="h-8 lg:h-10 cursor-pointer hover:opacity-80 transition-opacity" />
        </Link>
        
        {/* Mobile Menu Button - Only visible on mobile/tablet */}
        <div className="lg:hidden">
          <MobileMenu currentPage={currentPage}>
            <Button variant="ghost" size="icon" className="size-8">
              <HiBars3 className="size-5" />
            </Button>
          </MobileMenu>
        </div>
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

        {/* Create Button - Only visible when wallet is connected */}
        {isConnected && (
          <Link href={ROUTES.CREATE}>
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
