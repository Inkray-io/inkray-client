"use client"

import { useCurrentAccount, useDAppKit } from '@mysten/dapp-kit-react'
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

  /** Disconnect the active wallet */
  disconnect: () => Promise<void>
}

/**
 * Wallet connection hook that provides unified access to wallet state and SuiNS
 * resolution. Connection itself is UI-driven (ConnectButton/ConnectModal); this
 * hook exposes the current account, derived state, and a disconnect action.
 *
 * @returns {WalletConnectionState} Wallet connection state and disconnect action
 *
 * @example
 * ```tsx
 * const { isConnected, address, suiNSName, disconnect } = useWalletConnection();
 * if (!isConnected) return <ConnectButton />;
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
  const dAppKit = useDAppKit()

  const address = account?.address
  const isConnected = !!account

  // Resolve SuiNS name for connected account
  const {
    name: suiNSName,
    loading: suiNSLoading,
    error: suiNSError,
  } = useSuiNS(address)

  return {
    account,
    address,
    isConnected,
    suiNSName,
    suiNSLoading,
    suiNSError,
    disconnect: () => dAppKit.disconnectWallet(),
  }
}
