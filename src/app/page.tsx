"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useWalletConnection } from "@/hooks/useWalletConnection"
import { useAuth } from "@/contexts/AuthContext"

import { Navbar } from "@/components/landing/Navbar"
import { Hero } from "@/components/landing/Hero"
import { Features } from "@/components/landing/Features"
import { HowItWorks } from "@/components/landing/HowItWorks"
import { Audiences } from "@/components/landing/Audiences"
import { Technology } from "@/components/landing/Technology"
import { CtaSection } from "@/components/landing/CtaSection"
import { Footer } from "@/components/landing/Footer"

export default function InkrayLanding() {
  const router = useRouter()
  const { isConnected } = useWalletConnection()
  const { isAuthenticated, isLoading } = useAuth()

  // Redirect to auth page after wallet connects (but wait for auth loading to complete)
  useEffect(() => {
    if (isConnected && !isAuthenticated && !isLoading) {
      router.push("/auth")
    }
  }, [isConnected, isAuthenticated, isLoading, router])

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Audiences />
      <Technology />
      <CtaSection />
      <Footer />
    </div>
  )
}
