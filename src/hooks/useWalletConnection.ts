"use client"

import { useCurrentAccount, useConnectWallet, useDisconnectWallet } from '@mysten/dapp-kit'
import { useSuiNS } from './useSuiNS'

export interface WalletConnectionState {
  // Account info
  account: ReturnType<typeof useCurrentAccount>
  address?: string
  isConnected: boolean
  
  // SuiNS info
  suiNSName: string
  suiNSLoading: boolean
  suiNSError: string | null
  
  // Connection actions
  connect: ReturnType<typeof useConnectWallet>['mutate']
  disconnect: ReturnType<typeof useDisconnectWallet>['mutate']
  
  // Connection state
  isConnecting: boolean
  isDisconnecting: boolean
}

export const useWalletConnection = (): WalletConnectionState => {
  const account = useCurrentAccount()
  const { mutate: connect, isPending: isConnecting } = useConnectWallet()
  const { mutate: disconnect, isPending: isDisconnecting } = useDisconnectWallet()
  
  const address = account?.address
  const isConnected = !!account
  
  // Resolve SuiNS name for connected account
  const { name: suiNSName, loading: suiNSLoading, error: suiNSError } = useSuiNS(address)
  
  return {
    // Account info
    account,
    address,
    isConnected,
    
    // SuiNS info
    suiNSName,
    suiNSLoading,
    suiNSError,
    
    // Connection actions
    connect,
    disconnect,
    
    // Connection state
    isConnecting,
    isDisconnecting,
  }
}