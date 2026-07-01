"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"

interface BackButtonProps {
  fallbackHref?: string
  label?: string
  className?: string
}

export function BackButton({ fallbackHref, label = "Back", className }: BackButtonProps) {
  const router = useRouter()

  const handleClick = () => {
    // Prefer real "back" when there's history to go back to; otherwise (e.g. the
    // page was opened directly in a new tab, so router.back() would no-op) fall
    // back to the provided href, or home.
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back()
    } else {
      router.push(fallbackHref ?? "/")
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className={cn("gap-2", className)}
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Button>
  )
}
