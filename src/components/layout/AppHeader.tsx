"use client"

import { HiMagnifyingGlass, HiBell, HiPlus, HiBars3 } from "react-icons/hi2"
import { Button } from "@/components/ui/button"
import { ConnectButton } from "@mysten/dapp-kit"
import { MobileMenu } from "./MobileMenu"
import { UserProfile } from "@/components/wallet/UserProfile"
import { useWalletConnection } from "@/hooks/useWalletConnection"
import { ROUTES } from "@/constants/routes"
import Link from "next/link"

interface AppHeaderProps {
  currentPage?: string
}

export function AppHeader({ currentPage = "feed" }: AppHeaderProps) {
  const { isConnected } = useWalletConnection()
  
  return (
    <header className="flex items-center justify-between px-4 sm:px-8 lg:px-[120px] xl:px-[160px] py-6 lg:py-10 max-w-[1600px] xl:max-w-[1800px] 2xl:max-w-[2000px] mx-auto w-full">
      {/* Left side - Logo and Mobile Menu */}
      <div className="flex items-center gap-4">
        <img src="/logo.svg" alt="Inkray" className="h-8 lg:h-10" />
        
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
              <Button variant="ghost" size="icon" className="size-10">
                <HiMagnifyingGlass className="size-6" />
              </Button>
              <Button variant="ghost" size="icon" className="size-10">
                <HiBell className="size-6" />
              </Button>
              <UserProfile />
            </>
          ) : (
            /* Disconnected: Show connect button */
            <ConnectButton />
          )}
        </div>
        
        {/* Mobile wallet state - Show connect button or user profile on mobile */}
        <div className="lg:hidden">
          {isConnected ? (
            <UserProfile />
          ) : (
            <ConnectButton />
          )}
        </div>
        
        {/* Create Button - Only visible when wallet is connected */}
        {isConnected && (
          <Link href={ROUTES.CREATE}>
            <Button className="bg-primary hover:bg-primary/90 text-white gap-2 text-sm lg:text-base px-3 lg:px-4">
              <HiPlus className="size-4 lg:size-5" />
              <span className="hidden sm:inline">Create</span>
            </Button>
          </Link>
        )}
      </div>
    </header>
  )
}