"use client"

import { useCurrentAccount, useConnectWallet, useDisconnectWallet } from '@mysten/dapp-kit'
import { useSuiNS } from './useSuiNS'

/**
 * Wallet connection state interface
 * @interface WalletConnectionState
 */
export interface WalletConnectionState {
  /** Current wallet account object from dApp kit */
  account: ReturnType<typeof useCurrentAccount>
  /** Wallet address string (if connected) */
  address?: string
  /** Boolean indicating if wallet is connected */
  isConnected: boolean

  /** Resolved SuiNS name for the connected address */
  suiNSName: string
  /** Loading state for SuiNS resolution */
  suiNSLoading: boolean
  /** Error message from SuiNS resolution */
  suiNSError: string | null

  /** Function to connect wallet */
  connect: ReturnType<typeof useConnectWallet>['mutate']
  /** Function to disconnect wallet */
  disconnect: ReturnType<typeof useDisconnectWallet>['mutate']

  /** Loading state for wallet connection */
  isConnecting: boolean
  /** Loading state for wallet disconnection */
  isDisconnecting: boolean
}

/**
 * Wallet connection hook that provides unified access to wallet state and SuiNS resolution
 * 
 * This hook combines wallet connection management with SuiNS name resolution,
 * providing a complete wallet integration solution for the application.
 * 
 * @returns {WalletConnectionState} Complete wallet connection state and actions
 * 
 * @example
 * ```tsx
 * const { isConnected, address, suiNSName, connect, disconnect } = useWalletConnection();
 * 
 * if (!isConnected) {
 *   return <button onClick={() => connect()}>Connect Wallet</button>;
 * }
 * 
 * return (
 *   <div>
 *     <p>Connected: {suiNSName || address}</p>
 *     <button onClick={() => disconnect()}>Disconnect</button>
 *   </div>
 * );
 * ```
 */
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