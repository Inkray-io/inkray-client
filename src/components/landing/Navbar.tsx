"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { FaXTwitter } from "react-icons/fa6"
import { HiBars3, HiXMark } from "react-icons/hi2"
import { useWalletConnection } from "@/hooks/useWalletConnection"
import { ROUTES } from "@/constants/routes"

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How it Works", href: "#how-it-works" },
  { label: "For Creators", href: "#audiences" },
  { label: "Technology", href: "#technology" },
]

export function Navbar() {
  const router = useRouter()
  const { isConnected } = useWalletConnection()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const handleNav = (href: string) => {
    setMobileOpen(false)
    const el = document.querySelector(href)
    if (el) el.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <>
      <motion.header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100"
            : "bg-transparent"
        }`}
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          {/* Logo */}
          <a href="/" className="flex-shrink-0">
            <img src="/logo.svg" alt="Inkray" className="h-8" />
          </a>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <button
                key={link.href}
                onClick={() => handleNav(link.href)}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Desktop right side */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href={ROUTES.EXTERNAL.TWITTER}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-500 hover:text-gray-900 transition-colors"
            >
              <FaXTwitter className="w-4 h-4" />
            </a>
            <button
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-b from-[#1a6fff] to-[#005EFC] shadow-[0_1px_2px_rgba(0,94,252,0.4),0_4px_12px_rgba(0,94,252,0.15)] hover:shadow-[0_1px_2px_rgba(0,94,252,0.4),0_6px_20px_rgba(0,94,252,0.25)] hover:-translate-y-px active:translate-y-0 active:shadow-[0_1px_2px_rgba(0,94,252,0.4)] transition-all duration-200 cursor-pointer"
              onClick={() => router.push(ROUTES.FEED)}
            >
              {isConnected ? "Open App" : "Start Writing"}
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? (
              <HiXMark className="w-6 h-6 text-gray-900" />
            ) : (
              <HiBars3 className="w-6 h-6 text-gray-900" />
            )}
          </button>
        </div>
      </motion.header>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-white/98 backdrop-blur-lg md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex flex-col items-center justify-center h-full gap-8">
              {NAV_LINKS.map((link, i) => (
                <motion.button
                  key={link.href}
                  onClick={() => handleNav(link.href)}
                  className="text-xl font-medium text-gray-700 hover:text-gray-900 transition-colors"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  {link.label}
                </motion.button>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: NAV_LINKS.length * 0.08 }}
              >
                <button
                  className="px-8 py-3 rounded-xl text-lg font-semibold text-white bg-gradient-to-b from-[#1a6fff] to-[#005EFC] shadow-[0_1px_2px_rgba(0,94,252,0.4),0_6px_20px_rgba(0,94,252,0.2)] hover:shadow-[0_1px_2px_rgba(0,94,252,0.4),0_8px_28px_rgba(0,94,252,0.3)] hover:-translate-y-px active:translate-y-0 transition-all duration-200 cursor-pointer"
                  onClick={() => {
                    setMobileOpen(false)
                    router.push(ROUTES.FEED)
                  }}
                >
                  {isConnected ? "Open App" : "Start Writing"}
                </button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
