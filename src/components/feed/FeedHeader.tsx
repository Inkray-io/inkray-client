"use client"

import { HiMagnifyingGlass, HiBell, HiPlus } from "react-icons/hi2"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"
import { useWalletConnection } from "@/hooks/useWalletConnection"
import { createUserAvatarConfig } from "@/lib/utils/avatar"
import { Avatar } from "@/components/ui/Avatar"

export function FeedHeader() {
  const { account } = useAuth()
  const { address } = useWalletConnection()
  
  return (
    <header className="flex items-center justify-between px-4 sm:px-8 lg:px-[296px] py-6 lg:py-10">
      <div className="flex items-center">
        <img src="/logo.svg" alt="Inkray" className="h-8 lg:h-10" />
      </div>
      
      <div className="flex items-center gap-4 lg:gap-6">
        <div className="flex items-center gap-2 lg:gap-4">
          <Button variant="ghost" size="icon" className="size-8 lg:size-10">
            <HiMagnifyingGlass className="size-5 lg:size-6" />
          </Button>
          <Button variant="ghost" size="icon" className="size-8 lg:size-10">
            <HiBell className="size-5 lg:size-6" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2 lg:gap-4">
          {account ? (
            <Avatar
              {...createUserAvatarConfig({
                id: account.id,
                publicKey: address || account.publicKey, // Use address if available
                name: account.username,
                avatar: account.avatar,
              }, 'sm')}
              className="size-8 lg:size-10"
            />
          ) : (
            <Avatar
              src={null}
              alt="User avatar"
              size="sm"
              fallbackText="??"
              gradientColors="from-gray-400 to-gray-500"
              className="size-8 lg:size-10"
            />
          )}
          <Button className="bg-primary hover:bg-primary/90 text-white gap-2 text-sm lg:text-base px-3 lg:px-4">
            <HiPlus className="size-4 lg:size-5" />
            <span className="hidden sm:inline">Create</span>
          </Button>
        </div>
      </div>
    </header>
  )
}