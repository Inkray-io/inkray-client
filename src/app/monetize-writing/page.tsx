"use client"

import { motion } from "framer-motion"
import {
  HiCurrencyDollar,
  HiHeart,
  HiSparkles,
  HiLockClosed,
  HiPencilSquare,
  HiDocumentText,
  HiCog6Tooth,
  HiUserGroup,
} from "react-icons/hi2"
import { Navbar } from "@/components/landing/Navbar"
import { Footer } from "@/components/landing/Footer"
import { FaqSection } from "@/components/landing/FaqSection"
import { PageCta } from "@/components/landing/PageCta"

const METHODS = [
  {
    icon: HiCurrencyDollar,
    title: "Paid Subscriptions",
    description:
      "Offer monthly or annual subscriptions to your publication. Subscribers get access to your premium articles, and you receive recurring revenue directly to your wallet — no middleman fees, no delayed payouts.",
    howItWorks:
      "Set a subscription price on your publication. Readers pay once to unlock all premium content for the subscription period. Payments settle instantly on-chain.",
  },
  {
    icon: HiHeart,
    title: "Reader Tips",
    description:
      "Let readers support your work with one-time tips on any article. Tips are a low-friction way for your audience to show appreciation, and every tip goes directly to you with no platform cut.",
    howItWorks:
      "Tips are enabled by default on every article. Readers choose any amount and send it with a single click. You receive the full amount in your wallet immediately.",
  },
  {
    icon: HiSparkles,
    title: "Collectible Editions",
    description:
      "Turn your best articles into limited-edition digital collectibles. Readers can collect a piece they love, and you earn from each mint. Collectibles also serve as proof of early support from your most engaged readers.",
    howItWorks:
      "Mark any article as collectible and set a mint price and supply limit. Readers mint their copy, and you earn from every edition sold.",
  },
  {
    icon: HiLockClosed,
    title: "Gated Content",
    description:
      "Publish premium articles that only paying subscribers or collectible holders can read. Gated content lets you reward your most dedicated audience while giving free readers a reason to subscribe.",
    howItWorks:
      "When writing an article, toggle it as premium. The article is encrypted and only accessible to readers who meet your access conditions.",
  },
]

const STEPS = [
  {
    number: "01",
    icon: HiPencilSquare,
    title: "Create Your Publication",
    description:
      "Connect your wallet and set up your publication in under a minute. Add a name, description, and avatar — your publication is your home base for everything you write.",
  },
  {
    number: "02",
    icon: HiDocumentText,
    title: "Write Your First Article",
    description:
      "Use the built-in editor to compose your article. Add images, format text, and preview before publishing. Every article is stored permanently and owned by you.",
  },
  {
    number: "03",
    icon: HiCog6Tooth,
    title: "Set Up Monetization",
    description:
      "Choose your earning methods: set a subscription price, enable tips, or mark articles as collectible. You can combine multiple methods to maximize your revenue.",
  },
  {
    number: "04",
    icon: HiUserGroup,
    title: "Grow Your Audience",
    description:
      "Share your articles, engage with readers, and build a loyal subscriber base. As your audience grows, your recurring revenue grows with it — and you keep full control.",
  },
]

const FAQ_ITEMS = [
  {
    question: "How much can I earn from writing on Inkray?",
    answer:
      "Your earnings depend on your audience size, content quality, and pricing strategy. There is no earnings cap. Subscription revenue, tips, and collectible sales all go directly to your wallet with no platform fees, so you keep more of what you earn compared to traditional platforms.",
  },
  {
    question: "Does Inkray take a cut of my earnings?",
    answer:
      "No. Inkray does not take a percentage of your subscriptions, tips, or collectible sales. Payments are processed on-chain and go directly from the reader to your wallet. The only costs are minimal blockchain transaction fees.",
  },
  {
    question: "What payment methods do readers use?",
    answer:
      "Readers pay using SUI tokens through their Sui-compatible wallet. The payment process is streamlined — readers connect their wallet and complete the transaction with a single confirmation.",
  },
  {
    question: "Can I offer both free and paid content?",
    answer:
      "Yes. You can publish free articles alongside premium ones. Many writers use free content to attract new readers and gated content to reward paying subscribers. You control the mix on a per-article basis.",
  },
  {
    question: "How do collectible editions work?",
    answer:
      "When you publish an article, you can make it collectible by setting a mint price and supply limit. Readers mint their own copy as a digital collectible. You earn from each mint, and collectors get a verifiable piece linked to your original article.",
  },
  {
    question: "Do I need writing experience to start earning?",
    answer:
      "No prior professional writing experience is required. Inkray is used by journalists, hobbyist bloggers, researchers, and newsletter writers alike. What matters is having something valuable to say and an audience that wants to read it.",
  },
  {
    question: "How quickly do I get paid?",
    answer:
      "Payments settle instantly. When a reader subscribes, tips, or mints a collectible, the funds appear in your wallet within seconds. There are no payout thresholds, no waiting periods, and no invoicing required.",
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

export default function MonetizeWritingPage() {
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
              Four Ways to Earn From Your Writing
            </h1>
            <p className="text-lg text-gray-500 leading-relaxed">
              You can monetize your writing online through paid subscriptions,
              reader tips, collectible editions, and gated content. Inkray gives
              you all four methods out of the box, with instant payouts and no
              platform fees — so you keep every dollar your writing earns.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Monetization Methods */}
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
              Monetization Methods
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Four Revenue Streams for Writers
            </h2>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 gap-5 md:gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            {METHODS.map((method) => (
              <motion.div
                key={method.title}
                variants={cardVariants}
                className="bg-white rounded-2xl border border-gray-100 p-6 hover:border-primary/15 hover:shadow-[0_2px_16px_rgba(0,94,252,0.06)] hover:-translate-y-0.5 transition-all duration-300"
              >
                <method.icon className="w-6 h-6 text-primary mb-4 opacity-70" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {method.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">
                  {method.description}
                </p>
                <div className="bg-[#f8f9fc] rounded-xl px-4 py-3 border border-gray-50">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.08em] mb-1">
                    How it works
                  </p>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {method.howItWorks}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Steps */}
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
              style={{
                background: "linear-gradient(135deg, #005EFC 0%, #4d94ff 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Getting Started
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Start Earning in 4 Steps
            </h2>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-4 gap-5 md:gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            {STEPS.map((step, i) => (
              <motion.div
                key={step.number}
                variants={cardVariants}
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
                      style={{
                        background:
                          "linear-gradient(135deg, #005EFC, #4d94ff)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      Step {step.number}
                    </p>

                    <step.icon className="w-5 h-5 text-primary mb-3 opacity-70" />

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
            ))}
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <FaqSection items={FAQ_ITEMS} eyebrow="Monetization FAQ" />

      {/* CTA */}
      <PageCta
        heading="Start Earning From Your Writing Today"
        subtext="Set up your publication, choose your monetization methods, and start earning from your very first article. No platform fees, instant payouts, full control."
      />

      <Footer />
    </>
  )
}
