"use client"

import { useState } from "react"
import { HiChevronDown, HiClipboard, HiArrowRightOnRectangle, HiPlus, HiCog6Tooth, HiUser, HiDevicePhoneMobile, HiBanknotes, HiArrowTopRightOnSquare, HiCheck, HiTicket, HiNewspaper } from "react-icons/hi2"
import { Button } from "@/components/ui/button"
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
import { MobileConnectPopup } from "@/components/auth/MobileConnectPopup"

interface UserProfileProps {
  className?: string
}

export function UserProfile({ className = "" }: UserProfileProps) {
  const { address, suiNSName, suiNSLoading, disconnect } = useWalletConnection()
  const { account, isAuthenticated, logout } = useAuth()
  const { hasPublications, firstPublication, isLoading: publicationsLoading } = useUserPublications()
  const [isOpen, setIsOpen] = useState(false)
  const [copying, setCopying] = useState(false)
  const [showMobileConnect, setShowMobileConnect] = useState(false)
  const router = useRouter()
  
  if (!address || !isAuthenticated) return null
  
  const { primary, secondary } = getDisplayName(suiNSName, address)
  // Display SuiNS name if available, otherwise show shortened address
  const displayName = suiNSName || primary
  // Shortened wallet address for display below SuiNS name
  const shortAddress = secondary || primary
  
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

  const handleOnRamp = () => {
    if (!address || !CONFIG.ONRAMP_URL) return
    const onRampUrl = `${CONFIG.ONRAMP_URL}${address}`
    window.open(onRampUrl, '_blank', 'noopener,noreferrer')
    setIsOpen(false)
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
          {suiNSName && !suiNSLoading && (
            <div className="text-xs text-gray-500 truncate">
              {shortAddress}
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
            {/* Header with address and copy button */}
            <div className="p-4 border-b border-gray-100">
              <div className="font-medium text-black text-sm mb-1">
                {displayName}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500 font-mono">
                  {shortAddress}
                </span>
                <button
                  onClick={handleCopyAddress}
                  disabled={copying}
                  className="p-1 rounded hover:bg-gray-100 transition-colors"
                  title={copying ? 'Copied!' : 'Copy address'}
                >
                  {copying ? (
                    <HiCheck className="size-3.5 text-green-600" />
                  ) : (
                    <HiClipboard className="size-3.5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Account Section */}
            <div className="py-2">
              <div className="px-3 pb-1.5">
                <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                  Account
                </span>
              </div>
              <div className="px-2">
                <Link href={ROUTES.PROFILE} onClick={() => setIsOpen(false)}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2 text-sm"
                  >
                    <HiUser className="size-4" />
                    My Profile
                  </Button>
                </Link>

                <Link href={ROUTES.INVITES} onClick={() => setIsOpen(false)}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2 text-sm"
                  >
                    <HiTicket className="size-4" />
                    Your Invites
                  </Button>
                </Link>

                {hasPublications && firstPublication ? (
                  <>
                    <Link href={ROUTES.PUBLICATION_WITH_ID(firstPublication.publicationId)} onClick={() => setIsOpen(false)}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start gap-2 text-sm"
                      >
                        <HiNewspaper className="size-4" />
                        My Publication
                      </Button>
                    </Link>
                    <Link href={ROUTES.PUBLICATION_SETTINGS(firstPublication.publicationId)} onClick={() => setIsOpen(false)}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start gap-2 text-sm"
                      >
                        <HiCog6Tooth className="size-4" />
                        Publication Settings
                      </Button>
                    </Link>
                  </>
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
              </div>
            </div>

            {/* Wallet Section */}
            <div className="py-2 border-t border-gray-100">
              <div className="px-3 pb-1.5">
                <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                  Wallet
                </span>
              </div>
              <div className="px-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowMobileConnect(true)
                    setIsOpen(false)
                  }}
                  className="w-full justify-start gap-2 text-sm"
                >
                  <HiDevicePhoneMobile className="size-4" />
                  Mobile Connect
                </Button>

                {CONFIG.ONRAMP_URL && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleOnRamp}
                    className="w-full justify-start gap-2 text-sm"
                  >
                    <HiBanknotes className="size-4" />
                    <span className="flex-1 text-left">On-Ramp</span>
                    <HiArrowTopRightOnSquare className="size-3 text-gray-400" />
                  </Button>
                )}
              </div>
            </div>

            {/* Sign Out */}
            <div className="py-2 border-t border-gray-100 px-2">
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

      <MobileConnectPopup
        open={showMobileConnect}
        onOpenChange={setShowMobileConnect}
      />
    </div>
  )
}