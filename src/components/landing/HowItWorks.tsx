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

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white px-6 py-24">
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
            From idea to ownership in three steps
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-lg">
            Getting started takes less than a minute
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12 relative">
          {/* Connecting line (desktop only) */}
          <div className="hidden md:block absolute top-16 left-[16.67%] right-[16.67%] h-px bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />

          {STEPS.map((step, i) => (
            <motion.div
              key={step.number}
              className="relative text-center"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
            >
              {/* Step number circle */}
              <div className="relative mx-auto mb-6">
                <div className="w-16 h-16 mx-auto rounded-full bg-primary/[0.08] flex items-center justify-center">
                  <step.icon className="w-7 h-7 text-primary" />
                </div>
                <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
                  {step.number}
                </span>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {step.title}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
