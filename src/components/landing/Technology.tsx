"use client"

import { motion } from "framer-motion"

const TECH_CARDS = [
  {
    logo: "/sui_icon.svg",
    logoClassName: "h-9",
    logoWidth: 36,
    logoHeight: 36,
    name: "Sui Blockchain",
    description:
      "Sui is a high-performance Layer 1 blockchain with an object-centric data model and parallel transaction execution. Every article, subscription, and collectible on Inkray is a Sui object with verifiable on-chain provenance.",
  },
  {
    logo: "/hero_section/Walrus_Monogram_White.svg",
    logoClassName: "h-8",
    logoWidth: 32,
    logoHeight: 32,
    name: "Walrus Storage",
    description:
      "Walrus is a decentralized data platform that distributes content across 100+ storage nodes in 19 countries using RedStuff erasure coding. Articles remain available and verifiable even if individual nodes go offline.",
  },
  {
    logo: "https://cdn.prod.website-files.com/687615731a76518b8c27cf39/68761ce22a49c0f7365165e8_Group%202147263312%20(1).svg",
    logoClassName: "h-9",
    logoWidth: 36,
    logoHeight: 36,
    name: "Seal Encryption",
    description:
      "Seal provides decentralized encryption through identity-based keys and access policies defined in smart contracts. Premium content on Inkray is encrypted so only paying subscribers can read it — with no central key server.",
  },
]

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
}

export function Technology() {
  return (
    <section id="technology" className="bg-[#0E1726] px-6 py-24">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
        >
          <p
            className="text-xs font-bold tracking-[0.14em] uppercase mb-3"
            style={{
              background: "linear-gradient(135deg, #4d94ff 0%, #99c2ff 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Under the Hood
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Powered by the Best Infrastructure in Web3
          </h2>
          <p className="text-[#7A8BA6] max-w-2xl mx-auto text-lg">
            We chose three proven protocols so you don&apos;t have to think about the tech — it just works.
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
              {/* Logo */}
              <div className="mb-6">
                <img
                  src={card.logo}
                  alt={card.name}
                  className={card.logoClassName}
                  width={card.logoWidth}
                  height={card.logoHeight}
                />
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
