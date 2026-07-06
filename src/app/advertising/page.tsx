import type { Metadata } from "next"
import { Navbar } from "@/components/landing/Navbar"
import { Footer } from "@/components/landing/Footer"
import { FaXTwitter } from "react-icons/fa6"

export const metadata: Metadata = {
  title: "Advertising & Partnerships | Inkray",
  description:
    "Partner with Inkray to reach engaged web3 readers and writers. Sponsorships, publication partnerships, and ecosystem collaborations.",
  alternates: { canonical: "https://inkray.xyz/advertising" },
}

export default function AdvertisingPage() {
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <Navbar />
      <main className="flex-1 container max-w-3xl mx-auto px-4 py-12 sm:py-16">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-3">
          Advertising &amp; partnerships
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-4">
          Reach readers who chose to be here.
        </h1>
        <p className="text-base text-gray-600 leading-relaxed mb-10 max-w-2xl">
          Inkray&apos;s audience is writers and readers who care about
          ownership, crypto, and independent publishing — a focused community,
          not passive scroll traffic.
        </p>

        <div className="grid sm:grid-cols-2 gap-4 mb-10">
          <div className="bg-white rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-1">
              Sponsorships
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Sponsor quests, writing challenges, or community events. Your
              brand becomes part of what the community does, not an interruption
              to it.
            </p>
          </div>
          <div className="bg-white rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-1">
              Ecosystem partnerships
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Building in the Sui ecosystem? Partner on integrations, co-written
              publications, or educational series with established Inkray
              writers.
            </p>
          </div>
        </div>

        <div className="bg-gray-950 rounded-2xl p-6 sm:p-8 text-white ring-1 ring-white/10">
          <h2 className="text-lg font-semibold mb-2">Let&apos;s talk</h2>
          <p className="text-sm text-white/60 leading-relaxed mb-4 max-w-md">
            Partnerships are handled personally while we&apos;re in beta. Reach
            out on X and we&apos;ll get back to you quickly.
          </p>
          <a
            href="https://x.com/inkray_io"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-white/90 transition-colors"
          >
            <FaXTwitter className="size-4" />
            @inkray_io
          </a>
        </div>
      </main>
      <Footer />
    </div>
  )
}
