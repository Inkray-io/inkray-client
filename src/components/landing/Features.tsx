"use client"

import { motion } from "framer-motion"
import { ShineBorder } from "@/components/ui/shine-border"
import {
  HiPencilSquare,
  HiShieldCheck,
  HiCircleStack,
  HiCurrencyDollar,
  HiSparkles,
  HiUserGroup,
} from "react-icons/hi2"

const FEATURES = [
  {
    icon: HiPencilSquare,
    title: "Effortless Publishing",
    description:
      "Write in a beautiful markdown editor with AI-powered summaries and highlights. Publish to the blockchain in one click.",
  },
  {
    icon: HiShieldCheck,
    title: "True Content Ownership",
    description:
      "Your content lives in your on-chain Vault. You hold the keys — not the platform. Move, delete, or monetize on your terms.",
  },
  {
    icon: HiCircleStack,
    title: "Permanent Storage",
    description:
      "Articles stored on Walrus decentralized storage. No broken links, no disappearing posts. Your words last.",
  },
  {
    icon: HiCurrencyDollar,
    title: "Subscriptions & Tips",
    description:
      "Monetize with paid subscriptions, reader tips, and gated premium content. Direct to your wallet, no middleman fees.",
  },
  {
    icon: HiSparkles,
    title: "NFT Collectibles",
    description:
      "Let readers mint your articles as NFTs. Create digital collectibles from your best work.",
  },
  {
    icon: HiUserGroup,
    title: "Community & Discovery",
    description:
      "Build your audience with follows, comments, bookmarks, and personalized feeds. Get discovered through categories and trending.",
  },
]

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
}

export function Features() {
  return (
    <section id="features" className="bg-[#f8f9fc] px-6 py-24">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Everything you need to publish and own your content
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-lg">
            Simple to use, impossible to lose. A platform where your content
            stays online and stays yours.
          </p>
        </motion.div>

        {/* Grid */}
        <motion.div
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          {FEATURES.map((feature) => (
            <motion.div
              key={feature.title}
              className="relative bg-white rounded-2xl p-7 group"
              variants={cardVariants}
            >
              <ShineBorder
                shineColor={["#005efc", "#A6B0F4"]}
                duration={14}
                borderWidth={1.5}
              />

              <div className="w-12 h-12 bg-primary/[0.08] rounded-xl flex items-center justify-center mb-5">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
