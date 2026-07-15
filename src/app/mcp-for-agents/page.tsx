"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Navbar } from "@/components/landing/Navbar"
import { Footer } from "@/components/landing/Footer"
import { FaqSection } from "@/components/landing/FaqSection"
import { AgentTranscript } from "@/components/landing/AgentTranscript"
import { ROUTES } from "@/constants/routes"
import {
  HiBookOpen,
  HiPencilSquare,
  HiKey,
  HiAdjustmentsHorizontal,
  HiCircleStack,
  HiArrowUturnLeft,
  HiClipboard,
  HiCheck,
  HiArrowRight,
} from "react-icons/hi2"

const eyebrowStyle = {
  background: "linear-gradient(135deg, #005EFC 0%, #4d94ff 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
} as const

const EASE = [0.16, 1, 0.3, 1] as const
const MCP_URL =
  (process.env.NEXT_PUBLIC_API_URL || "https://api.inkray.xyz").replace(/\/$/, "") + "/mcp"

const CAPABILITIES = [
  {
    icon: HiBookOpen,
    title: "Your agent reads Inkray",
    body: "Feeds, articles, your publications, your profile and XP — so it can research, summarize, and draft with real context from the platform.",
    scope: "inkray:read",
  },
  {
    icon: HiPencilSquare,
    title: "Your agent publishes for you",
    body: "Turn a draft into a published, on-chain article under a publication you own — the same pipeline and moderation as publishing by hand.",
    scope: "inkray:publish",
  },
]

const STEPS = [
  {
    n: 1,
    title: "Add the server URL",
    body: "Paste it into your MCP client. It self-registers over OAuth — there's nothing to configure.",
    mono: "add remote server →",
  },
  {
    n: 2,
    title: "Approve with your wallet",
    body: "A browser page opens. Connect your Sui wallet, review the permissions, and sign once. No gas.",
    mono: "sign · no gas",
  },
  {
    n: 3,
    title: "Your agent gets to work",
    body: "It can now read and publish on your behalf — only within the scopes you approved.",
    mono: "tools ready",
  },
]

const TRUST = [
  {
    icon: HiKey,
    title: "No API keys to leak",
    body: "Access is tied to your wallet signature. There's no secret to copy, store, or rotate.",
  },
  {
    icon: HiAdjustmentsHorizontal,
    title: "Scoped permissions",
    body: "Grant read-only, or allow publishing — each app only gets exactly what you approve.",
  },
  {
    icon: HiCircleStack,
    title: "Owned by you, on Sui",
    body: "Everything an agent publishes is an on-chain article under your account. It's yours to keep.",
  },
  {
    icon: HiArrowUturnLeft,
    title: "Revoke anytime",
    body: "Disconnect any connected app in one click from your in-app MCP settings.",
  },
]

const CLIENTS = ["Claude", "ChatGPT", "Cursor", "Windsurf", "Your own agent"]

const FAQ = [
  {
    question: "Is this safe? Can an agent post spam?",
    answer:
      "Agents publish through the same moderation and anti-abuse limits as everyone else. Publishing is rate-limited per account and only allowed on publications you own.",
  },
  {
    question: "Which assistants work?",
    answer:
      "Any MCP-compatible client — Claude, ChatGPT, Cursor, Windsurf, and custom agents. Most connect with just the server URL thanks to automatic client registration.",
  },
  {
    question: "Does it cost gas?",
    answer:
      "No. Approving access is a free wallet signature, and Inkray covers the on-chain cost of publishing.",
  },
  {
    question: "What exactly can an agent access?",
    answer:
      "Only the scopes you approve when connecting: reading public content, viewing your account, managing drafts, and — if you allow it — publishing.",
  },
  {
    question: "Can I disconnect an app later?",
    answer:
      "Yes, at any time. Revoke any connected app from your in-app MCP settings and its access ends immediately.",
  },
]

function CopyUrl({ dark = false }: { dark?: boolean }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard?.writeText(MCP_URL)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 ${
        dark ? "border-white/15 bg-white/5" : "border-gray-200 bg-[#f8f9fc]"
      }`}
    >
      <span className={`font-mono text-sm ${dark ? "text-white/80" : "text-gray-700"}`}>
        {MCP_URL}
      </span>
      <button
        onClick={copy}
        aria-label="Copy server URL"
        className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-colors ${
          dark ? "text-white/70 hover:bg-white/10" : "text-primary hover:bg-primary/10"
        }`}
      >
        {copied ? <HiCheck className="h-4 w-4" /> : <HiClipboard className="h-4 w-4" />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  )
}

