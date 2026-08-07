"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { QRCodeSVG } from "qrcode.react"
import { HiCheckCircle, HiXCircle, HiArrowPath, HiArrowTopRightOnSquare } from "react-icons/hi2"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { mobileAuthAPI } from "@/lib/api"

interface MobileConnectPopupProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type ConnectionState =
  | "generating"
  | "waiting"
  | "connecting"
  | "connected"
  | "expired"
  | "error"

const TESTFLIGHT_URL = "https://testflight.apple.com/join/agmJgDPr"

export function MobileConnectPopup({ open, onOpenChange }: MobileConnectPopupProps) {
  const [state, setState] = useState<ConnectionState>("generating")
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [isMobile, setIsMobile] = useState(false)
  // Guards the one-time auto-authorize when the phone reports it scanned.
  const completingRef = useRef(false)

  useEffect(() => {
    setIsMobile(/android|iphone|ipad|ipod/i.test(navigator.userAgent))
  }, [])

  const generateSession = useCallback(async () => {
    setState("generating")
    setError(null)
    setSessionId(null)
    completingRef.current = false

    try {
      const response = await mobileAuthAPI.generateSession()
      const data = response.data.data

      if (data && data.sessionId) {
        setSessionId(data.sessionId)
        setExpiresAt(new Date(data.expiresAt))
        setState("waiting")
      } else {
        throw new Error("Invalid response format from server")
      }
    } catch (err: unknown) {
      console.error("Failed to generate mobile auth session:", err)
      const axiosError = err as any
      const errorMessage = axiosError?.response?.data?.error?.message
        || axiosError?.response?.data?.message
        || axiosError?.message
        || "Failed to generate QR code. Make sure the backend is running and the database migration has been applied."
      setError(errorMessage)
      setState("error")
    }
  }, [])

  // Generate session when dialog opens
  useEffect(() => {
    if (open) {
      generateSession()
    } else {
      setState("generating")
      setSessionId(null)
      setExpiresAt(null)
      setError(null)
      completingRef.current = false
    }
  }, [open, generateSession])

  // Poll for session status. The phone marks the session "scanned" the instant
  // it reads the code — we auto-authorize on that signal, so there's no confirm
  // button to click on desktop.
  useEffect(() => {
    if (!open || !sessionId || (state !== "waiting" && state !== "connecting")) return

    const pollInterval = setInterval(async () => {
      try {
        const response = await mobileAuthAPI.getSessionStatus(sessionId)
        const status = response.data.data

        if (status?.status === "authenticated") {
          setState("connected")
          clearInterval(pollInterval)
        } else if (status?.status === "scanned" && !completingRef.current) {
          // Phone scanned — authorize the connection with the logged-in account.
          completingRef.current = true
          setState("connecting")
          try {
            await mobileAuthAPI.completeSession(sessionId)
            setState("connected")
            clearInterval(pollInterval)
          } catch (err) {
            console.error("Failed to authorize connection:", err)
            completingRef.current = false
            setState("waiting")
          }
        } else if (status?.status === "expired") {
          setState("expired")
          clearInterval(pollInterval)
        }
      } catch (err) {
        console.error("Failed to check session status:", err)
      }
    }, 2000)

    return () => clearInterval(pollInterval)
  }, [open, sessionId, state])

  // Countdown timer
  useEffect(() => {
    if (!expiresAt || state !== "waiting") return
    const updateTimer = () => {
      const remaining = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000))
      setTimeRemaining(remaining)
      if (remaining === 0) setState("expired")
    }
    updateTimer()
    const timerInterval = setInterval(updateTimer, 1000)
    return () => clearInterval(timerInterval)
  }, [expiresAt, state])

  const qrValue = sessionId ? `inkray://auth?session=${sessionId}` : ""

  // Same-device path: the web tab gets suspended once the app takes focus, so we
  // authorize the session HERE (while we still have focus + the account) and
  // then open the app, which just redeems the already-authorized session.
  const handleOpenInApp = async () => {
    if (!sessionId) return
    setState("connecting")
    try {
      await mobileAuthAPI.completeSession(sessionId)
    } catch (err) {
      console.error("Failed to authorize connection:", err)
    }
    setState("connected")
    window.location.href = qrValue
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Mobile App</DialogTitle>
          <DialogDescription>
            {isMobile
              ? "Open the Inkray app to connect your account instantly."
              : "Scan this QR code with the Inkray mobile app to connect your account."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center py-6">
          {state === "generating" && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-48 h-48 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
                <HiArrowPath className="size-8 text-gray-400 animate-spin" />
              </div>
              <p className="text-sm text-gray-500">Generating…</p>
            </div>
          )}

          {state === "waiting" && sessionId && (
            <div className="flex w-full flex-col items-center gap-4">
              {isMobile ? (
                <>
                  {/* Same device: a button that opens the app directly */}
                  <Button onClick={handleOpenInApp} className="w-full" size="lg">
                    <HiArrowTopRightOnSquare className="size-5" />
                    Open in Inkray app
                  </Button>
                  <a
                    href={TESTFLIGHT_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gray-400 underline underline-offset-2"
                  >
                    Don&apos;t have the app? Get it on TestFlight
                  </a>

                  {/* Secondary: QR for scanning from another device */}
                  <div className="mt-2 flex flex-col items-center gap-2 border-t pt-4 w-full">
                    <p className="text-xs text-gray-400">or scan from another device</p>
                    <div className="p-3 bg-white rounded-lg border">
                      <QRCodeSVG value={qrValue} size={128} level="M" bgColor="#FFFFFF" fgColor="#000000" />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-4 bg-white rounded-lg border">
                    <QRCodeSVG value={qrValue} size={192} level="M" bgColor="#FFFFFF" fgColor="#000000" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Scan with the Inkray mobile app</p>
                    <p className="text-xs text-gray-400 mt-1">
                      It connects automatically — no confirmation needed.
                    </p>
                  </div>
                </>
              )}
              <p className="text-xs text-gray-400">Expires in {formatTime(timeRemaining)}</p>
            </div>
          )}

          {state === "connecting" && (
            <div className="flex flex-col items-center gap-4 py-4">
              <HiArrowPath className="size-8 text-primary animate-spin" />
              <p className="text-sm text-gray-600">Connecting your phone…</p>
            </div>
          )}

          {state === "connected" && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <HiCheckCircle className="size-10 text-green-600" />
              </div>
              <div className="text-center">
                <p className="font-medium text-green-600">Successfully Connected!</p>
                <p className="text-sm text-gray-500 mt-1">
                  Your mobile app is now linked to your account.
                </p>
              </div>
              <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
                Done
              </Button>
            </div>
          )}

          {state === "expired" && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                <HiXCircle className="size-10 text-yellow-600" />
              </div>
              <div className="text-center">
                <p className="font-medium text-yellow-600">QR Code Expired</p>
                <p className="text-sm text-gray-500 mt-1">
                  This code has expired. Generate a new one to continue.
                </p>
              </div>
              <Button onClick={generateSession} className="w-full">Generate New Code</Button>
            </div>
          )}

          {state === "error" && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <HiXCircle className="size-10 text-red-600" />
              </div>
              <div className="text-center">
                <p className="font-medium text-red-600">Connection Error</p>
                <p className="text-sm text-gray-500 mt-1">{error}</p>
              </div>
              <Button onClick={generateSession} className="w-full">Try Again</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
