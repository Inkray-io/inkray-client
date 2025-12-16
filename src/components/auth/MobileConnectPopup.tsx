"use client"

import { useState, useEffect, useCallback } from "react"
import { QRCodeSVG } from "qrcode.react"
import { HiCheckCircle, HiXCircle, HiArrowPath } from "react-icons/hi2"
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

type ConnectionState = "generating" | "waiting" | "connected" | "expired" | "error"

export function MobileConnectPopup({ open, onOpenChange }: MobileConnectPopupProps) {
  const [state, setState] = useState<ConnectionState>("generating")
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<number>(0)

  const generateSession = useCallback(async () => {
    setState("generating")
    setError(null)
    setSessionId(null)

    try {
      const response = await mobileAuthAPI.generateSession()
      // Backend wraps response in { success: true, data: {...} }
      const result = response.data
      const data = result.data

      if (data && data.sessionId) {
        setSessionId(data.sessionId)
        setExpiresAt(new Date(data.expiresAt))
        setState("waiting")
      } else {
        throw new Error("Invalid response format from server")
      }
    } catch (err: unknown) {
      console.error("Failed to generate mobile auth session:", err)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      // Reset state when dialog closes
      setState("generating")
      setSessionId(null)
      setExpiresAt(null)
      setError(null)
    }
  }, [open, generateSession])

  // Poll for session status
  useEffect(() => {
    if (!open || !sessionId || state !== "waiting") return

    const pollInterval = setInterval(async () => {
      try {
        const response = await mobileAuthAPI.getSessionStatus(sessionId)
        // Backend wraps response in { success: true, data: {...} }
        const status = response.data.data

        if (status.status === "authenticated") {
          setState("connected")
          clearInterval(pollInterval)
        } else if (status.status === "expired") {
          setState("expired")
          clearInterval(pollInterval)
        }
      } catch (err) {
        console.error("Failed to check session status:", err)
      }
    }, 2000) // Poll every 2 seconds

    return () => clearInterval(pollInterval)
  }, [open, sessionId, state])

  // Update time remaining
  useEffect(() => {
    if (!expiresAt || state !== "waiting") return

    const updateTimer = () => {
      const now = new Date()
      const remaining = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000))
      setTimeRemaining(remaining)

      if (remaining === 0) {
        setState("expired")
      }
    }

    updateTimer()
    const timerInterval = setInterval(updateTimer, 1000)

    return () => clearInterval(timerInterval)
  }, [expiresAt, state])

  // Complete session when user clicks "Confirm Connection"
  const handleCompleteSession = async () => {
    if (!sessionId) return

    try {
      await mobileAuthAPI.completeSession(sessionId)
      setState("connected")
    } catch (err) {
      console.error("Failed to complete session:", err)
      setError("Failed to confirm connection. Please try again.")
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const qrValue = sessionId ? `inkray://auth?session=${sessionId}` : ""

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Mobile App</DialogTitle>
          <DialogDescription>
            Scan this QR code with the Inkray mobile app to connect your account.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center py-6">
          {state === "generating" && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-48 h-48 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
                <HiArrowPath className="size-8 text-gray-400 animate-spin" />
              </div>
              <p className="text-sm text-gray-500">Generating QR code...</p>
            </div>
          )}

          {state === "waiting" && sessionId && (
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-white rounded-lg border">
                <QRCodeSVG
                  value={qrValue}
                  size={192}
                  level="M"
                  includeMargin={false}
                  bgColor="#FFFFFF"
                  fgColor="#000000"
                />
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Scan with the Inkray mobile app
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Expires in {formatTime(timeRemaining)}
                </p>
              </div>
              <Button
                onClick={handleCompleteSession}
                className="w-full"
              >
                Confirm Connection
              </Button>
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
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full"
              >
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
                  The QR code has expired. Generate a new one to continue.
                </p>
              </div>
              <Button onClick={generateSession} className="w-full">
                Generate New QR Code
              </Button>
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
              <Button onClick={generateSession} className="w-full">
                Try Again
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
