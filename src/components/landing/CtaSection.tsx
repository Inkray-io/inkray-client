"use client"

import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useWalletConnection } from "@/hooks/useWalletConnection"
import { ROUTES } from "@/constants/routes"

export function CtaSection() {
  const router = useRouter()
  const { isConnected } = useWalletConnection()

  return (
    <section className="bg-[#080F1A] px-6 py-24 relative overflow-hidden">
      {/* Accent glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/8 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
            Your words deserve to last.
          </h2>
          <p className="text-[#7A8BA6] text-lg max-w-lg mx-auto">
            Join creators who publish on their own terms. No middlemen, no
            gatekeepers — just your voice and your audience.
          </p>

          <div className="flex flex-wrap justify-center items-center gap-5 pt-2">
            <button
              className="px-8 py-3 rounded-xl text-base font-semibold text-[#080F1A] bg-white shadow-[0_1px_2px_rgba(255,255,255,0.3),0_6px_20px_rgba(255,255,255,0.1)] hover:shadow-[0_1px_2px_rgba(255,255,255,0.3),0_8px_28px_rgba(255,255,255,0.18)] hover:-translate-y-px active:translate-y-0 active:shadow-[0_1px_2px_rgba(255,255,255,0.3)] transition-all duration-200 cursor-pointer"
              onClick={() => router.push(isConnected ? ROUTES.CREATE : ROUTES.FEED)}
            >
              {isConnected ? "Start Writing" : "Try Inkray"}
            </button>
            <button
              className="group relative text-base font-medium text-white/60 hover:text-white transition-colors duration-200 cursor-pointer"
              onClick={() => router.push(ROUTES.FEED)}
            >
              Explore Articles
              <span className="absolute left-0 -bottom-0.5 w-0 h-px bg-white group-hover:w-full transition-all duration-300" />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
