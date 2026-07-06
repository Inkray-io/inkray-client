import type { Metadata } from "next"
import { Navbar } from "@/components/landing/Navbar"
import { Footer } from "@/components/landing/Footer"
import {
  HiShieldCheck,
  HiCircleStack,
  HiLockClosed,
  HiCurrencyDollar,
} from "react-icons/hi2"

export const metadata: Metadata = {
  title: "About Inkray — The Publishing Platform Where You Own Your Content",
  description:
    "Inkray is a decentralized publishing platform built on Sui and Walrus. Writers own their work permanently, earn directly from readers, and never risk deplatforming.",
  alternates: { canonical: "https://inkray.xyz/about" },
  openGraph: {
    title: "About Inkray",
    description:
      "A publishing platform where your words are permanent, unblockable, and paid for directly — no platform in the middle.",
    url: "https://inkray.xyz/about",
    siteName: "Inkray",
  },
}

const PILLARS = [
  {
    icon: HiShieldCheck,
    title: "You own your work",
    description:
      "Every article is published to your own on-chain vault. No platform account holds your writing hostage — you carry the keys.",
  },
  {
    icon: HiCircleStack,
    title: "Permanent storage",
    description:
      "Content lives on Walrus, a decentralized storage network — not on a single company's server. No broken links, no disappearing posts.",
  },
  {
    icon: HiLockClosed,
    title: "Real paywalls, cryptographically enforced",
    description:
      "Gated articles are encrypted with Seal. Access is granted by ownership — a subscription, a collectible, an allowlist — not by a server checking a cookie.",
  },
  {
    icon: HiCurrencyDollar,
    title: "Direct earnings",
    description:
      "Subscriptions, tips, and collectible articles settle straight to your wallet. No 10% platform cut, no payout thresholds, no waiting.",
  },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <Navbar />
      <main className="flex-1 container max-w-3xl mx-auto px-4 py-12 sm:py-16">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-3">
          About the project
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-4">
          Publishing, the way it should have worked all along.
        </h1>
        <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-10 max-w-2xl">
          Inkray is a publishing platform built on the Sui blockchain. Writers
          publish permanently, own their audience, and get paid directly — with
          no company in the middle that can change the rules.
        </p>

        <div className="grid sm:grid-cols-2 gap-4 mb-12">
          {PILLARS.map((pillar) => (
            <div key={pillar.title} className="bg-white rounded-2xl p-5">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 mb-3">
                <pillar.icon className="size-4.5 text-primary" />
              </div>
              <h2 className="text-sm font-semibold text-gray-900 mb-1">
                {pillar.title}
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            How it works
          </h2>
          <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <p>
              Articles are stored on <strong>Walrus</strong>, a decentralized
              storage network, and registered on the <strong>Sui</strong>{" "}
              blockchain — so your writing exists independently of Inkray
              itself. Paid content is encrypted with <strong>Seal</strong>, and
              decryption rights follow on-chain ownership: an active
              subscription, a collected article, or an allowlist entry.
            </p>
            <p>
              Your account is your wallet. Readers follow <em>you</em>, tips and
              subscription revenue settle to <em>your</em> address, and if you
              ever want to leave, everything you published leaves with you.
            </p>
            <p>
              Inkray is currently in an invite-only beta. Every member receives
              invite codes to bring in the writers and readers they rate.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
