"use client"

import { motion } from "framer-motion"
import {
  HiExclamationTriangle,
  HiTrash,
  HiEyeSlash,
  HiShieldCheck,
  HiCircleStack,
  HiLockClosed,
  HiCheck,
  HiXMark,
} from "react-icons/hi2"
import { Navbar } from "@/components/landing/Navbar"
import { Footer } from "@/components/landing/Footer"
import { FaqSection } from "@/components/landing/FaqSection"
import { PageCta } from "@/components/landing/PageCta"

const PROBLEMS = [
  {
    icon: HiExclamationTriangle,
    title: "Platform Risk",
    description:
      "A platform can shut down, change its terms, or suspend your account without warning. In 2023, several blogging platforms closed abruptly, leaving writers with no access to years of published work and no way to redirect their readers.",
  },
  {
    icon: HiTrash,
    title: "Disappearing Content",
    description:
      "Content hosted on centralized servers can be deleted at any time. Platforms routinely remove articles that no longer fit their editorial direction, and writers often discover their work is gone only after readers report broken links.",
  },
  {
    icon: HiEyeSlash,
    title: "Algorithmic Suppression",
    description:
      "Even when content remains online, platform algorithms decide who sees it. A change in ranking criteria can reduce a creator's reach overnight, cutting traffic and revenue without explanation or recourse.",
  },
]

const SOLUTIONS = [
  {
    icon: HiShieldCheck,
    title: "Personal Vault on Sui",
    description:
      "Every article you publish is registered on the Sui blockchain as a digital asset in your personal vault. Sui processes transactions in under 400 milliseconds, so publishing feels instant while the ownership record remains permanent and verifiable.",
  },
  {
    icon: HiCircleStack,
    title: "Permanent Storage on Walrus",
    description:
      "Article content is stored on Walrus, a decentralized storage network that splits data across independent nodes using erasure coding. Even if a portion of nodes go offline, your content remains fully retrievable — no single point of failure.",
  },
  {
    icon: HiLockClosed,
    title: "Encrypted Access with Seal",
    description:
      "Premium content is encrypted using Seal, a threshold encryption protocol. Only readers who meet your access conditions — such as holding a subscription — can decrypt and read the content. You set the rules; the protocol enforces them.",
  },
]

const COMPARISON_ROWS = [
  {
    label: "Content Ownership",
    traditional: "Platform owns and controls your content",
    inkray: "You own every article as a digital asset",
  },
  {
    label: "Data Portability",
    traditional: "Limited export options, often lose formatting",
    inkray: "Content stored on open protocols, always accessible",
  },
  {
    label: "Content Permanence",
    traditional: "Can be deleted or lost if platform shuts down",
    inkray: "Stored permanently on decentralized infrastructure",
  },
  {
    label: "Revenue Control",
    traditional: "Platform sets rates and takes a cut of earnings",
    inkray: "You choose your pricing, payments go directly to you",
  },
  {
    label: "Censorship Resistance",
    traditional: "Platform can remove content without notice",
    inkray: "No single entity can take down your published work",
  },
]

const FAQ_ITEMS = [
  {
    question: "What does content ownership actually mean for creators?",
    answer:
      "Content ownership means you hold the legal and technical rights to your work. On Inkray, each article you publish is registered as a digital asset on the Sui blockchain. You can verify ownership at any time, and no platform or third party can modify, delete, or restrict access to your content without your permission.",
  },
  {
    question: "How is content ownership different from copyright?",
    answer:
      "Copyright is a legal right that exists automatically when you create original work. Content ownership on Inkray adds a technical layer: your work is stored on decentralized infrastructure and registered on-chain, so even if a platform disappears, your content and proof of authorship remain intact and accessible.",
  },
  {
    question: "Can a platform really delete my content?",
    answer:
      "On most traditional platforms, yes. When you publish on a centralized service, the platform controls the servers where your content lives. They can remove articles, suspend accounts, or shut down entirely. On Inkray, content is stored on Walrus — a decentralized storage network — so no single entity has the ability to delete it.",
  },
  {
    question: "What happens to my content if Inkray shuts down?",
    answer:
      "Your content remains available. Articles are stored on Walrus and ownership records live on the Sui blockchain. Both are open, decentralized networks that operate independently of Inkray. Even without the Inkray interface, your content can be retrieved and your ownership verified.",
  },
  {
    question: "Do I need a crypto wallet to own my content on Inkray?",
    answer:
      "Yes, you need a Sui-compatible wallet to publish and manage your content. The wallet serves as your identity and proof of ownership. Setting one up takes under a minute, and Inkray guides you through the process when you create your account.",
  },
  {
    question: "Can I move my content from another platform to Inkray?",
    answer:
      "You can import your existing articles into Inkray. Once published on the platform, each piece is stored on decentralized infrastructure and registered to your wallet. Your content gains permanent storage and verifiable ownership from that point forward.",
  },
  {
    question: "How does content ownership affect monetization?",
    answer:
      "When you own your content, you control how it is monetized. You set subscription prices, accept reader tips, and sell collectible editions — all without a platform dictating rates or taking a percentage. Payments go directly to your wallet.",
  },
  {
    question: "Is my content private or public on the blockchain?",
    answer:
      "You choose. Free articles are publicly accessible. Premium content is encrypted using Seal, and only readers who meet your access conditions can decrypt it. The ownership record is public and verifiable, but the content itself remains private until you decide otherwise.",
  },
]

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
}

