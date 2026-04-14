"use client"

import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  HiRss,
  HiHeart,
  HiSparkles,
  HiBookmark,
  HiChatBubbleLeftRight,
  HiAdjustmentsHorizontal,
  HiNoSymbol,
  HiBanknotes,
} from "react-icons/hi2"
import { ROUTES } from "@/constants/routes"
import { Navbar } from "@/components/landing/Navbar"
import { Footer } from "@/components/landing/Footer"
import { FaqSection } from "@/components/landing/FaqSection"
import { PageCta } from "@/components/landing/PageCta"

// ─── Data ─────────────────────────────────────────────────────────────────────

const BENEFITS = [
  {
    icon: HiRss,
    title: "Algorithm-Free Discovery",
    description:
      "No engagement tricks, no outrage bait, no hidden ranking signals. You see articles from writers you follow and topics you care about — nothing more, nothing less.",
  },
  {
    icon: HiHeart,
    title: "Support Creators Directly",
    description:
      "When you tip a writer or subscribe to their publication, your support goes straight to them. No platform commissions, no payout delays — just a direct connection between you and the people you read.",
  },
  {
    icon: HiSparkles,
    title: "Collect Favorite Articles",
    description:
      "Turn the articles you love into collectibles you own. Collecting is a way to support a writer, bookmark a piece of writing that matters to you, and build a personal library of great work.",
  },
]

const FEATURES = [
  {
    icon: HiBookmark,
    title: "Bookmarks & Reading Lists",
    description:
      "Save articles to read later and organize them into personal reading lists. Your bookmarks sync across devices and are always private.",
  },
  {
    icon: HiChatBubbleLeftRight,
    title: "Thoughtful Comments",
    description:
      "Join real conversations under every article. Comments are tied to verified profiles, so discussions stay respectful and spam-free.",
  },
  {
    icon: HiAdjustmentsHorizontal,
    title: "Personalized Feed",
    description:
      "Follow the writers and publications you care about. Your feed is built from your choices, not from what an algorithm thinks you should see.",
  },
  {
    icon: HiNoSymbol,
    title: "No Ads, Ever",
    description:
      "Inkray has no advertising layer. You will never see sponsored posts, banner ads, or tracking pixels. The reading experience is clean and distraction-free.",
  },
  {
    icon: HiBanknotes,
    title: "Tip Any Writer",
    description:
      "See something great? Send a tip directly to the writer with one click. It's the simplest way to say thank you and encourage more of the work you enjoy.",
  },
]

const FAQ_ITEMS = [
  {
    question: "Is Inkray free to read?",
    answer:
      "Yes. Most articles on Inkray are free to read. Some writers offer premium content behind a paid subscription, but there is always plenty of free content to discover and enjoy.",
  },
  {
    question: "Do I need a wallet to read articles?",
    answer:
      "No. You can browse and read free articles without a wallet. You only need a wallet if you want to tip writers, subscribe to paid publications, or collect articles.",
  },
  {
    question: "How do I discover new writers?",
    answer:
      "Inkray surfaces content through a chronological feed based on writers and topics you follow. You can also browse trending articles, explore curated publications, and find new voices through the community.",
  },
  {
    question: "What does it mean to collect an article?",
    answer:
      "Collecting an article means you own a digital copy of it as a collectible. It's a way to support the writer, bookmark a piece you love, and build a personal library of great writing that's truly yours.",
  },
  {
    question: "How do tips and subscriptions work?",
    answer:
      "Tips are one-time payments you can send to any writer on any article. Subscriptions give you access to a writer's premium content for a recurring fee. Both go directly to the writer's wallet with no platform fees.",
  },
  {
    question: "Is my reading activity private?",
    answer:
      "Yes. Your bookmarks and reading history are private by default. Only your public interactions — such as comments and collected articles — are visible to others.",
  },
]

// ─── Animation variants ───────────────────────────────────────────────────────

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
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

// ─── Eyebrow helper ───────────────────────────────────────────────────────────

