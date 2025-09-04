"use client"

import { HiMagnifyingGlass, HiBell, HiCog6Tooth } from "react-icons/hi2"
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
import { getDisplayName } from "@/utils/address"

interface MobileMenuProps {
  children: React.ReactNode
  currentPage?: string
}

export function MobileMenu({ children, currentPage = "feed" }: MobileMenuProps) {
  const { isConnected, address, suiNSName, suiNSLoading, disconnect } = useWalletConnection()
  
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
          <div className="py-6 border-b border-gray-200">
            {isConnected ? (
              <>
                {/* Connected User Profile */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="size-12 rounded-full bg-gray-300 overflow-hidden">
                    <img 
                      src="/placeholder-user.jpg" 
                      alt="User avatar" 
                      className="size-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-black">
                      {suiNSLoading ? 'Loading...' : primary}
                    </div>
                    {secondary && !suiNSLoading && (
                      <div className="text-sm text-gray-600">{secondary}</div>
                    )}
                  </div>
                </div>
                
                {/* Mobile Actions for Connected Users */}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 gap-2">
                    <HiMagnifyingGlass className="size-4" />
                    Search
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 gap-2">
                    <HiBell className="size-4" />
                    Notifications
                  </Button>
                  <Button variant="outline" size="icon" className="size-9">
                    <HiCog6Tooth className="size-4" />
                  </Button>
                </div>
                
                {/* Disconnect Button */}
                <div className="mt-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => disconnect()}
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Disconnect Wallet
                  </Button>
                </div>
              </>
            ) : (
              /* Disconnected State - Show Connect Button */
              <div className="text-center">
                <div className="mb-4">
                  <h3 className="font-semibold text-black mb-2">Connect your wallet</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Connect your wallet to access all features
                  </p>
                </div>
                <ConnectButton />
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto py-6 space-y-6">
            {/* Main Navigation */}
            <div className="space-y-1">
              <SheetClose asChild>
                <button className="w-full bg-white px-3 py-2.5 rounded-lg text-left">
                  <div className="flex items-center gap-3">
                    <div className="size-6 text-orange-500">👑</div>
                    <span className="font-medium text-black">Popular</span>
                  </div>
                </button>
              </SheetClose>
              
              <div className="flex items-center justify-between">
                <SheetClose asChild>
                  <button className="px-3 py-2.5 rounded-lg text-left">
                    <div className="flex items-center gap-3">
                      <div className="size-6 text-yellow-500">⚡</div>
                      <span className="font-medium text-black">Fresh</span>
                    </div>
                  </button>
                </SheetClose>
                <div className="size-2 bg-primary rounded mr-3"></div>
              </div>
              
              <SheetClose asChild>
                <button className="w-full px-3 py-2.5 rounded-lg text-left">
                  <div className="flex items-center gap-3">
                    <div className="size-6">🖱️</div>
                    <span className="font-medium text-black">My feed</span>
                  </div>
                </button>
              </SheetClose>
            </div>

            {/* Topics */}
            <div className="space-y-1">
              <div className="px-3 py-2.5">
                <h3 className="font-medium text-black">Topics</h3>
              </div>
              
              <div className="space-y-0.5">
                {topics.map((topic) => (
                  <SheetClose key={topic.name} asChild>
                    <button className="w-full px-3 py-2.5 rounded-lg hover:bg-gray-50 text-left">
                      <div className="flex items-center gap-3">
                        <div className={`size-6 rounded-xl ${topic.color}`} />
                        <span className="font-medium text-black">{topic.name}</span>
                      </div>
                    </button>
                  </SheetClose>
                ))}
              </div>
            </div>

            {/* Inkray.io */}
            <div className="space-y-1">
              <div className="px-3 py-2.5">
                <h3 className="font-medium text-black">Inkray.io</h3>
              </div>
              
              <div className="space-y-0.5">
                <SheetClose asChild>
                  <button className="w-full px-3 py-2.5 rounded-lg hover:bg-gray-50 text-left">
                    <div className="flex items-center gap-3">
                      <div className="size-6">ℹ️</div>
                      <span className="font-medium text-black">About the project</span>
                    </div>
                  </button>
                </SheetClose>
                <SheetClose asChild>
                  <button className="w-full px-3 py-2.5 rounded-lg hover:bg-gray-50 text-left">
                    <div className="flex items-center gap-3">
                      <div className="size-6">📋</div>
                      <span className="font-medium text-black">Rules</span>
                    </div>
                  </button>
                </SheetClose>
                <SheetClose asChild>
                  <button className="w-full px-3 py-2.5 rounded-lg hover:bg-gray-50 text-left">
                    <div className="flex items-center gap-3">
                      <div className="size-6">⭐</div>
                      <span className="font-medium text-black">Advertising</span>
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