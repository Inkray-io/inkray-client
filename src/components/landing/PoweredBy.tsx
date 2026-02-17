"use client"

import { motion } from "framer-motion"

export function PoweredBy() {
  return (
    <section className="bg-[#f8f9fc] px-6 py-12">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-sm font-medium text-gray-400 tracking-wide uppercase">
            Built on
          </span>

          <div className="flex items-center gap-10">
            {/* Sui */}
            <div className="flex items-center gap-2.5">
              <img src="/sui_icon.svg" alt="Sui" className="h-7" />
              <span className="text-base font-semibold text-gray-600">
                Sui
              </span>
            </div>

            <div className="w-px h-6 bg-gray-200" />

            {/* Walrus */}
            <div className="flex items-center gap-2.5">
              <img src="/hero_section/walrus.svg" alt="Walrus" className="h-7" />
              <span className="text-base font-semibold text-gray-600">
                Walrus
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
