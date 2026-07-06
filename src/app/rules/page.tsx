import type { Metadata } from "next"
import { Navbar } from "@/components/landing/Navbar"
import { Footer } from "@/components/landing/Footer"

export const metadata: Metadata = {
  title: "Community Rules | Inkray",
  description:
    "The ground rules for publishing and participating on Inkray: original work, honest engagement, and no abuse.",
  alternates: { canonical: "https://inkray.xyz/rules" },
}

const RULES = [
  {
    title: "Publish your own work",
    body: "Plagiarism and wholesale reposting of others' content aren't allowed. Quoting and referencing with attribution is fine — passing off someone else's writing as yours is not.",
  },
  {
    title: "No illegal content",
    body: "Content that is illegal, or that facilitates illegal activity, is removed from feeds and search. Note that on-chain data itself is permanent — think before you publish.",
  },
  {
    title: "No scams or impersonation",
    body: "Don't impersonate other people or projects, and don't use Inkray to run phishing, fake giveaways, or financial scams. Verified badges exist to protect readers — don't try to fake them.",
  },
  {
    title: "Engage honestly",
    body: "Likes, follows, and tips are signals other readers rely on. Bot rings, engagement farming, and XP-gaming schemes will get accounts excluded from the leaderboard and quest rewards.",
  },
  {
    title: "No harassment",
    body: "Criticize ideas as hard as you like — targeted harassment of people, doxxing, and hate speech are not welcome here.",
  },
  {
    title: "Label AI-generated work",
    body: "AI-assisted writing is fine. Publishing fully AI-generated articles as if they were handcrafted isn't — Inkray runs AI-content detection and labels suspected AI content in feeds.",
  },
]

export default function RulesPage() {
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <Navbar />
      <main className="flex-1 container max-w-3xl mx-auto px-4 py-12 sm:py-16">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-3">
          Community rules
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-4">
          Keep it yours. Keep it honest.
        </h1>
        <p className="text-base text-gray-600 leading-relaxed mb-10 max-w-2xl">
          Inkray can&apos;t delete what you own — that&apos;s the point. But we
          can and do curate what appears in feeds, search, and rankings. These
          rules are the bar for being visible on the platform.
        </p>

        <div className="space-y-3">
          {RULES.map((rule, i) => (
            <div key={rule.title} className="bg-white rounded-2xl p-5 flex gap-4">
              <span className="text-sm font-mono font-semibold text-primary/60 mt-0.5 shrink-0">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h2 className="text-sm font-semibold text-gray-900 mb-1">
                  {rule.title}
                </h2>
                <p className="text-sm text-gray-500 leading-relaxed">{rule.body}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-400 mt-8">
          Violations affect feed placement, search visibility, verification, and
          gamification rewards. Repeat or severe violations can result in
          exclusion from Inkray&apos;s indexes entirely.
        </p>
      </main>
      <Footer />
    </div>
  )
}
