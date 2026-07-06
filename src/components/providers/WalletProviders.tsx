"use client"

import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { networkConfig, network } from '@/config/sui'
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
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork={network}>
        <RegisterEnokiWallets />
        <WalletProvider autoConnect={true}>
          {children}
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  )
}