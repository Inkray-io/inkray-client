"use client"

import { motion } from "framer-motion"
import { HiLockClosed } from "react-icons/hi2"

const TECH_CARDS = [
  {
    logo: "/sui_icon.svg",
    name: "Sui Blockchain",
    description:
      "High-performance Layer 1 blockchain. Your publications and ownership records are secured by Sui's object-centric architecture and parallel transaction execution.",
  },
  {
    logo: "/hero_section/walrus.svg",
    name: "Walrus Storage",
    description:
      "Decentralized data storage for the long haul. Your articles are distributed across a global network — no single point of failure, no disappearing content.",
  },
  {
    logo: null,
    icon: HiLockClosed,
    name: "Seal Encryption",
    description:
      "End-to-end encryption for premium content. Only authorized subscribers can decrypt and read your gated articles. Privacy without compromise.",
  },
]

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
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

export function Technology() {
  return (
    <section id="technology" className="bg-[#0E1726] px-6 py-24">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Powered by the best of Web3
          </h2>
          <p className="text-[#7A8BA6] max-w-2xl mx-auto text-lg">
            Inkray is built on proven, cutting-edge blockchain infrastructure
          </p>
        </motion.div>

        {/* Cards */}
        <motion.div
          className="grid md:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          {TECH_CARDS.map((card) => (
            <motion.div
              key={card.name}
              className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.08] rounded-2xl p-7 hover:bg-white/[0.07] transition-colors duration-300"
              variants={cardVariants}
            >
              {/* Logo or icon */}
              <div className="mb-6">
                {card.logo ? (
                  <img
                    src={card.logo}
                    alt={card.name}
                    className="h-10"
                  />
                ) : card.icon ? (
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <card.icon className="w-5 h-5 text-primary" />
                  </div>
                ) : null}
              </div>

              <h3 className="text-lg font-semibold text-white mb-3">
                {card.name}
              </h3>
              <p className="text-[#7A8BA6] text-sm leading-relaxed">
                {card.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
