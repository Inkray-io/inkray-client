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
  title: "Publish in Seconds",
  description:
    "Write in a clean markdown editor with AI-powered summaries. Hit publish and your article goes live — permanently stored and always accessible.",
  tag: "Core feature",
}

const SUPPORTING = [
  {
    id: "ownership",
    icon: HiShieldCheck,
    title: "True Content Ownership",
    description:
      "Your articles live in your personal Vault. You hold the keys — not us. Your content can't be removed, modified, or held hostage.",
    tag: "Ownership",
    accent: "#0a7a3e",
    accentAlpha12: "rgba(10,122,62,0.12)",
    accentAlpha6: "rgba(10,122,62,0.06)",
    accentAlpha20: "rgba(10,122,62,0.20)",
  },
  {
    id: "storage",
    icon: HiCircleStack,
    title: "Content That Lasts",
    description:
      "Every article is distributed across a global storage network. No broken links, no disappearing posts — your work stays online for good.",
    tag: "Storage",
    accent: "#7c3aed",
    accentAlpha12: "rgba(124,58,237,0.12)",
    accentAlpha6: "rgba(124,58,237,0.06)",
    accentAlpha20: "rgba(124,58,237,0.20)",
  },
  {
    id: "monetize",
    icon: HiCurrencyDollar,
    title: "Earn From Your Writing",
    description:
      "Set up paid subscriptions, accept reader tips, and gate premium content. Earnings go directly to you — no revenue splits, no payout delays.",
    tag: "Earn",
    accent: "#b45309",
    accentAlpha12: "rgba(180,83,9,0.12)",
    accentAlpha6: "rgba(180,83,9,0.06)",
    accentAlpha20: "rgba(180,83,9,0.20)",
  },
  {
    id: "nft",
    icon: HiSparkles,
    title: "Collectible Articles",
    description:
      "Let readers collect your best pieces as digital collectibles. A new way for your audience to support and own a piece of your work.",
    tag: "Collect",
    accent: "#be185d",
    accentAlpha12: "rgba(190,24,93,0.12)",
    accentAlpha6: "rgba(190,24,93,0.06)",
    accentAlpha20: "rgba(190,24,93,0.20)",
  },
  {
    id: "community",
    icon: HiUserGroup,
    title: "Grow Without Algorithms",
    description:
      "Build your readership with follows, comments, and curated feeds. Readers find you through quality — not engagement tricks.",
    tag: "Community",
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
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
}

// ─── Animated beam path (hero card) ──────────────────────────────────────────
//
// Three nodes: Write → AI → Published, connected by an SVG path.
// A gradient beam travels along the path, illuminating each node on arrival.
// 4.5s cycle, clean and looping.

const BEAM_D = 4.5

// Node positions as percentages of the container width
const NODES = [
  { x: 15, icon: "pen",     label: "Write" },
  { x: 50, icon: "sparkle", label: "Enhance" },
  { x: 85, icon: "check",   label: "Published" },
]

function NodeIcon({ type, size = 14 }: { type: string; size?: number }) {
  if (type === "pen") return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  )
  if (type === "sparkle") return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z" />
      <path d="M18 15l.75 2.25L21 18l-2.25.75L18 21l-.75-2.25L15 18l2.25-.75z" opacity="0.6" />
    </svg>
  )
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}

