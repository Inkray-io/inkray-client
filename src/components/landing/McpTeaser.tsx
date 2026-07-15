"use client"

import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { AgentTranscript } from "./AgentTranscript"
import { ROUTES } from "@/constants/routes"
import { HiArrowRight } from "react-icons/hi2"

const eyebrowStyle = {
  background: "linear-gradient(135deg, #005EFC 0%, #4d94ff 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
} as const

const EASE = [0.16, 1, 0.3, 1] as const

export function McpTeaser() {
  const router = useRouter()

  return (
    <section className="bg-gradient-to-b from-white to-[#f8f9fc] px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: EASE }}
          className="grid items-center gap-10 rounded-3xl border border-gray-100 bg-white p-8 shadow-[0_20px_50px_-24px_rgba(8,15,26,0.15)] lg:grid-cols-2 lg:p-12"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em]" style={eyebrowStyle}>
              New · Model Context Protocol
            </p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-gray-900 lg:text-4xl">
              Let an AI agent publish for you.
            </h2>
            <p className="mt-4 max-w-lg leading-relaxed text-gray-500">
              Connect Claude, ChatGPT, Cursor, or your own agents over MCP. They draft and
              publish under your account — authorized by your Sui wallet, no API keys.
            </p>
            <button
              onClick={() => router.push(ROUTES.MCP_FOR_AGENTS)}
              className="group mt-7 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-b from-[#1a6fff] to-[#005EFC] px-6 py-3 text-base font-semibold text-white shadow-[0_1px_2px_rgba(0,94,252,0.4),0_6px_20px_rgba(0,94,252,0.2)] transition-all duration-200 hover:-translate-y-px hover:shadow-[0_1px_2px_rgba(0,94,252,0.4),0_8px_28px_rgba(0,94,252,0.3)]"
            >
              Explore Inkray for agents
              <HiArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </button>
          </div>

          <AgentTranscript compact />
        </motion.div>
      </div>
    </section>
  )
}
