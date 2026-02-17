"use client"

import { motion } from "framer-motion"
import {
  HiPencilSquare,
  HiShieldCheck,
  HiCircleStack,
  HiCurrencyDollar,
  HiSparkles,
  HiUserGroup,
} from "react-icons/hi2"

// ─── Feature data ─────────────────────────────────────────────────────────────

const HERO = {
  id: "publish",
  icon: HiPencilSquare,
  title: "Effortless Publishing",
  description:
    "Write in a beautiful markdown editor with AI-powered summaries. Publish to the blockchain in one click.",
  tag: "Core feature",
}

const SUPPORTING = [
  {
    id: "ownership",
    icon: HiShieldCheck,
    title: "True Content Ownership",
    description:
      "Your content lives in your on-chain Vault. You hold the keys — not the platform.",
    tag: "On-chain",
    accent: "#0a7a3e",
    accentAlpha12: "rgba(10,122,62,0.12)",
    accentAlpha6: "rgba(10,122,62,0.06)",
    accentAlpha20: "rgba(10,122,62,0.20)",
  },
  {
    id: "storage",
    icon: HiCircleStack,
    title: "Permanent Storage",
    description:
      "Articles stored on Walrus decentralized storage. No broken links, no disappearing posts.",
    tag: "Walrus",
    accent: "#7c3aed",
    accentAlpha12: "rgba(124,58,237,0.12)",
    accentAlpha6: "rgba(124,58,237,0.06)",
    accentAlpha20: "rgba(124,58,237,0.20)",
  },
  {
    id: "monetize",
    icon: HiCurrencyDollar,
    title: "Subscriptions & Tips",
    description:
      "Monetize with paid subscriptions, reader tips, and gated content. Direct to your wallet.",
    tag: "Earn",
    accent: "#b45309",
    accentAlpha12: "rgba(180,83,9,0.12)",
    accentAlpha6: "rgba(180,83,9,0.06)",
    accentAlpha20: "rgba(180,83,9,0.20)",
  },
  {
    id: "nft",
    icon: HiSparkles,
    title: "NFT Collectibles",
    description:
      "Let readers mint your articles as NFTs. Create digital collectibles from your best work.",
    tag: "Mint",
    accent: "#be185d",
    accentAlpha12: "rgba(190,24,93,0.12)",
    accentAlpha6: "rgba(190,24,93,0.06)",
    accentAlpha20: "rgba(190,24,93,0.20)",
  },
  {
    id: "community",
    icon: HiUserGroup,
    title: "Community & Discovery",
    description:
      "Build your audience with follows, comments, and personalized feeds. Get discovered.",
    tag: "Social",
    accent: "#0369a1",
    accentAlpha12: "rgba(3,105,161,0.12)",
    accentAlpha6: "rgba(3,105,161,0.06)",
    accentAlpha20: "rgba(3,105,161,0.20)",
  },
]

// ─── Animation variants ────────────────────────────────────────────────────────

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
}

// ─── Decorative editor SVG (hero card) ───────────────────────────────────────

function EditorLines() {
  return (
    <svg
      aria-hidden
      className="absolute bottom-0 right-0 w-48 h-32 pointer-events-none select-none opacity-80"
      viewBox="0 0 192 128"
      fill="none"
    >
      {/* Simulated text lines */}
      <rect x="0" y="10"  width="96" height="3.5" rx="1.75" fill="rgba(0,94,252,0.12)" />
      <rect x="0" y="22"  width="72" height="3.5" rx="1.75" fill="rgba(0,94,252,0.08)" />
      <rect x="0" y="34"  width="112" height="3.5" rx="1.75" fill="rgba(0,94,252,0.10)" />
      <rect x="0" y="46"  width="56" height="3.5" rx="1.75" fill="rgba(0,94,252,0.07)" />
      <rect x="0" y="58"  width="88" height="3.5" rx="1.75" fill="rgba(0,94,252,0.09)" />
      <rect x="0" y="70"  width="64" height="3.5" rx="1.75" fill="rgba(0,94,252,0.06)" />
      <rect x="0" y="82"  width="104" height="3.5" rx="1.75" fill="rgba(0,94,252,0.08)" />
      <rect x="0" y="94"  width="48" height="3.5" rx="1.75" fill="rgba(0,94,252,0.05)" />
      {/* AI badge chip */}
      <rect x="110" y="8"  width="72" height="18" rx="9"  fill="rgba(0,94,252,0.13)" />
      <rect x="118" y="14" width="8"  height="6"  rx="1.5" fill="rgba(0,94,252,0.30)" />
      <rect x="130" y="15" width="44" height="4"  rx="2"  fill="rgba(0,94,252,0.22)" />
    </svg>
  )
}

// ─── Hero card — spans 2 columns ─────────────────────────────────────────────

