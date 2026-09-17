import type { Metadata } from "next"
import { Navbar } from "@/components/landing/Navbar"
import { Footer } from "@/components/landing/Footer"

export const metadata: Metadata = {
  title: "Privacy Policy | Inkray",
  description:
    "How Inkray collects, uses, and protects your information across the Inkray website and mobile app.",
  alternates: { canonical: "https://inkray.xyz/privacy" },
}

const LAST_UPDATED = "September 17, 2026"
const SUPPORT_EMAIL = "support@inkray.xyz"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <Navbar />
      <main className="flex-1 container max-w-3xl mx-auto px-4 py-12 sm:py-16">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-3">
          Privacy Policy
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-4">
          Your privacy, in plain terms
        </h1>
        <p className="text-base text-gray-600 leading-relaxed mb-2 max-w-2xl">
          This policy explains what information Inkray collects, how we use it,
          and the choices you have. It applies to the Inkray website
          (inkray.xyz) and the Inkray mobile app.
        </p>
        <p className="text-xs text-gray-400 mb-10">Last updated: {LAST_UPDATED}</p>

        <div className="space-y-10">
          <Section title="Who we are">
            <p>
              Inkray is a reading and publishing platform. Articles are published
              to a public blockchain (Sui) and stored on decentralized storage
              (Walrus). The app lets you browse and read articles, follow
              publications, and engage with likes, bookmarks, and comments.
              Inkray is not a wallet, exchange, or financial service, and you
              cannot buy, sell, send, receive, or store cryptocurrency in the
              app.
            </p>
          </Section>

          <Section title="Information we collect">
            <p className="mb-3">We collect only what we need to run the service:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Account information.</strong> When you sign in with
                Google or Apple, we use your verified sign-in identity to derive
                a blockchain address that serves as your account identifier. We
                never receive or store your Google or Apple password. You may
                also add a username, an avatar image, a short bio, and links to
                your own social profiles. An email address may be stored if you
                provide one or if your sign-in method supplies one.
              </li>
              <li>
                <strong>Content and activity.</strong> Articles you publish,
                comments you write, and your likes, bookmarks, follows, reading
                views, and engagement-based points (XP, quests, achievements,
                streaks).
              </li>
              <li>
                <strong>AI assistant messages (mobile app, optional).</strong>{" "}
                If you turn on the AI assistant, the messages you type there are
                sent for processing as described in the
                &ldquo;AI assistant (Chat)&rdquo; section below. We do not
                retain them.
              </li>
              <li>
                <strong>Device information (mobile app).</strong> If you enable
                notifications, we store a push-notification token so we can
                deliver them, along with your device platform (iOS/Android). The
                camera is used only to scan the sign-in QR code shown on our
                website; your photo library is accessed only when you choose to
                pick a profile or publication picture. We do not access your
                camera or photos otherwise.
              </li>
            </ul>
            <p className="mt-3">
              We do <strong>not</strong> collect your precise location or
              contacts, we do <strong>not</strong> show third-party
              advertising, and we do <strong>not</strong> track you across other
              apps or websites.
            </p>
          </Section>

          <Section title="How we use your information">
            <ul className="list-disc pl-5 space-y-2">
              <li>To authenticate you and operate your account.</li>
              <li>
                To show your feeds, notifications, search results, and
                gamification progress.
              </li>
              <li>
                To keep the platform safe — reviewing reported content, handling
                blocks, and enforcing our{" "}
                <a href="/rules" className="text-primary hover:underline">
                  Community Rules
                </a>{" "}
                and{" "}
                <a href="/terms" className="text-primary hover:underline">
                  Terms
                </a>
                .
              </li>
              <li>To respond to your support requests and important notices.</li>
            </ul>
          </Section>

          <Section title="Public blockchain data & permanence">
            <p>
              Articles and certain associated data are published to a public
              blockchain and to decentralized storage by design. Data written to
              a public blockchain is <strong>permanent and public</strong> — it
              can be read by anyone and cannot be edited or deleted by anyone,
              including Inkray. Please consider this before you publish. Deleting
              your account removes your personal data from our systems but cannot
              remove content already written to the public chain.
            </p>
          </Section>

          <Section title="AI assistant (Chat)">
            <p className="mb-3">
              The Inkray mobile app includes an optional AI assistant that
              answers questions using articles published on Inkray. It is off
              until you turn it on: the first time you open the Chat tab, we
              explain this sharing and ask for your permission, and nothing is
              sent until you agree. You can withdraw that permission at any time
              in the app under <strong>Profile → About → AI assistant</strong>.
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>What is shared.</strong> The messages you type in the
                Chat tab, together with the earlier messages in that same
                conversation so replies keep their context.
              </li>
              <li>
                <strong>Who processes it.</strong>{" "}
                <strong>DigitalOcean&apos;s GenAI platform</strong>, which
                generates the reply from Inkray article content. Your name,
                email address, and account address are not sent with your
                messages.
              </li>
              <li>
                <strong>What we keep.</strong> Inkray does not store a copy of
                your conversation — it lives only on your device for the
                session. Articles the assistant cites are counted as article
                views on your account, the same as if you had opened them.
              </li>
              <li>
                <strong>Accuracy.</strong> Responses are generated by an AI
                model and may be incomplete or wrong. Do not rely on them as
                professional advice. You can report a bad response by
                long-pressing it in the app.
              </li>
            </ul>
            <p className="mt-3">
              Separately, and regardless of whether you use the assistant, we
              use <strong>OpenAI</strong> on our servers to summarize, tag, and
              moderate <em>articles that authors have already published</em>.
              That process handles public article text only; it never receives
              your chat messages or your private account information.
            </p>
          </Section>

          <Section title="Third-party services">
            <p className="mb-3">
              We rely on a small set of providers to deliver the service:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Google and Apple</strong> — sign-in (OpenID). They
                authenticate you; we receive a verified identity token.
              </li>
              <li>
                <strong>Mysten Labs (Enoki)</strong> — generates the
                zero-knowledge proof used to derive your account address from
                your sign-in.
              </li>
              <li>
                <strong>Sui network and Walrus</strong> — the public blockchain
                and decentralized storage where published content lives.
              </li>
              <li>
                <strong>DigitalOcean (GenAI platform)</strong> — powers the
                optional AI assistant in the mobile app. Receives your chat
                messages only after you have explicitly turned the assistant on.
              </li>
              <li>
                <strong>OpenAI</strong> — summarizes, tags, and moderates
                published article text on our servers. Does not receive chat
                messages or private account data.
              </li>
              <li>
                <strong>Expo</strong> — delivers push notifications to your
                device.
              </li>
              <li>
                <strong>Email provider</strong> — sends transactional email such
                as support replies and notifications you&apos;ve opted into.
              </li>
            </ul>
            <p className="mt-3">
              We do not sell your personal data. Content you publish is public by
              design.
            </p>
          </Section>

          <Section title="Your choices and rights">
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Edit your profile</strong> at any time from your account
                settings.
              </li>
              <li>
                <strong>Control notifications</strong> in the mobile app under
                Profile → Notifications, and at the operating-system level.
              </li>
              <li>
                <strong>Delete your account.</strong> In the mobile app, go to
                Profile → Account → Delete account. You can also email us at{" "}
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="text-primary hover:underline"
                >
                  {SUPPORT_EMAIL}
                </a>
                . Deletion removes your account record and personal data
                (profile, likes, bookmarks, comments, points, notifications, and
                push tokens). As noted above, content already written to the
                public blockchain is permanent and cannot be erased.
              </li>
            </ul>
          </Section>

          <Section title="Data retention">
            <p>
              We keep your account and personal data until you delete your
              account. Notification records are automatically removed after about
              30 days. Some records may be retained where required to comply with
              legal obligations or to resolve disputes.
            </p>
          </Section>

          <Section title="Children">
            <p>
              Inkray is not directed to children under 13, and we do not
              knowingly collect personal information from them. Because the
              platform hosts user-generated content, it is intended for older
              teens and adults.
            </p>
          </Section>

          <Section title="Security">
            <p>
              We use reasonable technical and organizational measures to protect
              your information. No method of transmission or storage is perfectly
              secure, but we work to keep your data safe and limit access to it.
            </p>
          </Section>

          <Section title="Changes to this policy">
            <p>
              We may update this policy from time to time. When we make material
              changes, we will update the date above and, where appropriate,
              notify you in the app or by email.
            </p>
          </Section>

          <Section title="Contact us">
            <p>
              Questions about this policy or your data? Email us at{" "}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="text-primary hover:underline"
              >
                {SUPPORT_EMAIL}
              </a>
              .
            </p>
          </Section>
        </div>
      </main>
      <Footer />
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-900 mb-3">{title}</h2>
      <div className="text-sm text-gray-600 leading-relaxed space-y-3">
        {children}
      </div>
    </section>
  )
}
