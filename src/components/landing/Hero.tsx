"use client"

import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useWalletConnection } from "@/hooks/useWalletConnection"
import { ROUTES } from "@/constants/routes"

const ARTICLE_CARDS = [
  {
    avatar: "/hero_section/sam.jpg",
    name: "Sam Blackshear",
    handle: "@b1ackd0g",
    date: "Sep 2, 2025",
    readTime: "8 min",
    title: "Why Sui Could Redefine Scalability",
    summary:
      "A deep dive into Sui's object-centric model and parallel transaction execution, designed to eliminate congestion and boost performance.",
  },
  {
    avatar: "/hero_section/walrus.jpeg",
    name: "Walrus Protocol",
    handle: "@WalrusProtocol",
    date: "Sep 4, 2025",
    readTime: "4 min",
    title: "Why Walrus Could Power the Next Era of Web3 Data",
    summary:
      "A closer look at Walrus decentralized storage vaults and stake-aligned durability model, designed for speed, efficiency, and trust.",
    image: "/hero_section/article_image.jpeg",
  },
  {
    avatar: null,
    name: "BlockTrend",
    handle: "@blocktrend",
    date: "Oct 13, 2025",
    readTime: "6 min",
    title: "The Next Digital Shift: Ownership, Community, and Intelligent Networks",
    summary:
      "Exploring how technology is moving beyond data, chains and streams. A new wave redefining networks, transparency, and community-driven value.",
  },
]

const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.15 },
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

export function Hero() {
  const router = useRouter()
  const { isConnected } = useWalletConnection()

  return (
    <section className="bg-white px-6 pt-28 pb-16 lg:pt-32 lg:pb-20">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        {/* Left — Copy */}
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, x: -60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Badge */}
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-medium text-primary">
              Now live on Sui Testnet
            </span>
          </motion.div>

          {/* Headline */}
          <h1 className="text-5xl lg:text-6xl font-semibold text-black leading-[1.1]">
            Write freely.{" "}
            <span className="text-primary">Own forever.</span>
          </h1>

          {/* Subtext */}
          <p className="text-gray-500 text-lg leading-relaxed max-w-lg">
            The publishing platform where your words live on the blockchain.
            No gatekeepers, no takedowns — just your voice, permanently yours.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-5">
            <button
              className="relative px-7 py-3 rounded-xl text-base font-semibold text-white bg-gradient-to-b from-[#1a6fff] to-[#005EFC] shadow-[0_1px_2px_rgba(0,94,252,0.4),0_6px_20px_rgba(0,94,252,0.2)] hover:shadow-[0_1px_2px_rgba(0,94,252,0.4),0_8px_28px_rgba(0,94,252,0.3)] hover:-translate-y-px active:translate-y-0 active:shadow-[0_1px_2px_rgba(0,94,252,0.4)] transition-all duration-200 cursor-pointer"
              onClick={() => router.push(isConnected ? ROUTES.CREATE : ROUTES.FEED)}
            >
              {isConnected ? "Start Writing" : "Try Inkray"}
            </button>
            <button
              className="group relative text-base font-medium text-gray-500 hover:text-gray-900 transition-colors duration-200 cursor-pointer"
              onClick={() => router.push(ROUTES.FEED)}
            >
              Read Articles
              <span className="absolute left-0 -bottom-0.5 w-0 h-px bg-gray-900 group-hover:w-full transition-all duration-300" />
            </button>
          </div>

          {/* Powered by logos */}
          <div className="flex items-center gap-3 pt-2">
            <span className="text-sm text-gray-500">Supported by</span>
            <a href={ROUTES.EXTERNAL.WALRUS} target="_blank" rel="noopener noreferrer">
              <img src="/hero_section/walrus.svg" alt="Walrus" className="h-8" />
            </a>
          </div>
        </motion.div>

        {/* Right — Blue gradient card with article mockups (original style) */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="bg-gradient-to-br from-[#172AE1] via-[#3A52E7] to-white rounded-3xl p-8 min-h-[600px] relative overflow-hidden">
            <motion.div
              className="space-y-4"
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, margin: "-100px" }}
            >
              {ARTICLE_CARDS.map((card, i) => {
                const variants = [floatIn, slideInFromRight, bounceIn]
                return (
                  <motion.div
                    key={i}
                    className="bg-white rounded-xl p-4 shadow-sm"
                    variants={variants[i]}
                    whileHover={{
                      scale: 1.02,
                      y: -5,
                      transition: { duration: 0.2 },
                    }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      {card.avatar ? (
                        <img
                          src={card.avatar}
                          className="w-10 h-10 rounded-full object-cover"
                          alt={card.name}
                        />
                      ) : (
                        <div className="w-10 h-10 bg-[#d9d9d9] rounded-full" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-gray-900 truncate">
                          {card.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          <span className="hidden sm:inline">{card.handle} · </span>
                          {card.date}
                          <span className="hidden sm:inline"> · {card.readTime}</span>
                        </div>
                      </div>
                      <div className="ml-auto flex gap-1">
                        <div className="w-6 h-6 bg-primary/20 rounded" />
                        <div className="w-6 h-6 bg-primary/20 rounded" />
                        <div className="w-6 h-6 bg-primary/20 rounded" />
                      </div>
                    </div>

                    <h3 className="font-semibold text-sm text-gray-900 mb-2">
                      {card.title}
                    </h3>
                    <p className="text-xs text-gray-500">{card.summary}</p>

                    {card.image && (
                      <motion.div
                        className="mt-3 rounded-lg overflow-hidden"
                        whileHover={{ scale: 1.02 }}
                        transition={{ duration: 0.2 }}
                      >
                        <img
                          src={card.image}
                          alt={card.title}
                          className="w-full rounded-lg"
                        />
                      </motion.div>
                    )}
                  </motion.div>
                )
              })}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