function HeroCard() {
  const Icon = HERO.icon
  return (
    <motion.div
      variants={itemVariants}
      className="relative rounded-2xl overflow-hidden h-full"
      style={{
        background: "#ffffff",
        border: "1px solid rgba(0,94,252,0.15)",
        boxShadow:
          "0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(0,94,252,0.08), inset 0 1px 0 rgba(255,255,255,0.9)",
      }}
      whileHover={{
        y: -3,
        boxShadow:
          "0 4px 12px rgba(0,0,0,0.06), 0 20px 52px rgba(0,94,252,0.14), inset 0 1px 0 rgba(255,255,255,0.9)",
        transition: { duration: 0.25, ease: "easeOut" },
      }}
    >
      {/* Left accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] z-10"
        style={{
          background:
            "linear-gradient(180deg, #005EFC 0%, #1a6fff 50%, rgba(0,94,252,0.1) 100%)",
        }}
      />

      {/* Top visual band */}
      <div
        className="relative h-[108px] overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #eef4ff 0%, #dce9ff 45%, #e8f2ff 75%, #f0f7ff 100%)",
        }}
      >
        {/* Radial glow */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 55% 90% at 12% 50%, rgba(0,94,252,0.16) 0%, transparent 65%)",
          }}
        />
        {/* Dot grid */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(0,94,252,0.13) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />
        {/* Oversized icon */}
        <div className="absolute left-7 top-1/2 -translate-y-1/2">
          <div
            className="w-[52px] h-[52px] rounded-2xl flex items-center justify-center"
            style={{
              background: "linear-gradient(145deg, #1a6fff, #005EFC)",
              boxShadow:
                "0 4px 18px rgba(0,94,252,0.38), 0 1px 0 rgba(255,255,255,0.18) inset",
            }}
          >
            <Icon className="w-[26px] h-[26px] text-white" />
          </div>
        </div>
        {/* Tag pill */}
        <span
          className="absolute right-5 top-5 text-[10px] font-bold tracking-[0.12em] uppercase px-2.5 py-1 rounded-full"
          style={{
            background: "rgba(0,94,252,0.10)",
            color: "#005EFC",
            border: "1px solid rgba(0,94,252,0.18)",
          }}
        >
          {HERO.tag}
        </span>
        {/* Editor decoration */}
        <EditorLines />
      </div>

      {/* Content */}
      <div className="px-7 pt-5 pb-6">
        <h3 className="text-[15px] font-bold text-gray-900 mb-1.5">{HERO.title}</h3>
        <p className="text-[13px] text-gray-500 leading-relaxed">{HERO.description}</p>
        {/* Feature pills */}
        <div className="flex flex-wrap gap-1.5 mt-4">
          {["Markdown editor", "AI summaries", "One-click publish"].map((pill) => (
            <span
              key={pill}
              className="text-[11px] font-medium px-2.5 py-0.5 rounded-lg"
              style={{
                background: "rgba(0,94,252,0.06)",
                color: "#005EFC",
                border: "1px solid rgba(0,94,252,0.10)",
              }}
            >
              {pill}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Supporting card ─────────────────────────────────────────────────────────

function SupportCard({ feature }: { feature: typeof SUPPORTING[0] }) {
  const Icon = feature.icon
  return (
    <motion.div
      variants={itemVariants}
      className="relative rounded-2xl overflow-hidden h-full group"
      style={{
        background: "#ffffff",
        border: "1px solid rgba(0,0,0,0.065)",
        boxShadow: "0 1px 2px rgba(0,0,0,0.03), 0 4px 14px rgba(0,0,0,0.04)",
      }}
      whileHover={{
        y: -3,
        boxShadow: `0 4px 12px rgba(0,0,0,0.05), 0 14px 36px ${feature.accentAlpha12}`,
        borderColor: feature.accentAlpha20,
        transition: { duration: 0.22, ease: "easeOut" },
      }}
    >
      {/* Top micro-gradient line */}
      <div
        className="h-[2px] w-full"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${feature.accent}66 35%, ${feature.accent}99 55%, transparent 100%)`,
        }}
      />

      <div className="px-5 pt-4 pb-5">
        {/* Icon + tag */}
        <div className="flex items-start justify-between mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-[1.08]"
            style={{
              background: feature.accentAlpha6,
              border: `1px solid ${feature.accentAlpha20}`,
            }}
          >
            <Icon className="w-5 h-5" style={{ color: feature.accent }} />
          </div>
          <span
            className="text-[9px] font-bold tracking-[0.13em] uppercase px-2 py-0.5 rounded-full"
            style={{
              background: feature.accentAlpha6,
              color: feature.accent,
              border: `1px solid ${feature.accentAlpha12}`,
            }}
          >
            {feature.tag}
          </span>
        </div>

        <h3 className="text-sm font-bold text-gray-900 mb-1.5">{feature.title}</h3>
        <p className="text-[12.5px] text-gray-500 leading-relaxed">{feature.description}</p>
      </div>
    </motion.div>
  )
}

// ─── Section ──────────────────────────────────────────────────────────────────

export function Features() {
  return (
    <section id="features" className="bg-[#f8f9fc] px-6 py-20">
      <div className="max-w-6xl mx-auto">

        {/* Section header */}
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
            Platform Features
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Everything you need to publish and own your content
          </h2>
        </motion.div>

        {/* ── Bento grid ──────────────────────────────────────────────────────
          Mobile  (< 768px): 1 column, all cards stacked
          Tablet  (768–1023px): 2 columns, hero spans both
          Desktop (≥ 1024px): 3 columns, hero spans 2, cards fill right + bottom row
        ─────────────────────────────────────────────────────────────────── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          {/* Row 1: hero (2/3 width) + one support card (1/3 width) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {/* Hero takes 1 col on mobile, 2 on md+, stays 2 on lg */}
            <div className="md:col-span-2 lg:col-span-2">
              <HeroCard />
            </div>
            {/* First supporting card fills the 3rd column on lg, goes below on md */}
            <div className="lg:col-span-1">
              <SupportCard feature={SUPPORTING[0]} />
            </div>
          </div>

          {/* Row 2: remaining 4 support cards in a 4-column row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SUPPORTING.slice(1).map((feature) => (
              <SupportCard key={feature.id} feature={feature} />
            ))}
          </div>
        </motion.div>

      </div>
    </section>
  )
}
