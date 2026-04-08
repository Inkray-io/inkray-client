"use client"

import { useEffect } from 'react'
import { useSuiClient, useSuiClientContext } from '@mysten/dapp-kit'
import { registerEnokiWallets } from '@mysten/enoki'
import type { EnokiNetwork } from '@mysten/enoki'

/**
 * Registers Enoki wallets (Google OAuth) with the wallet standard.
 * This component must be rendered inside SuiClientProvider but BEFORE WalletProvider
 * so that wallets are registered before the provider initializes.
 *
 * When configured, Google will appear as a wallet option in the connect modal.
 * The OAuth flow happens in a popup, then the user gets a zkLogin wallet address.
 */
export function RegisterEnokiWallets() {
  const client = useSuiClient()
  const { network } = useSuiClientContext()

  useEffect(() => {
    // Only register if we have the required env vars
    const enokiApiKey = process.env.NEXT_PUBLIC_ENOKI_API_KEY
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

    if (!enokiApiKey || !googleClientId) {
      // Graceful degradation: if env vars aren't set, Enoki wallets won't appear
      return
    }

    // Only register for testnet/mainnet (Enoki doesn't support devnet/localnet)
    if (network !== 'testnet' && network !== 'mainnet') {
      return
    }

    const { unregister } = registerEnokiWallets({
      client,
      network: network as EnokiNetwork,
      apiKey: enokiApiKey,
      providers: {
        google: { clientId: googleClientId },
      },
    })

    // Cleanup: unregister wallets when network changes or component unmounts
    return unregister
  }, [client, network])

  return null
}
