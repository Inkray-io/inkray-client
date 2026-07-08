"use client"

import { useEffect, useState } from "react"
import { useWallets } from "@mysten/dapp-kit"
import { isEnokiWallet } from "@mysten/enoki"

export interface SuiWalletDetectionState {
  /** True once mounted and the wallet-registration grace period has elapsed */
  ready: boolean
  /** True when at least one real (non-Enoki) Sui wallet is registered */
  hasWallet: boolean
  /** True on phones/tablets, where wallet extensions can't be installed */
  isMobile: boolean
}

/**
 * Detects whether a real Sui wallet (browser extension or an in-wallet-app
 * browser) is available via the Wallet Standard.
 *
 * The app registers an Enoki zkLogin wallet app-wide, so useWallets() is never
 * empty — Enoki wallets are filtered out to detect genuine ones. Extensions
 * inject asynchronously (and Enoki registers in an effect), so `ready` only
 * turns true after mount plus a short grace period; consumers won't flash a
 * "no wallet" warning on first paint. useWallets() is reactive, so `hasWallet`
 * flips to true automatically if a wallet registers later.
 */
export function useSuiWalletDetection(): SuiWalletDetectionState {
  const wallets = useWallets()
  const [ready, setReady] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // UA is only read after mount so SSR and the first client render agree
  // (same pattern as AppHeader's modifier-key detection).
  useEffect(() => {
    const ua = navigator.userAgent
    // iPadOS ≥13 reports a Mac UA — detect it via touch support instead
    const isIpad =
      /iPad/.test(ua) ||
      (/Mac/.test(navigator.platform ?? "") && navigator.maxTouchPoints > 1)
    setIsMobile(/Android|iPhone|iPod/i.test(ua) || isIpad)

    // Grace period: extensions register at content-script time, so checking
    // immediately would produce a false "no wallet" flash.
    const timer = setTimeout(() => setReady(true), 600)
    return () => clearTimeout(timer)
  }, [])

  const hasWallet = wallets.some((wallet) => !isEnokiWallet(wallet))

  return { ready, hasWallet, isMobile }
}
