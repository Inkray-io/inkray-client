import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Inkray for Writers — Own Your Content, Earn on Your Terms",
  description:
    "Inkray is a publishing platform built for writers. Own every article you publish, monetize with subscriptions and tips, and never worry about deplatforming.",
  keywords: [
    "Inkray",
    "publishing platform for writers",
    "blogging platform",
    "content ownership",
    "creator monetization",
    "earn from writing",
    "own your content",
    "writer platform",
    "permanent publishing",
    "independent publishing",
  ],
  alternates: {
    canonical: "https://inkray.xyz/for-writers",
  },
  openGraph: {
    type: "website",
    url: "https://inkray.xyz/for-writers",
    title: "Inkray for Writers — Own Your Content, Earn on Your Terms",
    description:
      "Inkray is a publishing platform built for writers. Own every article you publish, monetize with subscriptions and tips, and never worry about deplatforming.",
    siteName: "Inkray",
    images: [
      {
        url: "https://inkray.xyz/og-image.jpeg",
        width: 1600,
        height: 900,
        alt: "Inkray for Writers — Own Your Content, Earn on Your Terms",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Inkray for Writers — Own Your Content, Earn on Your Terms",
    description:
      "A publishing platform where writers own every article, earn directly from readers, and never worry about takedowns or algorithms.",
    site: "@inkray_io",
    creator: "@inkray_io",
    images: ["https://inkray.xyz/og-image.jpeg"],
  },
}

export default function ForWritersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
