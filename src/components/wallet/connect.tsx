"use client"

import dynamic from 'next/dynamic'

/**
 * dApp Kit 2.0's ConnectButton/ConnectModal are Lit web components that touch
 * `window`/`document` at import time, which breaks Next.js SSR/prerender. Load
 * them client-only so the web-component module never evaluates on the server.
 */
export const ConnectButton = dynamic(
  () => import('@mysten/dapp-kit-react/ui').then((m) => m.ConnectButton),
  { ssr: false },
)

export const ConnectModal = dynamic(
  () => import('@mysten/dapp-kit-react/ui').then((m) => m.ConnectModal),
  { ssr: false },
)
