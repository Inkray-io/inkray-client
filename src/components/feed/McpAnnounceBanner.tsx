"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { HiXMark, HiCommandLine, HiArrowRight } from "react-icons/hi2"
import { ROUTES } from "@/constants/routes"

const DISMISS_KEY = "inkray_mcp_banner_dismissed_v1"

/**
 * Small, subtle feed announcement for the MCP server. Dismissible; the choice is
 * remembered in localStorage so it doesn't come back. Bump the key suffix to
 * re-announce something new later.
 */
export function McpAnnounceBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    try {
      setShow(localStorage.getItem(DISMISS_KEY) !== "1")
    } catch {
      setShow(true)
    }
  }, [])

  if (!show) return null

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "1")
    } catch {
      /* ignore */
    }
    setShow(false)
  }

  return (
    <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-3 py-2">
      <Link
        href={ROUTES.MCP}
        className="group flex min-w-0 flex-1 items-center gap-2.5"
      >
        <span className="inline-flex shrink-0 items-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
          New
        </span>
        <HiCommandLine className="size-4 shrink-0 text-primary" />
        <span className="truncate text-sm text-gray-700">
          MCP server just dropped — connect an AI agent to Inkray.
        </span>
        <span className="ml-auto hidden shrink-0 items-center gap-1 whitespace-nowrap text-sm font-medium text-primary sm:flex">
          Check it out
          <HiArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </Link>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="shrink-0 rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
      >
        <HiXMark className="size-4" />
      </button>
    </div>
  )
}
