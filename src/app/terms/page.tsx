import type { Metadata } from "next"
import { Navbar } from "@/components/landing/Navbar"
import { Footer } from "@/components/landing/Footer"

export const metadata: Metadata = {
  title: "Terms of Service | Inkray",
  description:
    "The terms that govern your use of the Inkray website and mobile app, including our content standards and zero-tolerance policy for abuse.",
  alternates: { canonical: "https://inkray.xyz/terms" },
}

const LAST_UPDATED = "July 30, 2026"
const SUPPORT_EMAIL = "support@inkray.xyz"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <Navbar />
      <main className="flex-1 container max-w-3xl mx-auto px-4 py-12 sm:py-16">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-3">
          Terms of Service
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-4">
          The terms of using Inkray
        </h1>
        <p className="text-base text-gray-600 leading-relaxed mb-2 max-w-2xl">
          These terms govern your use of the Inkray website (inkray.xyz) and the
          Inkray mobile app. By using Inkray, you agree to them.
        </p>
        <p className="text-xs text-gray-400 mb-10">Last updated: {LAST_UPDATED}</p>

        <div className="space-y-10">
          <Section title="1. Who can use Inkray">
            <p>
              You must be at least 13 years old to use Inkray. Because the
              platform hosts user-generated content, some features and content
              are intended for older teens and adults. You are responsible for
              keeping your account secure.
            </p>
          </Section>

          <Section title="2. Your account">
            <p>
              You sign in with Google or Apple, and Inkray derives a blockchain
              address that serves as your account identifier. Each sign-in method
              is its own account. Inkray is a reader and publishing tool — it is
              not a wallet, exchange, or financial service, and it does not
              enable buying, selling, sending, receiving, or storing
              cryptocurrency.
            </p>
          </Section>

          <Section title="3. Content standards & zero tolerance for abuse">
            <p className="mb-3">
              You are responsible for everything you publish and post. We have{" "}
              <strong>
                no tolerance for objectionable content or abusive users
              </strong>
              . You may not post content that is illegal, hateful, harassing,
              threatening, sexually exploitative, or that impersonates others or
              facilitates fraud or scams. Our{" "}
              <a href="/rules" className="text-primary hover:underline">
                Community Rules
              </a>{" "}
              describe the standards in detail and form part of these terms.
            </p>
            <p>
              We may remove content from feeds, search, and rankings, exclude it
              from our indexes, and suspend or block accounts that violate these
              terms — with or without notice.
            </p>
          </Section>

          <Section title="4. Reporting, blocking & moderation">
            <p>
              You can report any article or comment, and you can block other
              users so their content is hidden from you. Reports can be sent from
              within the app or by emailing{" "}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="text-primary hover:underline"
              >
                {SUPPORT_EMAIL}
              </a>
              . We review reports of objectionable content and act on them,
              typically within 24 hours, which may include removing content and
              removing the users responsible.
            </p>
          </Section>

          <Section title="5. Your content & blockchain permanence">
            <p>
              You retain ownership of the content you create. By publishing on
              Inkray, you grant us a license to host, display, and distribute
              that content in order to operate the platform. Because content is
              published to a public blockchain and decentralized storage, it is{" "}
              <strong>permanent and public</strong>: once published it can be
              read by anyone and cannot be edited or deleted by anyone, including
              Inkray. Please consider this before publishing.
            </p>
          </Section>

          <Section title="6. Payments and value">
            <p>
              The app contains no purchases. Any &quot;SUI&quot; figures shown on
              articles are informational statistics about tips given on our
              website — similar to a &quot;claps&quot; or applause counter — and
              have no monetary value inside the app. Engagement points (XP) are
              for recognition only and are not redeemable for money or
              cryptocurrency.
            </p>
          </Section>

          <Section title="7. Disclaimers">
            <p>
              Inkray is provided &quot;as is&quot; and &quot;as available,&quot;
              without warranties of any kind. We do not guarantee that the
              service will be uninterrupted, error-free, or that content on the
              platform is accurate or reliable. You use Inkray at your own risk.
            </p>
          </Section>

          <Section title="8. Limitation of liability">
            <p>
              To the maximum extent permitted by law, Inkray and its team will
              not be liable for any indirect, incidental, or consequential
              damages, or for any loss of data, arising from your use of the
              service.
            </p>
          </Section>

          <Section title="9. Termination">
            <p>
              You may delete your account at any time from Profile → Account →
              Delete account in the mobile app, or by contacting us. We may
              suspend or terminate access for violations of these terms.
              Deletion removes your personal data from our systems; content
              already written to the public blockchain remains permanent.
            </p>
          </Section>

          <Section title="10. Changes to these terms">
            <p>
              We may update these terms from time to time. When we make material
              changes, we will update the date above and, where appropriate,
              notify you in the app or by email. Continued use of Inkray after
              changes take effect means you accept the updated terms.
            </p>
          </Section>

          <Section title="11. Contact">
            <p>
              Questions about these terms? Email us at{" "}
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
