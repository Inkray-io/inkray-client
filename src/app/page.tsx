"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ShineBorder } from "@/components/ui/shine-border"
import { ConnectButton } from "@mysten/dapp-kit"
import { HiFolderOpen, HiCurrencyDollar, HiLink } from "react-icons/hi2"
import { motion } from "framer-motion"
import { RiQuillPenAiFill } from "react-icons/ri"
import { useWalletConnection } from "@/hooks/useWalletConnection"
import { useAuth } from "@/contexts/AuthContext"
import { ROUTES } from "@/constants/routes"

export default function InkrayLanding() {
  const router = useRouter()
  const { isConnected } = useWalletConnection()
  const { isAuthenticated } = useAuth()

  // Redirect to feed if user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/feed')
    }
  }, [isAuthenticated, router])

  // Redirect to auth page after wallet connects
  useEffect(() => {
    if (isConnected && !isAuthenticated) {
      router.push('/auth')
    }
  }, [isConnected, isAuthenticated, router])

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  }

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.15,
      },
    },
  }

  const floatIn = {
    initial: { opacity: 0, y: 80, x: 30, scale: 0.9 },
    animate: { opacity: 1, y: 0, x: 0, scale: 1 },
    transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] },
  }

  const slideInFromRight = {
    initial: { opacity: 0, x: 100, rotate: 3 },
    animate: { opacity: 1, x: 0, rotate: 0 },
    transition: { duration: 0.7 },
  }

  const bounceIn = {
    initial: { opacity: 0, scale: 0.3, y: 50 },
    animate: { opacity: 1, scale: 1, y: 0 },
    transition: { duration: 0.6, ease: [0.68, -0.55, 0.265, 1.55] },
  }

  const slideInLeft = {
    initial: { opacity: 0, x: -60 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.8 },
  }

  const slideInRight = {
    initial: { opacity: 0, x: 60 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.8, delay: 0.2 },
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <motion.header
        className="px-6 py-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <img src="/logo.svg" alt="Inkray" />
          <div className="flex items-center gap-4">
            {!isAuthenticated && <ConnectButton />}
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="px-6 py-16">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <motion.div className="space-y-6" {...slideInLeft}>
            <div className="text-sm bg-primary/10 text-primary font-medium inline-block py-1 px-4 rounded-full">First Sui Testnet coming soon</div>
            <h1 className="text-5xl lg:text-6xl font-semibold text-black">
              True digital <span className="text-primary">ownership</span> for creators
            </h1>
            <div className="space-y-2 text-[#626262]">
              <p>Inkray combines the simplicity of modern blogging with the power of blockchain ownership. Publish effortlessly, own permanently.</p>
            </div>
            <Button className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg" asChild>
              <a href={ROUTES.EXTERNAL.TWITTER} target="_blank" rel="noopener noreferrer">Follow us on X</a>
            </Button>

            <div className="mt-12 flex items-center">Supported by <a href={ROUTES.EXTERNAL.WALRUS} target="_blank"><img src="/hero_section/walrus.svg" alt="Walrus" className="ml-2 h-8" /></a></div>
          </motion.div>

          <motion.div className="relative" {...slideInRight}>
            <div className="bg-gradient-to-br from-[#172AE1] via-[#3A52E7] to-white rounded-3xl p-8 min-h-[600px] relative overflow-hidden">
              {/* Social Media Posts Mockup */}
              <motion.div
                className="space-y-4"
                variants={staggerContainer}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true, margin: "-100px" }}
              >
                {/* Post 1 - Enhanced with floatIn animation and hover effects */}
                <motion.div
                  className="bg-white rounded-xl p-4 shadow-sm"
                  variants={floatIn}
                  whileHover={{
                    scale: 1.02,
                    y: -5,
                    transition: { duration: 0.2 },
                  }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <img src="/hero_section/sam.jpg" className="w-10 h-10 rounded-full" />
                    <div>
                      <div className="font-semibold text-sm">Sam <span className="hidden sm:inline-block">Blackshear</span></div>
                      <div className="text-xs text-[#626262]"><span className="hidden sm:inline-block">@b1ackd0g • </span>Sep 2, 2025<span className="hidden sm:inline-block"> • 8 min</span></div>
                    </div>
                    <div className="ml-auto flex gap-1">
                      <div className="w-6 h-6 bg-primary/20 rounded"></div>
                      <div className="w-6 h-6 bg-primary/20 rounded"></div>
                      <div className="w-6 h-6 bg-primary/20 rounded"></div>
                    </div>
                  </div>
                  <h3 className="font-semibold text-sm mb-2">Why Sui Could Redefine Scalability</h3>
                  <p className="text-xs text-[#626262]">
                    A deep dive into Sui&apos;s object-centric model and parallel transaction execution, designed to
                    eliminate congestion and boost performance.
                  </p>
                </motion.div>

                {/* Post 2 - Enhanced with slideInFromRight animation and hover effects */}
                <motion.div
                  className="bg-white rounded-xl p-4 shadow-sm"
                  variants={slideInFromRight}
                  whileHover={{
                    scale: 1.02,
                    rotate: -1,
                    transition: { duration: 0.2 },
                  }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <img src="/hero_section/walrus.jpeg" className="w-10 h-10 rounded-full" />
                    <div>
                      <div className="font-semibold text-sm">Walrus 🦭</div>
                      <div className="text-xs text-[#626262]"><span className="hidden sm:inline-block">@WalrusProtocol • </span>Sep 4, 2025<span className="hidden sm:inline-block"> • 4 min</span></div>
                    </div>
                    <div className="ml-auto flex gap-1">
                      <div className="w-6 h-6 bg-primary/20 rounded"></div>
                      <div className="w-6 h-6 bg-primary/20 rounded"></div>
                      <div className="w-6 h-6 bg-primary/20 rounded"></div>
                    </div>
                  </div>
                  <h3 className="font-semibold text-sm mb-2">Why Walrus Could Power the Next Era of Web3 Data</h3>
                  <p className="text-xs text-[#626262]">
                    A closer look at Walrus decentralized storage vaults and stake-aligned durability model, designed for speed, efficiency, and trust.
                  </p>

                  {/* Sui Logo Card - Added subtle animation to the Sui card */}
                  <motion.div
                    className="mt-3 rounded-lg flex items-center justify-center"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <img src="/hero_section/article_image.jpeg" alt="Article by Walrus" className="rounded-lg" />
                  </motion.div>
                </motion.div>

                {/* Post 3 - Enhanced with bounceIn animation and hover effects */}
                <motion.div
                  className="bg-white rounded-xl p-4 shadow-sm"
                  variants={bounceIn}
                  whileHover={{
                    scale: 1.02,
                    x: 5,
                    transition: { duration: 0.2 },
                  }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-[#d9d9d9] rounded-full aspect-square"></div>
                    <div>
                      <div className="font-semibold text-sm">BlockTrend</div>
                      <div className="text-xs text-[#626262]"><span className="hidden sm:inline-block">@blocktrend • </span>Oct 13, 2025<span className="hidden sm:inline-block"> • 6 min</span></div>
                    </div>
                    <div className="ml-auto flex gap-1">
                      <div className="w-6 h-6 bg-primary/20 rounded"></div>
                      <div className="w-6 h-6 bg-primary/20 rounded"></div>
                      <div className="w-6 h-6 bg-primary/20 rounded"></div>
                    </div>
                  </div>
                  <h3 className="font-semibold text-sm mb-2">
                    The Next Digital Shift: Ownership, Community, and Intelligent Networks
                  </h3>
                  <p className="text-xs text-[#626262]">
                    Exploring how technology is moving beyond data, chains and streams. A new wave of technologies is
                    redefining networks, transparency, and community-driven value.
                  </p>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-16 bg-[#fdfdff]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold text-[#292d32] mb-4">Why Inkray is different</h2>
            <p className="text-[#626262] max-w-3xl mx-auto">
              Simple to use, impossible to lose: a platform where your content stays online and stays yours
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 gap-8"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
          >
            {/* Feature 1 */}
            <motion.div className="relative rounded-2xl p-8 bg-white" variants={fadeInUp}>
              <ShineBorder shineColor={["#005efc", "#A6B0F4"]} duration={12} borderWidth={2} />
              <div className="w-12 h-12 bg-[#eaf1ff] rounded-xl flex items-center justify-center mb-6">
                <RiQuillPenAiFill className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-[#292d32] mb-3">Effortless Publishing</h3>
              <p className="text-[#626262]">Create, upload, and share with the same ease you expect from any modern platform—no steep learning curve, just seamless publishing.</p>
            </motion.div>

            {/* Feature 2 */}
            <motion.div className="relative rounded-2xl p-8 bg-white" variants={fadeInUp}>
              <ShineBorder shineColor={["#005efc", "#A6B0F4"]} duration={14} borderWidth={2} />
              <div className="w-12 h-12 bg-[#eaf1ff] rounded-xl flex items-center justify-center mb-6">
                <HiFolderOpen className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-[#292d32] mb-3">Creator-Owned Content</h3>
              <p className="text-[#626262]">
                Your work lives on-chain in your Vault, meaning you—not the platform—hold the keys. True digital ownership, finally made simple.
              </p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div className="relative rounded-2xl p-8 bg-white" variants={fadeInUp}>
              <ShineBorder shineColor={["#005efc", "#A6B0F4"]} duration={16} borderWidth={2} />
              <div className="w-12 h-12 bg-[#eaf1ff] rounded-xl flex items-center justify-center mb-6">
                <HiLink className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-[#292d32] mb-3">Secure and Permanent</h3>
              <p className="text-[#626262]">
                No hidden policies, no broken links. Every post is backed by blockchain security and stored for the long term—verifiable, transparent, and built to last.
              </p>
            </motion.div>

            {/* Feature 4 */}
            <motion.div className="relative rounded-2xl p-8 bg-white" variants={fadeInUp}>
              <ShineBorder shineColor={["#005efc", "#A6B0F4"]} duration={18} borderWidth={2} />
              <div className="w-12 h-12 bg-[#eaf1ff] rounded-xl flex items-center justify-center mb-6">
                <HiCurrencyDollar className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-[#292d32] mb-3">Empowering the Creator Economy</h3>
              <p className="text-[#626262]">
                Go beyond publishing—earn through subscriptions, premium access, or digital collectibles. Inkray gives you new ways to connect with your audience and monetize your work.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="relative bg-gradient-to-br from-primary sm:from-40% from-50% to-white rounded-3xl p-12 sm:p-16 text-center overflow-hidden"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
          >
            {/* Grid pattern overlay */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute inset-0 bg-grid-pattern"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-white/30"></div>
            </div>

            {/* Content with relative positioning to appear above overlay */}
            <motion.div
              className="relative z-10"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-white">Decentralization where it matters.</h2>
              <p className="text-xl mb-8 opacity-90 text-white">A platform that enhances, not controls.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="secondary" className="bg-white text-primary hover:bg-gray-100 px-8 py-3 rounded-lg" asChild>
                  <a href={ROUTES.EXTERNAL.TWITTER} target="_blank" rel="noopener noreferrer">Follow Us</a>
                </Button>
                {/* <Button
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-primary px-8 py-3 rounded-lg bg-transparent"
                >
                  Contact us
                </Button> */}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-[#e3e3e3]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-[#626262]">Built with 💧 by the Inkray team</div>
          <div className="text-sm text-[#626262]">2025 Inkray. All Right Reserved.</div>
        </div>
      </footer>
    </div>
  )
}