const eyebrowStyle = {
  background: "linear-gradient(135deg, #005EFC 0%, #4d94ff 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
} as const

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ForReadersPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="bg-white px-6 pt-28 pb-16 lg:pt-32 lg:pb-20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="max-w-3xl"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p
              className="text-xs font-bold tracking-[0.14em] uppercase mb-4"
              style={eyebrowStyle}
            >
              For Readers
            </p>
            <h1 className="text-4xl lg:text-5xl font-semibold text-gray-900 leading-[1.15] mb-6">
              Read Better Content. Support Real Writers.
            </h1>
            <p className="text-lg text-gray-500 leading-relaxed max-w-2xl mb-8">
              Inkray is an ad-free, algorithm-free reading experience where you
              discover independent writers and support them directly. No
              sponsored posts, no engagement bait — just quality writing from
              people who care about their craft, and a direct way to show your
              appreciation.
            </p>

            <div className="flex flex-wrap items-center gap-5">
              <button
                className="relative px-7 py-3 rounded-xl text-base font-semibold text-white bg-gradient-to-b from-[#1a6fff] to-[#005EFC] shadow-[0_1px_2px_rgba(0,94,252,0.4),0_6px_20px_rgba(0,94,252,0.2)] hover:shadow-[0_1px_2px_rgba(0,94,252,0.4),0_8px_28px_rgba(0,94,252,0.3)] hover:-translate-y-px active:translate-y-0 active:shadow-[0_1px_2px_rgba(0,94,252,0.4)] transition-all duration-200 cursor-pointer"
                onClick={() => router.push(ROUTES.FEED)}
              >
                Start Reading
              </button>
              <button
                className="group relative text-base font-medium text-gray-500 hover:text-gray-900 transition-colors duration-200 cursor-pointer"
                onClick={() => router.push(ROUTES.FEED)}
              >
                Browse the Feed
                <span className="absolute left-0 -bottom-0.5 w-0 h-px bg-gray-900 group-hover:w-full transition-all duration-300" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Benefit Cards ───────────────────────────────────────────────────── */}
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
              style={eyebrowStyle}
            >
              Why Inkray
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              A Reading Experience You Deserve
            </h2>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-3 gap-5"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            {BENEFITS.map((benefit) => {
              const Icon = benefit.icon
              return (
                <motion.div
                  key={benefit.title}
                  variants={cardVariants}
                  className="bg-white border border-gray-100 rounded-2xl p-6 hover:border-primary/15 transition-all duration-300"
                  whileHover={{
                    y: -3,
                    boxShadow:
                      "0 4px 12px rgba(0,0,0,0.04), 0 14px 36px rgba(0,94,252,0.08)",
                    transition: { duration: 0.22, ease: "easeOut" },
                  }}
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/8 border border-primary/15 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {benefit.description}
                  </p>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────────── */}
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
              style={eyebrowStyle}
            >
              Features
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Everything You Need for a Great Reading Experience
            </h2>
          </motion.div>

          <motion.div
            className="grid sm:grid-cols-2 gap-5"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            {FEATURES.map((feature) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={feature.title}
                  variants={cardVariants}
                  className="bg-white border border-gray-100 rounded-2xl p-6 hover:border-primary/15 transition-all duration-300"
                  whileHover={{
                    y: -3,
                    boxShadow:
                      "0 4px 12px rgba(0,0,0,0.04), 0 14px 36px rgba(0,94,252,0.08)",
                    transition: { duration: 0.22, ease: "easeOut" },
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/8 border border-primary/15 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 mb-1.5">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-gray-500 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────────── */}
      <FaqSection items={FAQ_ITEMS} eyebrow="Reader FAQ" />

      {/* ── CTA ─────────────────────────────────────────────────────────────── */}
      <PageCta
        heading="Start Discovering Great Writing"
        subtext="Browse a growing library of articles from independent writers. No sign-up required — just open the feed and start reading."
      />

      <Footer />
    </div>
  )
}