export default function ContentOwnershipPage() {
  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="bg-white px-6 pt-28 pb-16">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl"
          >
            <h1 className="text-4xl lg:text-5xl font-semibold text-gray-900 leading-tight mb-6">
              What Is Content Ownership and Why Should Creators Care?
            </h1>
            <p className="text-lg text-gray-500 leading-relaxed">
              Content ownership means you — not a platform — hold the rights to
              your writing, your audience relationships, and your revenue
              streams. When creators own their content, they can publish freely,
              move between platforms without losing work, and build a body of
              writing that no company can take away.
            </p>
          </motion.div>
        </div>
      </section>

      {/* The Problem */}
      <section className="bg-[#f8f9fc] px-6 py-20">
        <div className="max-w-6xl mx-auto">
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
              The Problem
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Why Creators Are Losing Control
            </h2>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-3 gap-5 md:gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            {PROBLEMS.map((problem) => (
              <motion.div
                key={problem.title}
                variants={cardVariants}
                className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-[0_2px_16px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 transition-all duration-300"
              >
                <problem.icon className="w-6 h-6 text-primary mb-4 opacity-70" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {problem.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {problem.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How Inkray Solves It */}
      <section className="bg-white px-6 py-20">
        <div className="max-w-6xl mx-auto">
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
              The Solution
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              How Inkray Solves It
            </h2>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-3 gap-5 md:gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            {SOLUTIONS.map((solution) => (
              <motion.div
                key={solution.title}
                variants={cardVariants}
                className="bg-[#f8f9fc] rounded-2xl border border-gray-100 p-6 hover:border-primary/15 hover:shadow-[0_2px_16px_rgba(0,94,252,0.06)] hover:-translate-y-0.5 transition-all duration-300"
              >
                <solution.icon className="w-6 h-6 text-primary mb-4 opacity-70" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {solution.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {solution.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Comparison */}
      <section className="bg-[#f8f9fc] px-6 py-20">
        <div className="max-w-6xl mx-auto">
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
              Comparison
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Traditional Platforms vs. Inkray
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
          >
            {/* Header */}
            <div className="grid grid-cols-[1fr_1fr_1fr] sm:grid-cols-[1.2fr_1fr_1fr] border-b border-gray-100">
              <div className="px-5 py-4" />
              <div className="px-5 py-4 border-l border-gray-100">
                <p className="text-xs font-bold tracking-[0.1em] uppercase text-gray-400">
                  Traditional Platform
                </p>
              </div>
              <div className="px-5 py-4 border-l border-gray-100 bg-primary/[0.02]">
                <p
                  className="text-xs font-bold tracking-[0.1em] uppercase"
                  style={{
                    background:
                      "linear-gradient(135deg, #005EFC 0%, #4d94ff 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Inkray
                </p>
              </div>
            </div>

            {/* Rows */}
            {COMPARISON_ROWS.map((row, i) => (
              <div
                key={row.label}
                className={`grid grid-cols-[1fr_1fr_1fr] sm:grid-cols-[1.2fr_1fr_1fr] ${
                  i < COMPARISON_ROWS.length - 1
                    ? "border-b border-gray-100"
                    : ""
                }`}
              >
                <div className="px-5 py-4">
                  <p className="text-sm font-semibold text-gray-900">
                    {row.label}
                  </p>
                </div>
                <div className="px-5 py-4 border-l border-gray-100 flex items-start gap-2">
                  <HiXMark className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-gray-500">{row.traditional}</p>
                </div>
                <div className="px-5 py-4 border-l border-gray-100 bg-primary/[0.02] flex items-start gap-2">
                  <HiCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-sm text-gray-700">{row.inkray}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <FaqSection items={FAQ_ITEMS} eyebrow="Content Ownership FAQ" />

      {/* CTA */}
      <PageCta
        heading="Take Ownership of Your Content"
        subtext="Publish on a platform where every article you write is permanently yours. No platform risk, no disappearing content — just your words, owned by you."
      />

      <Footer />
    </>
  )
}
