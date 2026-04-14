import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Content Ownership for Creators — Why It Matters",
  description:
    "Content ownership means you — not a platform — control your writing, your audience data, and your revenue. Learn why creators are moving to platforms that guarantee true ownership.",
  keywords: [
    "content ownership",
    "who owns my content",
    "creator content rights",
    "digital content ownership",
    "own your content",
    "platform risk",
    "creator rights",
    "content permanence",
    "decentralized publishing",
    "Inkray",
  ],
  alternates: {
    canonical: "https://inkray.xyz/content-ownership",
  },
  openGraph: {
    type: "website",
    url: "https://inkray.xyz/content-ownership",
    title: "Content Ownership for Creators — Why It Matters",
    description:
      "Content ownership means you — not a platform — control your writing, your audience data, and your revenue. Learn why creators are moving to platforms that guarantee true ownership.",
    siteName: "Inkray",
    images: [
      {
        url: "https://inkray.xyz/og-image.jpeg",
        width: 1600,
        height: 900,
        alt: "Content Ownership for Creators — Why It Matters",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Content Ownership for Creators — Why It Matters",
    description:
      "Content ownership means you — not a platform — control your writing, your audience data, and your revenue.",
    site: "@inkray_io",
    creator: "@inkray_io",
    images: ["https://inkray.xyz/og-image.jpeg"],
  },
}

export default function ContentOwnershipLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
