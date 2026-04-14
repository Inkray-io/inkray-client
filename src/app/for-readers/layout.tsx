import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Inkray for Readers — Discover Writers, Support Directly",
  description:
    "Read ad-free articles on Inkray. Discover independent writers, support them directly with tips, and collect your favorite pieces.",
  keywords: [
    "Inkray",
    "reading platform",
    "ad-free reading",
    "support writers",
    "independent writers",
    "collect articles",
    "reader platform",
    "algorithm-free reading",
    "tip writers",
    "discover writers",
  ],
  alternates: {
    canonical: "https://inkray.xyz/for-readers",
  },
  openGraph: {
    type: "website",
    url: "https://inkray.xyz/for-readers",
    title: "Inkray for Readers — Discover Writers, Support Directly",
    description:
      "Read ad-free articles on Inkray. Discover independent writers, support them directly with tips, and collect your favorite pieces.",
    siteName: "Inkray",
    images: [
      {
        url: "https://inkray.xyz/og-image.jpeg",
        width: 1600,
        height: 900,
        alt: "Inkray for Readers — Discover Writers, Support Directly",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Inkray for Readers — Discover Writers, Support Directly",
    description:
      "An ad-free reading experience. Discover great writers, support them directly, and collect articles you love.",
    site: "@inkray_io",
    creator: "@inkray_io",
    images: ["https://inkray.xyz/og-image.jpeg"],
  },
}

export default function ForReadersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
