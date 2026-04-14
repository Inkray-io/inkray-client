"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ROUTES } from "@/constants/routes"
import {
  HiPencilSquare,
  HiShieldCheck,
  HiCurrencyDollar,
  HiChartBar,
  HiSparkles,
  HiClock,
  HiRss,
  HiHeart,
  HiBookmark,
  HiChatBubbleLeftRight,
  HiNoSymbol,
} from "react-icons/hi2"

const CREATOR_FEATURES = [
  { icon: HiPencilSquare, text: "Rich markdown editor with AI summaries" },
  { icon: HiShieldCheck, text: "Personal content Vault — you own every article" },
  { icon: HiCurrencyDollar, text: "Paid subscriptions and encrypted premium content" },
  { icon: HiChartBar, text: "Reader analytics and subscriber management" },
  { icon: HiSparkles, text: "One-click collectible minting" },
  { icon: HiClock, text: "Scheduled and draft publishing" },
]

const READER_FEATURES = [
  { icon: HiRss, text: "Curated feeds — fresh, trending, and personalized" },
  { icon: HiHeart, text: "Tip creators directly — 100% goes to them" },
  { icon: HiSparkles, text: "Collect favorite articles as digital collectibles" },
  { icon: HiBookmark, text: "Bookmark articles for later" },
  { icon: HiChatBubbleLeftRight, text: "Threaded comments and community discussion" },
  { icon: HiNoSymbol, text: "No ads, no algorithmic manipulation" },
]

function FeatureList({
  items,
}: {
  items: { icon: React.ComponentType<{ className?: string }>; text: string }[]
}) {
  return (
    <ul className="space-y-4">
      {items.map((item) => (
        <li key={item.text} className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/[0.08] flex items-center justify-center flex-shrink-0 mt-0.5">
            <item.icon className="w-4 h-4 text-primary" />
          </div>
          <span className="text-gray-500 text-sm leading-relaxed pt-1">
            {item.text}
          </span>
        </li>
      ))}
    </ul>
  )
}

export function Audiences() {
  return (
    <section id="audiences" className="bg-[#f8f9fc] px-6 py-20">
      <div className="max-w-6xl mx-auto">
        {/* Section header — left-aligned with gradient eyebrow */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
        >
          <p
            className="text-xs font-bold tracking-[0.14em] uppercase mb-3"
            style={{
              background: "linear-gradient(135deg, #005EFC 0%, #4d94ff 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Who It&apos;s For
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            A Better Deal for Creators and Readers
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* For Creators */}
          <motion.div
            className="bg-white rounded-2xl p-7 lg:p-8 border border-gray-100"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="mb-6">
              <p
                className="text-[10px] font-bold tracking-[0.14em] uppercase mb-3"
                style={{
                  background: "linear-gradient(135deg, #005EFC, #4d94ff)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                For Creators
              </p>
              <h3 className="text-lg font-bold text-gray-900 mb-1.5">
                For Writers Who Want Real Ownership
              </h3>
              <p className="text-gray-500 text-sm">
                Publish, monetize, and grow your audience — without handing control to a platform that can change the rules.
              </p>
            </div>
            <FeatureList items={CREATOR_FEATURES} />
            <Link
              href={ROUTES.FOR_WRITERS}
              className="inline-flex items-center gap-1 mt-5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Learn more
              <span className="text-xs">→</span>
            </Link>
          </motion.div>

          {/* For Readers */}
          <motion.div
            className="bg-white rounded-2xl p-7 lg:p-8 border border-gray-100"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
          >
            <div className="mb-6">
              <p
                className="text-[10px] font-bold tracking-[0.14em] uppercase mb-3"
                style={{
                  background: "linear-gradient(135deg, #0a7a3e, #22c55e)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                For Readers
              </p>
              <h3 className="text-lg font-bold text-gray-900 mb-1.5">
                For Readers Who Want Better Content
              </h3>
              <p className="text-gray-500 text-sm">
                Discover independent writers, support them directly, and read content chosen by humans — not by an algorithm.
              </p>
            </div>
            <FeatureList items={READER_FEATURES} />
            <Link
              href={ROUTES.FOR_READERS}
              className="inline-flex items-center gap-1 mt-5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Learn more
              <span className="text-xs">→</span>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
