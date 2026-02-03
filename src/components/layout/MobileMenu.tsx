"use client"

import { useState } from "react"
import { HiClipboard, HiArrowRightOnRectangle, HiPlus, HiCog6Tooth, HiBanknotes, HiArrowTopRightOnSquare, HiCheck, HiUser, HiTicket } from "react-icons/hi2"
import { Button } from "@/components/ui/button"
import { ConnectButton } from "@mysten/dapp-kit"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet"
import { useWalletConnection } from "@/hooks/useWalletConnection"
import { useAuth } from "@/contexts/AuthContext"
import { useUserPublications } from "@/hooks/useUserPublications"
import { getDisplayName, copyToClipboard } from "@/utils/address"
import { createUserAvatarConfig } from "@/lib/utils/avatar"
import { Avatar } from "@/components/ui/Avatar"
import { ROUTES } from "@/constants/routes"
import { CONFIG } from "@/lib/config"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface MobileMenuProps {
  children: React.ReactNode
  currentPage?: string
}

export function MobileMenu({ children, currentPage: _currentPage = "feed" }: MobileMenuProps) {
  const { isConnected, address, suiNSName, suiNSLoading, disconnect } = useWalletConnection()
  const { account, logout } = useAuth()
  const { hasPublications, firstPublication, isLoading: publicationsLoading } = useUserPublications()
  const router = useRouter()
  const [copying, setCopying] = useState(false)

  // Note: currentPage can be used for future active state management
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

  const { primary, secondary } = getDisplayName(suiNSName, address || '')

  const handleCopyAddress = async () => {
    if (!address || copying) return

    setCopying(true)
    try {
      await copyToClipboard(address)
    } catch (error) {
      // Failed to copy - continue silently
    } finally {
      setTimeout(() => setCopying(false), 1000)
    }
  }

  const handleDisconnect = () => {
    logout()
    disconnect()
    setTimeout(() => {
      router.push('/')
    }, 100)
  }

  const handleOnRamp = () => {
    if (!address || !CONFIG.ONRAMP_URL) return
    const onRampUrl = `${CONFIG.ONRAMP_URL}${address}`
    window.open(onRampUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[350px]">
        <SheetHeader>
          <SheetTitle className="text-left">Menu</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-full">
          {/* Wallet/Profile Section */}
          <div className="px-4 pt-4 pb-4 border-b border-gray-200">
            {isConnected ? (
              <div className="space-y-3">
                {/* Connected User Profile Card */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3">
                  <div className="flex items-center gap-2.5">
                    {account ? (
                      <Avatar
                        {...createUserAvatarConfig({
                          id: account.id,
                          publicKey: address || account.publicKey,
                          name: account.username,
                          avatar: account.avatar,
                        }, 'md')}
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
                      <div className="font-semibold text-black text-sm truncate">
                        {suiNSLoading ? 'Loading...' : primary}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-600 truncate font-mono">
                          {secondary || primary}
                        </span>
                        <button
                          onClick={handleCopyAddress}
                          disabled={copying}
                          className="p-0.5 rounded hover:bg-white/50 transition-colors shrink-0"
                          title={copying ? 'Copied!' : 'Copy address'}
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
                </div>

                {/* Account Section */}
                <div>
                  <div className="pb-1.5">
                    <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                      Account
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <SheetClose asChild>
                      <Link href={ROUTES.PROFILE}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start gap-2 text-xs h-9"
                        >
                          <HiUser className="size-3.5" />
                          <span className="truncate">My Profile</span>
                        </Button>
                      </Link>
                    </SheetClose>

                    <SheetClose asChild>
                      <Link href={ROUTES.INVITES}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start gap-2 text-xs h-9"
                        >
                          <HiTicket className="size-3.5" />
                          <span className="truncate">Your Invites</span>
                        </Button>
                      </Link>
                    </SheetClose>

                    {hasPublications && firstPublication ? (
                      <SheetClose asChild>
                        <Link href={ROUTES.PUBLICATION_SETTINGS(firstPublication.publicationId)}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start gap-2 text-xs h-9"
                          >
                            <HiCog6Tooth className="size-3.5" />
                            <span className="truncate">Publication</span>
                          </Button>
                        </Link>
                      </SheetClose>
                    ) : (
                      <SheetClose asChild>
                        <Link href="/create-publication">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start gap-2 text-xs h-9"
                            disabled={publicationsLoading}
                          >
                            <HiPlus className="size-3.5" />
                            <span className="truncate">{publicationsLoading ? 'Loading...' : 'Create Pub'}</span>
                          </Button>
                        </Link>
                      </SheetClose>
                    )}
                  </div>
                </div>

                {/* Wallet Section */}
                <div>
                  <div className="pb-1.5">
                    <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                      Wallet
                    </span>
                  </div>
                  {CONFIG.ONRAMP_URL && (
                    <SheetClose asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleOnRamp}
                        className="w-full justify-start gap-2 text-xs h-9"
                      >
                        <HiBanknotes className="size-3.5" />
                        <span className="flex-1 text-left truncate">On-Ramp</span>
                        <HiArrowTopRightOnSquare className="size-3 text-gray-400" />
                      </Button>
                    </SheetClose>
                  )}
                </div>

                {/* Sign Out Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnect}
                  className="w-full justify-start gap-2 text-xs h-9 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300 transition-colors"
                >
                  <HiArrowRightOnRectangle className="size-3.5" />
                  Sign Out
                </Button>
              </div>
            ) : (
              /* Disconnected State - Show Connect Button - More Compact */
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 text-center">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-black text-sm mb-1">Connect Wallet</h3>
                <p className="text-xs text-gray-600 mb-3">
                  Connect to access features
                </p>
                <ConnectButton />
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto py-5 space-y-5">
            {/* Main Navigation */}
            <div className="space-y-1">
              <SheetClose asChild>
                <button className="w-full px-4 py-3 rounded-lg text-left hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="text-xl">👑</div>
                    <span className="font-medium text-black">Popular</span>
                  </div>
                </button>
              </SheetClose>

              <SheetClose asChild>
                <button className="w-full px-4 py-3 rounded-lg text-left bg-blue-50 hover:bg-blue-100 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-xl">⚡</div>
                      <span className="font-medium text-black">Fresh</span>
                    </div>
                    <div className="size-2 bg-primary rounded-full"></div>
                  </div>
                </button>
              </SheetClose>

              <SheetClose asChild>
                <Link href={ROUTES.FEED_MY_FEED}>
                  <button className="w-full px-4 py-3 rounded-lg text-left hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="text-xl">🖱️</div>
                      <span className="font-medium text-black">My feed</span>
                    </div>
                  </button>
                </Link>
              </SheetClose>

              <SheetClose asChild>
                <Link href={ROUTES.FEED_BOOKMARKS}>
                  <button className="w-full px-4 py-3 rounded-lg text-left hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="text-xl">🔖</div>
                      <span className="font-medium text-black">Bookmarks</span>
                    </div>
                  </button>
                </Link>
              </SheetClose>
            </div>

            {/* Topics */}
            <div className="space-y-2">
              <div className="px-4 pb-1">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Topics</h3>
              </div>

              <div className="space-y-1">
                {topics.map((topic) => (
                  <SheetClose key={topic.name} asChild>
                    <button className="w-full px-4 py-2.5 rounded-lg hover:bg-gray-50 text-left transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`size-5 rounded-lg ${topic.color}`} />
                        <span className="text-sm font-medium text-black">{topic.name}</span>
                      </div>
                    </button>
                  </SheetClose>
                ))}
              </div>
            </div>

            {/* Inkray.xyz */}
            <div className="space-y-2 pb-4">
              <div className="px-4 pb-1">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Inkray.xyz</h3>
              </div>

              <div className="space-y-1">
                <SheetClose asChild>
                  <button className="w-full px-4 py-2.5 rounded-lg hover:bg-gray-50 text-left transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="text-lg">ℹ️</div>
                      <span className="text-sm font-medium text-black">About the project</span>
                    </div>
                  </button>
                </SheetClose>
                <SheetClose asChild>
                  <button className="w-full px-4 py-2.5 rounded-lg hover:bg-gray-50 text-left transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="text-lg">📋</div>
                      <span className="text-sm font-medium text-black">Rules</span>
                    </div>
                  </button>
                </SheetClose>
                <SheetClose asChild>
                  <button className="w-full px-4 py-2.5 rounded-lg hover:bg-gray-50 text-left transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="text-lg">⭐</div>
                      <span className="text-sm font-medium text-black">Advertising</span>
                    </div>
                  </button>
                </SheetClose>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}