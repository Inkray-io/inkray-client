"use client"

import { useState } from "react"
import { HiChevronDown, HiClipboard, HiArrowRightOnRectangle, HiPlus, HiCog6Tooth } from "react-icons/hi2"
import { Button } from "@/components/ui/button"
import { useWalletConnection } from "@/hooks/useWalletConnection"
import { useAuth } from "@/contexts/AuthContext"
import { useUserPublications } from "@/hooks/useUserPublications"
import { getDisplayName, copyToClipboard } from "@/utils/address"
import { createUserAvatarConfig } from "@/lib/utils/avatar"
import { Avatar } from "@/components/ui/Avatar"
import { ROUTES } from "@/constants/routes"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface UserProfileProps {
  className?: string
}

export function UserProfile({ className = "" }: UserProfileProps) {
  const { address, suiNSName, suiNSLoading, disconnect } = useWalletConnection()
  const { account, isAuthenticated, logout } = useAuth()
  const { hasPublications, firstPublication, isLoading: publicationsLoading } = useUserPublications()
  const [isOpen, setIsOpen] = useState(false)
  const [copying, setCopying] = useState(false)
  const router = useRouter()
  
  if (!address || !isAuthenticated) return null
  
  const { primary, secondary } = getDisplayName(suiNSName, address)
  const displayName = account?.username || suiNSName || primary
  
  const handleCopyAddress = async () => {
    if (!address || copying) return
    
    setCopying(true)
    try {
      await copyToClipboard(address)
      // You could add a toast notification here
    } catch (error) {
      // Failed to copy address - continue silently
    } finally {
      setTimeout(() => setCopying(false), 1000)
    }
  }
  
  const handleDisconnect = () => {
    logout() // Clear auth state
    disconnect() // Disconnect wallet
    setIsOpen(false)
    
    // Add a small delay to allow wallet disconnection to complete
    // before redirecting to homepage to avoid race condition
    setTimeout(() => {
      router.push('/') // Redirect to homepage
    }, 100)
  }
  
  return (
    <div className={`relative ${className}`}>
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 h-auto p-2 hover:bg-gray-50"
      >
        {account ? (
          <Avatar
            {...createUserAvatarConfig({
              id: account.id,
              publicKey: address, // Use full address instead of account.publicKey
              name: account.username, // Only pass real username, not formatted address
              avatar: account.avatar,
            }, 'sm')}
            className="flex-shrink-0"
          />
        ) : (
          <Avatar
            src={null}
            alt="User avatar"
            size="sm"
            fallbackText="??"
            gradientColors="from-gray-400 to-gray-500"
            className="flex-shrink-0"
          />
        )}
        
        <div className="flex-1 text-left min-w-0">
          <div className="font-medium text-black text-sm truncate">
            {suiNSLoading ? 'Loading...' : displayName}
          </div>
          {(account?.username || suiNSName) && !suiNSLoading && (
            <div className="text-xs text-gray-500 truncate">
              {account?.username ? primary : secondary}
            </div>
          )}
        </div>
        
        <HiChevronDown className={`size-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>
      
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Menu */}
          <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            <div className="p-4 border-b border-gray-100">
              <div className="font-medium text-black text-sm mb-1">
                {displayName}
              </div>
              {account?.username && (
                <div className="text-xs text-gray-600 mb-2">
                  @{account.username}
                </div>
              )}
              <div className="text-xs text-gray-500 font-mono break-all">
                {address}
              </div>
            </div>
            
            <div className="p-2">
              {hasPublications && firstPublication ? (
                <Link href={ROUTES.PUBLICATION_SETTINGS(firstPublication.publicationId)} onClick={() => setIsOpen(false)}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2 text-sm"
                  >
                    <HiCog6Tooth className="size-4" />
                    My Publication
                  </Button>
                </Link>
              ) : (
                <Link href="/create-publication" onClick={() => setIsOpen(false)}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2 text-sm"
                    disabled={publicationsLoading}
                  >
                    <HiPlus className="size-4" />
                    {publicationsLoading ? 'Loading...' : 'Create Publication'}
                  </Button>
                </Link>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyAddress}
                disabled={copying}
                className="w-full justify-start gap-2 text-sm"
              >
                <HiClipboard className="size-4" />
                {copying ? 'Copied!' : 'Copy Address'}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDisconnect}
                className="w-full justify-start gap-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <HiArrowRightOnRectangle className="size-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}