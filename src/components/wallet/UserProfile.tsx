"use client"

import { useState } from "react"
import { HiChevronDown, HiClipboard, HiArrowRightOnRectangle } from "react-icons/hi2"
import { Button } from "@/components/ui/button"
import { useWalletConnection } from "@/hooks/useWalletConnection"
import { getDisplayName, copyToClipboard } from "@/utils/address"

interface UserProfileProps {
  className?: string
}

export function UserProfile({ className = "" }: UserProfileProps) {
  const { address, suiNSName, suiNSLoading, disconnect } = useWalletConnection()
  const [isOpen, setIsOpen] = useState(false)
  const [copying, setCopying] = useState(false)
  
  if (!address) return null
  
  const { primary, secondary } = getDisplayName(suiNSName, address)
  
  const handleCopyAddress = async () => {
    if (!address || copying) return
    
    setCopying(true)
    try {
      await copyToClipboard(address)
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy address:', error)
    } finally {
      setTimeout(() => setCopying(false), 1000)
    }
  }
  
  const handleDisconnect = () => {
    disconnect()
    setIsOpen(false)
  }
  
  return (
    <div className={`relative ${className}`}>
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 h-auto p-2 hover:bg-gray-50"
      >
        <div className="size-8 rounded-full bg-gray-300 overflow-hidden flex-shrink-0">
          <img 
            src="/placeholder-user.jpg" 
            alt="User avatar" 
            className="size-full object-cover"
          />
        </div>
        
        <div className="flex-1 text-left min-w-0">
          <div className="font-medium text-black text-sm truncate">
            {suiNSLoading ? 'Loading...' : primary}
          </div>
          {secondary && !suiNSLoading && (
            <div className="text-xs text-gray-500 truncate">
              {secondary}
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
                {suiNSName || 'Connected Wallet'}
              </div>
              <div className="text-xs text-gray-500 font-mono break-all">
                {address}
              </div>
            </div>
            
            <div className="p-2">
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
                Disconnect
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}