export default function McpForAgentsPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="bg-white px-6 pt-28 pb-16 lg:pt-32 lg:pb-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5">
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
              <span className="text-xs font-semibold tracking-wide text-primary">
                New · Model Context Protocol
              </span>
            </span>
            <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight text-gray-900 lg:text-6xl">
              Give your AI agent
              <br />a byline.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-gray-500">
              Connect Claude, ChatGPT, Cursor, or your own agents to Inkray. They read the
              platform and publish under your account — authorized by your Sui wallet, not an
              API key.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                onClick={() => router.push(ROUTES.MCP)}
                className="relative cursor-pointer rounded-xl bg-gradient-to-b from-[#1a6fff] to-[#005EFC] px-7 py-3 text-base font-semibold text-white shadow-[0_1px_2px_rgba(0,94,252,0.4),0_6px_20px_rgba(0,94,252,0.2)] transition-all duration-200 hover:-translate-y-px hover:shadow-[0_1px_2px_rgba(0,94,252,0.4),0_8px_28px_rgba(0,94,252,0.3)] active:translate-y-0"
              >
                Connect an agent
              </button>
              <a
                href="#how"
                className="group relative text-base font-medium text-gray-500 transition-colors duration-200 hover:text-gray-900"
              >
                See how it works
                <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-gray-900 transition-all duration-300 group-hover:w-full" />
              </a>
            </div>
            <div className="mt-6">
              <CopyUrl />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: EASE }}
          >
            <AgentTranscript />
          </motion.div>
        </div>
      </section>

      {/* ── What it does ─────────────────────────────────────────────── */}
      <section className="bg-[#f8f9fc] px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <Eyebrow>Two things, on your behalf</Eyebrow>
          <h2 className="mt-3 max-w-2xl text-3xl font-semibold text-gray-900 lg:text-4xl">
            An agent that can read the room — and publish to it.
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {CAPABILITIES.map((c, i) => (
              <Reveal key={c.title} i={i}>
                <div className="h-full rounded-2xl border border-gray-100 bg-white p-7 transition-all duration-300 hover:border-primary/15">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/15 bg-primary/8">
                    <c.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-gray-900">{c.title}</h3>
                  <p className="mt-2 leading-relaxed text-gray-500">{c.body}</p>
                  <span className="mt-4 inline-block rounded-md bg-gray-100 px-2 py-1 font-mono text-xs text-gray-500">
                    {c.scope}
                  </span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works (a real 3-step sequence) ────────────────────── */}
      <section id="how" className="scroll-mt-24 bg-white px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="mt-3 max-w-2xl text-3xl font-semibold text-gray-900 lg:text-4xl">
            From URL to published in three moves.
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} i={i}>
                <div className="relative h-full rounded-2xl border border-gray-100 bg-white p-7">
                  <span className="font-mono text-sm font-semibold text-primary/70">
                    0{s.n}
                  </span>
                  <h3 className="mt-3 text-lg font-semibold text-gray-900">{s.title}</h3>
                  <p className="mt-2 leading-relaxed text-gray-500">{s.body}</p>
                  <div className="mt-5 border-t border-gray-100 pt-3">
                    <span className="font-mono text-xs text-gray-400">{s.mono}</span>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Supported clients ────────────────────────────────────────── */}
      <section className="bg-[#f8f9fc] px-6 py-16">
        <div className="mx-auto max-w-6xl text-center">
          <Eyebrow center>Works with any MCP client</Eyebrow>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {CLIENTS.map((c) => (
              <span
                key={c}
                className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700"
              >
                {c}
              </span>
            ))}
          </div>
          <p className="mt-5 text-sm text-gray-400">
            If it speaks MCP, it connects. Most clients need only the server URL.
          </p>
        </div>
      </section>

      {/* ── Trust: wallet, not keys ──────────────────────────────────── */}
      <section className="bg-white px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <Eyebrow>Built on trust, not keys</Eyebrow>
          <h2 className="mt-3 max-w-2xl text-3xl font-semibold text-gray-900 lg:text-4xl">
            Your wallet is the key.
          </h2>
          <p className="mt-3 max-w-2xl leading-relaxed text-gray-500">
            No secrets to hand an agent, and nothing it can do that you didn&apos;t approve.
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST.map((t, i) => (
              <Reveal key={t.title} i={i}>
                <div className="h-full rounded-2xl border border-gray-100 bg-white p-6 transition-all duration-300 hover:border-primary/15">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/15 bg-primary/8">
                    <t.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="mt-4 font-semibold text-gray-900">{t.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{t.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <FaqSection items={FAQ} eyebrow="Agent FAQ" />

      {/* ── Closer ───────────────────────────────────────────────────── */}
      <section className="bg-[#080F1A] px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-semibold text-white lg:text-4xl">
            Give your agent a byline.
          </h2>
          <p className="mx-auto mt-4 max-w-xl leading-relaxed text-[#7A8BA6]">
            Connect your assistant in about a minute — no keys, no config. Sign once with your
            wallet and it&apos;s ready.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4">
            <button
              onClick={() => router.push(ROUTES.MCP)}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-b from-[#1a6fff] to-[#005EFC] px-7 py-3 text-base font-semibold text-white shadow-[0_1px_2px_rgba(0,94,252,0.4),0_6px_20px_rgba(0,94,252,0.25)] transition-all duration-200 hover:-translate-y-px"
            >
              Connect an agent <HiArrowRight className="h-4 w-4" />
            </button>
            <CopyUrl dark />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

function Eyebrow({ children, center }: { children: React.ReactNode; center?: boolean }) {
  return (
    <p
      className={`text-xs font-bold uppercase tracking-[0.14em] ${center ? "text-center" : ""}`}
      style={eyebrowStyle}
    >
      {children}
    </p>
  )
}

function Reveal({ children, i = 0 }: { children: React.ReactNode; i?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, ease: EASE, delay: i * 0.08 }}
    >
      {children}
    </motion.div>
  )
}
