import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "How to Monetize Your Writing Online — Inkray",
  description:
    "Learn four proven ways to earn money from your writing online: paid subscriptions, reader tips, collectible editions, and gated content. Start earning with Inkray today.",
  keywords: [
    "how to monetize writing online",
    "make money writing",
    "earn from writing",
    "paid newsletter",
    "writing income",
    "monetize blog",
    "paid subscriptions for writers",
    "reader tips",
    "gated content",
    "Inkray",
  ],
  alternates: {
    canonical: "https://inkray.xyz/monetize-writing",
  },
  openGraph: {
    type: "website",
    url: "https://inkray.xyz/monetize-writing",
    title: "How to Monetize Your Writing Online — Inkray",
    description:
      "Learn four proven ways to earn money from your writing online: paid subscriptions, reader tips, collectible editions, and gated content.",
    siteName: "Inkray",
    images: [
      {
        url: "https://inkray.xyz/og-image.jpeg",
        width: 1600,
        height: 900,
        alt: "How to Monetize Your Writing Online — Inkray",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "How to Monetize Your Writing Online — Inkray",
    description:
      "Four proven ways to earn from your writing: subscriptions, tips, collectibles, and gated content.",
    site: "@inkray_io",
    creator: "@inkray_io",
    images: ["https://inkray.xyz/og-image.jpeg"],
  },
}

export default function MonetizeWritingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