function EditorAnimation() {
  return (
    <div
      aria-hidden
      className="absolute right-6 top-0 bottom-0 pointer-events-none select-none"
      style={{ width: "55%" }}
    >
      {/* SVG layer — path + animated beam stroke */}
      <svg className="absolute inset-0 w-full h-full overflow-visible" fill="none">
        {/* Static track line */}
        <line
          x1="15%"  y1="42%"
          x2="85%" y2="42%"
          stroke="rgba(0,94,252,0.07)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Animated beam — a short dash segment that travels along the line */}
        <motion.line
          x1="15%"  y1="42%"
          x2="85%" y2="42%"
          stroke="url(#beamStroke)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="18% 82%"
          animate={{ strokeDashoffset: ["18%", "18%", "-82%", "-82%"] }}
          transition={{
            duration: BEAM_D,
            times: [0, 0.06, 0.88, 1],
            repeat: Infinity,
            ease: [0.35, 0.1, 0.25, 1],
          }}
        />
        <defs>
          <linearGradient id="beamStroke" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#005EFC" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.6" />
          </linearGradient>
        </defs>
      </svg>

      {/* Nodes — positioned with flexbox, spaced evenly */}
      <div className="absolute inset-0 flex items-center justify-between px-[8%]">
        {NODES.map((node, i) => (
          <div key={node.icon} className="flex flex-col items-center gap-1.5">
            {/* Glow ring + icon */}
            <motion.div
              className="relative flex items-center justify-center"
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.6)",
                border: "1.5px solid rgba(0,94,252,0.12)",
                color: "rgba(0,94,252,0.35)",
              }}
              animate={{
                boxShadow: [
                  "0 0 0 0 rgba(0,94,252,0)",
                  "0 0 0 0 rgba(0,94,252,0)",
                  `0 0 16px 4px rgba(${i === 2 ? "10,122,62" : "0,94,252"},0.18)`,
                  `0 0 16px 4px rgba(${i === 2 ? "10,122,62" : "0,94,252"},0.18)`,
                  "0 0 0 0 rgba(0,94,252,0)",
                ],
                borderColor: [
                  "rgba(0,94,252,0.12)",
                  "rgba(0,94,252,0.12)",
                  `rgba(${i === 2 ? "10,122,62" : "0,94,252"},0.35)`,
                  `rgba(${i === 2 ? "10,122,62" : "0,94,252"},0.35)`,
                  "rgba(0,94,252,0.12)",
                ],
                color: [
                  "rgba(0,94,252,0.3)",
                  "rgba(0,94,252,0.3)",
                  `rgba(${i === 2 ? "10,122,62" : "0,94,252"},0.7)`,
                  `rgba(${i === 2 ? "10,122,62" : "0,94,252"},0.7)`,
                  "rgba(0,94,252,0.3)",
                ],
                scale: [1, 1, 1.1, 1.1, 1],
              }}
              transition={{
                duration: BEAM_D,
                times: [
                  0,
                  0.05 + i * 0.35 * 0.95,
                  0.1 + i * 0.35 * 0.95,
                  0.2 + i * 0.35 * 0.95,
                  Math.min(0.35 + i * 0.35 * 0.95, 0.99),
                ],
                repeat: Infinity,
                ease: "easeOut",
              }}
            >
              <NodeIcon type={node.icon} />
            </motion.div>

            {/* Label */}
            <motion.span
              className="text-[8px] font-semibold tracking-wide uppercase"
              style={{ color: "rgba(0,94,252,0.3)" }}
              animate={{
                color: [
                  "rgba(0,94,252,0.25)",
                  "rgba(0,94,252,0.25)",
                  `rgba(${i === 2 ? "10,122,62" : "0,94,252"},0.6)`,
                  `rgba(${i === 2 ? "10,122,62" : "0,94,252"},0.6)`,
                  "rgba(0,94,252,0.25)",
                ],
              }}
              transition={{
                duration: BEAM_D,
                times: [
                  0,
                  0.05 + i * 0.35 * 0.95,
                  0.1 + i * 0.35 * 0.95,
                  0.2 + i * 0.35 * 0.95,
                  Math.min(0.35 + i * 0.35 * 0.95, 0.99),
                ],
                repeat: Infinity,
              }}
            >
              {node.label}
            </motion.span>
          </div>
        ))}
      </div>
    </div>
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
        className="relative h-[100px] overflow-hidden"
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
        {/* Animated editor visual */}
        <EditorAnimation />
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
            Features
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Everything a Modern Publishing Platform Should Be
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
