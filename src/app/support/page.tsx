import type { Metadata } from "next"
import { Navbar } from "@/components/landing/Navbar"
import { Footer } from "@/components/landing/Footer"

/**
 * Public support page.
 *
 * App Store Connect requires a working Support URL on the product page, and
 * guideline 1.2 requires published contact information for a user-generated
 * content app. This page is that destination — previously /support 404'd.
 */
export const metadata: Metadata = {
  title: "Support | Inkray",
  description:
    "Get help with Inkray — contact support, report content, manage or delete your account.",
  alternates: { canonical: "https://inkray.xyz/support" },
}

const SUPPORT_EMAIL = "support@inkray.xyz"

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <Navbar />
      <main className="flex-1 container max-w-3xl mx-auto px-4 py-12 sm:py-16">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-3">
          Support
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-4">
          How can we help?
        </h1>
        <p className="text-base text-gray-600 leading-relaxed mb-10 max-w-2xl">
          Email us at{" "}
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="text-primary hover:underline font-medium"
          >
            {SUPPORT_EMAIL}
          </a>{" "}
          and we&apos;ll get back to you. We review reports of objectionable
          content and abusive behavior within 24 hours.
        </p>

        <div className="space-y-10">
          <Section title="Report content or a user">
            <p>
              In the mobile app, tap the <strong>⋯</strong> menu on an article,
              or press and hold a comment, and choose{" "}
              <strong>Report</strong>. You can block a user from the same menu —
              their articles and comments are then hidden from you everywhere in
              the app. Blocked accounts are listed under{" "}
              <strong>Profile → Blocked Users</strong> if you want to unblock
              someone.
            </p>
            <p>
              You can also email{" "}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="text-primary hover:underline"
              >
                {SUPPORT_EMAIL}
              </a>{" "}
              with a link to the content. We have zero tolerance for
              objectionable content or abusive users, and we remove content that
              breaks our{" "}
              <a href="/rules" className="text-primary hover:underline">
                Community Rules
              </a>
              .
            </p>
          </Section>

          <Section title="Report an AI assistant response">
            <p>
              The Chat tab in the mobile app is powered by an AI model, and its
              answers can be wrong. Press and hold any response and choose{" "}
              <strong>Report</strong> to send it to us. You can turn the
              assistant off entirely under{" "}
              <strong>Profile → About → AI assistant</strong>, which stops your
              messages from being shared with our AI provider.
            </p>
          </Section>

          <Section title="Account and data">
            <p>
              To delete your account, open the mobile app and go to{" "}
              <strong>Profile → Delete Account</strong>. This permanently
              removes your account record and personal data — profile, likes,
              bookmarks, comments, points, notifications, and push tokens. If
              you cannot access the app, email us and we will do it for you.
            </p>
            <p>
              Note that articles published to the public blockchain are
              permanent and cannot be erased by anyone, including Inkray. See
              our{" "}
              <a href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </a>{" "}
              for the full picture.
            </p>
          </Section>

          <Section title="Trouble signing in">
            <p>
              Inkray supports Sign in with Apple, Google, and pairing the mobile
              app with the website via QR code. Each sign-in method creates its
              own separate account, so if your content looks missing, check that
              you signed in the same way you did originally. You can also browse
              as a guest without an account.
            </p>
          </Section>

          <Section title="Still stuck?">
            <p>
              Write to{" "}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="text-primary hover:underline"
              >
                {SUPPORT_EMAIL}
              </a>
              . Telling us your username, your device, and what you were doing
              when it went wrong helps us fix it faster.
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
