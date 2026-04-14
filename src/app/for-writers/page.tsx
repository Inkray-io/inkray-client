"use client"

import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  HiShieldCheck,
  HiCurrencyDollar,
  HiCircleStack,
  HiWallet,
  HiPencilSquare,
  HiRocketLaunch,
} from "react-icons/hi2"
import { useWalletConnection } from "@/hooks/useWalletConnection"
import { ROUTES } from "@/constants/routes"
import { Navbar } from "@/components/landing/Navbar"
import { Footer } from "@/components/landing/Footer"
import { FaqSection } from "@/components/landing/FaqSection"
import { PageCta } from "@/components/landing/PageCta"

// ─── Data ─────────────────────────────────────────────────────────────────────

const BENEFITS = [
  {
    icon: HiShieldCheck,
    title: "True Ownership",
    description:
      "Every article you publish is stored in your personal vault. You hold the keys — not a platform. Your writing can never be removed, modified, or held hostage by a terms-of-service change.",
  },
  {
    icon: HiCurrencyDollar,
    title: "Multiple Revenue Streams",
    description:
      "Monetize your work the way you want. Set up paid subscriptions, accept tips from readers, and let fans collect your best pieces as digital collectibles — all with direct payouts.",
  },
  {
    icon: HiCircleStack,
    title: "Permanent Storage",
    description:
      "Your articles are distributed across a global storage network, not sitting on a single server. No broken links, no disappearing posts — your work stays online and accessible for good.",
  },
]

const STEPS = [
  {
    number: "01",
    icon: HiWallet,
    title: "Connect",
    description:
      "Link your wallet to set up your publication in seconds. No sign-up forms, no passwords — just one click and you're ready to start writing.",
  },
  {
    number: "02",
    icon: HiPencilSquare,
    title: "Write & Publish",
    description:
      "Use the built-in editor to compose your articles. Add AI-generated summaries, set access rules, and hit publish. Your content goes live instantly.",
  },
  {
    number: "03",
    icon: HiRocketLaunch,
    title: "Own & Earn",
    description:
      "Every published article is permanently yours. Grow your audience, enable monetization, and earn directly — no revenue splits, no payout delays.",
  },
]

const FAQ_ITEMS = [
  {
    question: "Do I truly own the articles I publish on Inkray?",
    answer:
      "Yes. Every article is stored in your personal vault and linked to your wallet. Only you can modify or remove your content. Inkray has no ability to take down, edit, or restrict access to anything you publish.",
  },
  {
    question: "How can I monetize my writing?",
    answer:
      "Inkray offers multiple revenue streams: paid subscriptions for premium content, reader tips on any article, and collectible articles that fans can purchase. All earnings go directly to your wallet with no platform commission.",
  },
  {
    question: "Do I need a crypto wallet to publish?",
    answer:
      "Yes, you need a Sui-compatible wallet to connect and publish. If you don't have one, you can set one up in under a minute — Inkray walks you through it during onboarding.",
  },
  {
    question: "What content formats does Inkray support?",
    answer:
      "Inkray's editor supports rich text and markdown with formatting options including headings, bold, italic, lists, blockquotes, code blocks, images, and embeds. You can also add AI-generated summaries to help readers preview your work.",
  },
  {
    question: "Can I set pricing for my articles?",
    answer:
      "Absolutely. You can make any article free or gated behind a paid subscription. You choose the price, and readers pay directly — no middlemen involved.",
  },
  {
    question: "Can I migrate my existing blog to Inkray?",
    answer:
      "Inkray is focused on new publishing right now, but content import tools are on the roadmap. In the meantime, you can copy-paste existing articles into the editor and publish them in minutes.",
  },
  {
    question: "What happens if Inkray goes offline?",
    answer:
      "Your articles are stored on a decentralized storage network, not on Inkray's servers. Even if the platform were to shut down, your content remains accessible and owned by you. That's the entire point of true ownership.",
  },
]

// ─── Animation variants ───────────────────────────────────────────────────────

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.05 },
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

