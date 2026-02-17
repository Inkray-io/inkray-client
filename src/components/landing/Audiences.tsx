"use client"

import { motion } from "framer-motion"
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
  HiGlobeAlt,
} from "react-icons/hi2"

const CREATOR_FEATURES = [
  { icon: HiPencilSquare, text: "Markdown editor with AI summaries" },
  { icon: HiShieldCheck, text: "On-chain content vault — you own it" },
  { icon: HiCurrencyDollar, text: "Subscription monetization" },
  { icon: HiChartBar, text: "Audience analytics & CRM" },
  { icon: HiSparkles, text: "NFT minting for articles" },
  { icon: HiClock, text: "Scheduled publishing" },
]

const READER_FEATURES = [
  { icon: HiRss, text: "Curated feeds — fresh, popular, personalized" },
  { icon: HiHeart, text: "Support creators directly with tips" },
  { icon: HiSparkles, text: "Collect articles as NFTs" },
  { icon: HiBookmark, text: "Bookmark & save for later" },
  { icon: HiChatBubbleLeftRight, text: "Comments & community" },
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
          <span className="text-gray-600 text-sm leading-relaxed pt-1">
            {item.text}
          </span>
        </li>
      ))}
    </ul>
  )
}

export function Audiences() {
  return (
    <section id="audiences" className="bg-[#f8f9fc] px-6 py-24">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-16">
          {/* For Creators */}
          <motion.div
            className="bg-white rounded-2xl p-8 lg:p-10"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-8">
              <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wide uppercase mb-4">
                For Creators
              </span>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Built for writers who want to own their work
              </h3>
              <p className="text-gray-500 text-sm">
                Everything you need to publish, monetize, and grow — without giving up control.
              </p>
            </div>
            <FeatureList items={CREATOR_FEATURES} />
          </motion.div>

          {/* For Readers */}
          <motion.div
            className="bg-white rounded-2xl p-8 lg:p-10"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="mb-8">
              <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-semibold tracking-wide uppercase mb-4">
                For Readers
              </span>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Discover voices that matter
              </h3>
              <p className="text-gray-500 text-sm">
                Find great content, support the creators you love, and be part of a community that values quality.
              </p>
            </div>
            <FeatureList items={READER_FEATURES} />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
