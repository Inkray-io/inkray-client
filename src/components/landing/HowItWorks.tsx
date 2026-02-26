"use client"

import { motion } from "framer-motion"
import { HiWallet, HiPencilSquare, HiRocketLaunch } from "react-icons/hi2"

const STEPS = [
  {
    number: "01",
    icon: HiWallet,
    title: "Connect",
    description:
      "Link your Sui wallet and create your publication in seconds. No sign-ups, no passwords — your wallet is your identity.",
  },
  {
    number: "02",
    icon: HiPencilSquare,
    title: "Publish",
    description:
      "Write your article in our editor. Hit publish and it's stored on-chain and on Walrus — permanently and verifiably.",
  },
  {
    number: "03",
    icon: HiRocketLaunch,
    title: "Own & Earn",
    description:
      "Your content is yours. Monetize with subscriptions, tips, and NFTs. Grow your audience directly — no algorithms in the way.",
  },
]

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 24, x: -12 },
  visible: {
    opacity: 1,
    y: 0,
    x: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
}

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white px-6 py-20 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        {/* Header — left-aligned with gradient eyebrow */}
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
            How It Works
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            From idea to ownership in three steps
          </h2>
        </motion.div>

        {/* Step cards */}
        <motion.div
          className="grid md:grid-cols-3 gap-5 md:gap-6"
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
              {/* Card */}
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

                {/* Content */}
                <div className="relative z-10">
                  {/* Step label */}
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

                  {/* Icon — bare, no background pill */}
                  <step.icon className="w-5 h-5 text-primary mb-3 opacity-70" />

                  {/* Title */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {step.title}
                  </h3>

                  {/* Description */}
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
  )
}