const stepCardVariants = {
  hidden: { opacity: 0, y: 24, x: -12 },
  visible: {
    opacity: 1,
    y: 0,
    x: 0,
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

export default function ForWritersPage() {
  const router = useRouter()
  const { isConnected } = useWalletConnection()

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
              For Writers
            </p>
            <h1 className="text-4xl lg:text-5xl font-semibold text-gray-900 leading-[1.15] mb-6">
              A Publishing Platform Where Writers Come First
            </h1>
            <p className="text-lg text-gray-500 leading-relaxed max-w-2xl mb-8">
              Inkray gives writers full ownership of every article they publish,
              built-in monetization through subscriptions and tips, and permanent
              storage that no platform can take away. No algorithms deciding who
              sees your work — just you and your readers.
            </p>

            <div className="flex flex-wrap items-center gap-5">
              <button
                className="relative px-7 py-3 rounded-xl text-base font-semibold text-white bg-gradient-to-b from-[#1a6fff] to-[#005EFC] shadow-[0_1px_2px_rgba(0,94,252,0.4),0_6px_20px_rgba(0,94,252,0.2)] hover:shadow-[0_1px_2px_rgba(0,94,252,0.4),0_8px_28px_rgba(0,94,252,0.3)] hover:-translate-y-px active:translate-y-0 active:shadow-[0_1px_2px_rgba(0,94,252,0.4)] transition-all duration-200 cursor-pointer"
                onClick={() =>
                  router.push(isConnected ? ROUTES.CREATE : ROUTES.FEED)
                }
              >
                {isConnected ? "Start Writing" : "Try Inkray"}
              </button>
              <button
                className="group relative text-base font-medium text-gray-500 hover:text-gray-900 transition-colors duration-200 cursor-pointer"
                onClick={() => router.push(ROUTES.FEED)}
              >
                Explore Articles
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
              Built for Writers Who Value Independence
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

      {/* ── How It Works ────────────────────────────────────────────────────── */}
      <section className="bg-white px-6 py-20 overflow-hidden">
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
              How It Works
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Start Publishing in Three Steps
            </h2>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-3 gap-5 md:gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            {STEPS.map((step, i) => {
              const Icon = step.icon
              return (
                <motion.div
                  key={step.number}
                  variants={stepCardVariants}
                  className="relative"
                >
                  <div className="relative rounded-2xl bg-[#f8f9fc] p-5 md:p-6 border border-gray-100 hover:border-primary/15 hover:shadow-[0_2px_16px_rgba(0,94,252,0.06)] transition-all duration-300 overflow-hidden h-full">
                    {/* Top gradient accent bar */}
                    <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-[#005EFC]/0 via-[#005EFC]/25 to-[#005EFC]/0" />

                    {/* Ghost number watermark */}
                    <span
                      className="absolute -top-3 -right-2 text-[88px] font-black leading-none select-none pointer-events-none"
                      style={{
                        color: "transparent",
                        WebkitTextStroke: "1.5px rgba(0, 94, 252, 0.04)",
                      }}
                    >
                      {step.number}
                    </span>

                    <div className="relative z-10">
                      <p
                        className="text-[10px] font-bold tracking-[0.14em] uppercase mb-4"
                        style={eyebrowStyle}
                      >
                        Step {step.number}
                      </p>
                      <Icon className="w-5 h-5 text-primary mb-3 opacity-70" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {step.title}
                      </h3>
                      <p className="text-gray-500 text-sm leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>

                  {/* Arrow connector between cards (desktop) */}
                  {i < STEPS.length - 1 && (
                    <div className="hidden md:flex absolute top-1/2 -right-4 -translate-y-1/2 z-20 items-center justify-center">
                      <svg
                        width="8"
                        height="14"
                        viewBox="0 0 8 14"
                        fill="none"
                      >
                        <path
                          d="M1 1l6 6-6 6"
                          stroke="#005EFC"
                          strokeOpacity="0.2"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  )}

                  {/* Mobile separator */}
                  {i < STEPS.length - 1 && (
                    <div className="md:hidden flex items-center justify-center py-3">
                      <svg
                        width="14"
                        height="8"
                        viewBox="0 0 14 8"
                        fill="none"
                      >
                        <path
                          d="M1 1l6 6 6-6"
                          stroke="#005EFC"
                          strokeOpacity="0.15"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────────── */}
      <FaqSection items={FAQ_ITEMS} eyebrow="Writer FAQ" />

      {/* ── CTA ─────────────────────────────────────────────────────────────── */}
      <PageCta
        heading="Ready to Own Your Writing?"
        subtext="Join a growing community of independent writers who publish on their own terms. Every article you write is permanently yours — no gatekeepers, no takedowns, no algorithms."
      />

      <Footer />
    </div>
  )
}
