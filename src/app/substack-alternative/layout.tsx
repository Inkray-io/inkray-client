import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Best Substack Alternative for Creators — Inkray",
  description:
    "Looking for Substack alternatives in 2026? Inkray gives creators true content ownership, no revenue share on tips, and permanent storage.",
  keywords: [
    "Substack alternative",
    "Substack alternatives 2026",
    "best Substack alternative",
    "newsletter platform",
    "blogging platform",
    "content ownership",
    "creator platform",
    "Medium alternative",
    "Ghost alternative",
    "publishing platform",
  ],
  openGraph: {
    title: "Best Substack Alternative for Creators — Inkray",
    description:
      "Looking for Substack alternatives in 2026? Inkray gives creators true content ownership, no revenue share on tips, and permanent storage.",
    url: "https://inkray.xyz/substack-alternative",
    siteName: "Inkray",
    images: [
      {
        url: "https://inkray.xyz/og-image.jpeg",
        width: 1200,
        height: 630,
        alt: "Inkray — The Substack Alternative Where You Own Everything",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Best Substack Alternative for Creators — Inkray",
    description:
      "Looking for Substack alternatives in 2026? Inkray gives creators true content ownership, no revenue share on tips, and permanent storage.",
    images: ["https://inkray.xyz/og-image.jpeg"],
  },
}

export default function SubstackAlternativeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
