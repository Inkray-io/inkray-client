"use client"

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
import { getDisplayName } from "@/utils/address"
import { createUserAvatarConfig } from "@/lib/utils/avatar"
import { Avatar } from "@/components/ui/Avatar"

interface MobileMenuProps {
  children: React.ReactNode
  currentPage?: string
}

export function MobileMenu({ children, currentPage: _currentPage = "feed" }: MobileMenuProps) {
  const { isConnected, address, suiNSName, suiNSLoading, disconnect } = useWalletConnection()
  const { account } = useAuth()

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
          <div className="pt-6 pb-5 border-b border-gray-200">
            {isConnected ? (
              <div className="space-y-4">
                {/* Connected User Profile Card */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    {account ? (
                      <Avatar
                        {...createUserAvatarConfig({
                          id: account.id,
                          publicKey: address || account.publicKey,
                          name: account.username,
                          avatar: account.avatar,
                        }, 'lg')}
                      />
                    ) : (
                      <Avatar
                        src={null}
                        alt="User avatar"
                        size="lg"
                        fallbackText="??"
                        gradientColors="from-gray-400 to-gray-500"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-black text-base truncate">
                        {suiNSLoading ? 'Loading...' : primary}
                      </div>
                      {secondary && !suiNSLoading && (
                        <div className="text-sm text-gray-600 truncate">{secondary}</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Disconnect Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => disconnect()}
                  className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300 transition-colors"
                >
                  Disconnect Wallet
                </Button>
              </div>
            ) : (
              /* Disconnected State - Show Connect Button */
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 text-center">
                <div className="mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-black mb-2">Connect Wallet</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Connect to access all features
                  </p>
                </div>
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
                <button className="w-full px-4 py-3 rounded-lg text-left hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="text-xl">🖱️</div>
                    <span className="font-medium text-black">My feed</span>
                  </div>
                </button>
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