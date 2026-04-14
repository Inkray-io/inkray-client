"use client"

import { motion } from "framer-motion"
import {
  HiShieldCheck,
  HiCurrencyDollar,
  HiCircleStack,
  HiUserGroup,
} from "react-icons/hi2"

import { Navbar } from "@/components/landing/Navbar"
import { Footer } from "@/components/landing/Footer"
import { FaqSection } from "@/components/landing/FaqSection"
import { PageCta } from "@/components/landing/PageCta"
import { ComparisonTable } from "@/components/landing/ComparisonTable"

const COMPARISON_PLATFORMS = ["Inkray", "Substack", "Medium", "Ghost", "Mirror"]

const COMPARISON_ROWS = [
  {
    feature: "True Content Ownership",
    values: [true, false, false, "partial", true] as const,
  },
  {
    feature: "Permanent Storage",
    values: [true, false, false, false, true] as const,
  },
  {
    feature: "Paid Subscriptions",
    values: [true, true, "partial", true, false] as const,
  },
  {
    feature: "Tips (No Platform Fee)",
    values: [true, false, false, false, false] as const,
  },
  {
    feature: "Collectible Articles (NFTs)",
    values: [true, false, false, false, true] as const,
  },
  {
    feature: "Algorithm-Free Feed",
    values: [true, "partial", false, true, true] as const,
  },
  {
    feature: "Encrypted Premium Content",
    values: [true, false, false, false, false] as const,
  },
  {
    feature: "Custom Domain",
    values: [false, true, false, true, false] as const,
  },
  {
    feature: "Open Source",
    values: [true, false, false, true, "partial"] as const,
  },
  {
    feature: "Free to Start",
    values: [true, true, true, false, true] as const,
  },
]

const DIFFERENTIATORS = [
  {
    icon: HiShieldCheck,
    title: "You Own Your Content",
    description:
      "Every article you publish is stored on-chain and belongs to you — not the platform. No terms of service can take it away, and no company shutdown can erase your work.",
  },
  {
    icon: HiCurrencyDollar,
    title: "Earn Without Revenue Splits",
    description:
      "Keep what you earn. Inkray charges no percentage on tips, and subscription revenue goes directly to you. No hidden fees eating into your income.",
  },
  {
    icon: HiCircleStack,
    title: "Content That Can't Disappear",
    description:
      "Your writing is stored permanently using decentralized storage. Even if Inkray shut down tomorrow, your content would still be accessible and verifiably yours.",
  },
  {
    icon: HiUserGroup,
    title: "No Algorithmic Manipulation",
    description:
      "Your readers see your content in a chronological feed — not whatever an algorithm decides will maximize engagement. Build a real audience, not a follower count.",
  },
]

const FAQ_ITEMS = [
  {
    question: "Can I migrate my existing Substack content to Inkray?",
    answer:
      "Yes. You can export your Substack content and bring it to Inkray. Your articles, subscriber lists, and archives can be moved over so you don't lose anything you've already built.",
  },
  {
    question: "How much does Inkray cost?",
    answer:
      "Inkray is free to start. You can publish articles, build an audience, and accept tips at no cost. There are small network fees for on-chain transactions, but there are no monthly platform fees or subscription charges to use Inkray as a creator.",
  },
  {
    question: "Do I actually own my audience on Inkray?",
    answer:
      "Yes. Your subscriber relationships exist on-chain, meaning they're tied to your account — not controlled by the platform. You can always see and communicate with your audience, and no platform policy change can cut you off from them.",
  },
  {
    question: "How does monetization compare to Substack?",
    answer:
      "Substack takes 10% of your subscription revenue plus payment processing fees. Inkray takes no cut of your tips, and subscription revenue goes directly to you. You can also earn by turning articles into collectibles that readers can purchase.",
  },
  {
    question: "Do I need to understand crypto or blockchain to use Inkray?",
    answer:
      "No. Inkray is designed to feel like any modern publishing tool. You write in a familiar editor, hit publish, and your content goes live. The ownership and storage technology works in the background — you don't need to think about it.",
  },
  {
    question: "What kinds of content can I publish on Inkray?",
    answer:
      "Inkray supports long-form articles, essays, newsletters, and more. The editor handles rich text, images, and embeds. Whether you're writing a weekly newsletter or in-depth analysis, the publishing experience is clean and flexible.",
  },
  {
    question: "Can I export my data if I want to leave Inkray?",
    answer:
      "Absolutely. Since your content is stored permanently and you hold ownership, your data is always accessible. You're never locked in — portability is a core principle of the platform.",
  },
  {
    question: "Is there a way to import my Substack subscribers?",
    answer:
      "You can export your subscriber list from Substack and invite them to follow you on Inkray. While the subscription model is different (on-chain vs. email-based), the transition is straightforward and your audience can find you easily.",
  },
]

export default function SubstackAlternativePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-white pt-28 pb-16 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="max-w-3xl"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p
              className="text-xs font-bold tracking-[0.14em] uppercase mb-3"
              style={{
                background:
                  "linear-gradient(135deg, #005EFC 0%, #4d94ff 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Substack Alternative
            </p>
            <h1 className="text-4xl lg:text-5xl font-semibold text-gray-900 leading-tight mb-6">
              The Substack Alternative Where You Own Everything
            </h1>
            <p className="text-lg text-gray-500 leading-relaxed max-w-2xl">
              Creators are switching to Inkray because they want real ownership
              of their words, their audience, and their income. No revenue share
              on tips, no algorithm deciding who sees your work, and permanent
              storage that means your content can never be taken down or lost.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Comparison Table */}
      <ComparisonTable
        platforms={[...COMPARISON_PLATFORMS]}
        rows={COMPARISON_ROWS.map((row) => ({
          feature: row.feature,
          values: [...row.values],
        }))}
        highlightIndex={0}
      />

      {/* Differentiator Cards */}
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
                background:
                  "linear-gradient(135deg, #005EFC 0%, #4d94ff 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Why Creators Switch
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              What Makes Inkray Different
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-6">
            {DIFFERENTIATORS.map((item, i) => (
              <motion.div
                key={item.title}
                className="rounded-2xl border border-gray-100 bg-white p-7"
                style={{
                  boxShadow:
                    "0 1px 3px rgba(0,0,0,0.04), 0 4px 14px rgba(0,0,0,0.04)",
                }}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <div className="w-10 h-10 rounded-xl bg-[#005EFC]/[0.08] flex items-center justify-center mb-4">
                  <item.icon className="w-5 h-5 text-[#005EFC]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <FaqSection items={FAQ_ITEMS} eyebrow="Common Questions" />

      {/* CTA */}
      <PageCta
        heading="Switch to a Platform That Works for You"
        subtext="Start publishing on Inkray for free. Own your content, keep your earnings, and build an audience that no algorithm can take away."
      />

      <Footer />
    </div>
  )
}
