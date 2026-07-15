"use client"

import { motion, useReducedMotion } from "framer-motion"

/**
 * The signature element: a scripted agent tool-call session, in the machine's
 * own voice (monospace). It reveals sequentially on load and tells the whole
 * story — a human prompt, an MCP tool call, a wallet-authorized approval (the
 * one amber beat), the result, and the point: it's on Sui and owned by you.
 * Reduced motion → the session is shown fully rendered.
 */

type Row =
  | { role: "you"; text: string }
  | { role: "call"; tool: string; args: string }
  | { role: "approve"; text: string }
  | { role: "result"; text: string }
  | { role: "done"; text: string }

const SESSION: Row[] = [
  { role: "you", text: 'Publish my draft “Designing for Sui” to my blog.' },
  { role: "call", tool: "publish_article", args: '{ publicationId: "0x9b…c18", draftId: "dft_7f2" }' },
  { role: "approve", text: "Approved — signed with your Sui wallet" },
  { role: "result", text: '{ articleId: "0xa8be…5fa", url: "inkray.xyz/article/designing-for-sui" }' },
  { role: "done", text: "Live on Sui — and owned by you." },
]

const EASE = [0.16, 1, 0.3, 1] as const

export function AgentTranscript({ compact = false }: { compact?: boolean }) {
  const reduce = useReducedMotion()

  const container = {
    hidden: {},
    show: {
      transition: { staggerChildren: reduce ? 0 : 0.5, delayChildren: reduce ? 0 : 0.2 },
    },
  }
  const row = {
    hidden: reduce ? { opacity: 1 } : { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
  }

  return (
    <div
      className="overflow-hidden rounded-2xl border border-white/10 bg-[#080F1A] shadow-[0_24px_60px_-20px_rgba(8,15,26,0.6)]"
      role="img"
      aria-label="An AI agent publishing an article to Inkray, approved by the user's Sui wallet"
    >
      {/* Title bar */}
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="ml-2 font-mono text-[11px] tracking-wide text-white/40">
          mcp · inkray
        </span>
        <span className="ml-auto flex items-center gap-1.5 font-mono text-[11px] text-white/40">
          <span className="h-1.5 w-1.5 rounded-full bg-[#3ECf8E]" /> connected
        </span>
      </div>

      {/* Session */}
      <motion.div
        className={`font-mono ${compact ? "space-y-2.5 p-4 text-[12px]" : "space-y-3.5 p-5 text-[13px]"} leading-relaxed`}
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
      >
        {SESSION.map((r, i) => (
          <motion.div key={i} variants={row} className="flex gap-3">
            <span className="w-14 shrink-0 select-none text-right text-white/30">
              {r.role === "call" || r.role === "done" ? "agent" : r.role === "result" ? "inkray" : r.role === "approve" ? "wallet" : "you"}
            </span>
            <div className="min-w-0 flex-1">
              {r.role === "you" && <span className="text-white/85">{r.text}</span>}

              {r.role === "call" && (
                <span className="text-white/70">
                  <span className="text-[#4d94ff]">→ {r.tool}</span>
                  <span className="text-white/40"> {r.args}</span>
                </span>
              )}

              {r.role === "approve" && (
                <span className="inline-flex items-center gap-1.5 rounded-md bg-[#F6A623]/12 px-2 py-0.5 text-[#F6A623] ring-1 ring-inset ring-[#F6A623]/25">
                  <span aria-hidden>🔑</span> {r.text}
                </span>
              )}

              {r.role === "result" && (
                <span className="break-words text-white/50">
                  <span className="text-white/70">← </span>
                  {r.text}
                </span>
              )}

              {r.role === "done" && <span className="text-white/85">▸ {r.text}</span>}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
