"use client"

import { DAppKitProvider } from '@mysten/dapp-kit-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { dAppKit } from '@/config/sui'
import { RegisterEnokiWallets } from './RegisterEnokiWallets'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Don't retry client errors (401/403/404…) — they won't succeed on a
      // retry, and the default 3-attempt backoff makes failures feel like a
      // long load before erroring. Server/network errors still get 2 retries.
      retry: (failureCount, error) => {
        const status = (error as { response?: { status?: number } })?.response
          ?.status
        if (status && status >= 400 && status < 500) return false
        return failureCount < 2
      },
    },
  },
})

interface WalletProvidersProps {
  children: React.ReactNode
}

export function WalletProviders({ children }: WalletProvidersProps) {
  // dApp Kit 2.0: a single DAppKitProvider replaces SuiClientProvider +
  // WalletProvider. autoConnect is configured on the dAppKit instance itself.
  // RegisterEnokiWallets registers the Enoki (Google) wallet into the Wallet
  // Standard, which dApp Kit 2.0 auto-discovers.
  return (
    <QueryClientProvider client={queryClient}>
      <DAppKitProvider dAppKit={dAppKit}>
        <RegisterEnokiWallets />
        {children}
      </DAppKitProvider>
    </QueryClientProvider>
  )
}