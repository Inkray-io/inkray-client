import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})
import '@mysten/dapp-kit/dist/index.css'

import { WalletProviders } from '@/components/providers/WalletProviders'
import { AuthProvider } from '@/contexts/AuthContext'
import { CacheProvider } from '@/components/providers/CacheProvider'
import { WalletChangeProvider } from '@/components/providers/WalletChangeProvider'
import { Toaster } from '@/components/ui/toaster'
import { OnboardingModal, ProfileCompletionPrompt } from '@/components/onboarding'
import { ChatModal } from '@/components/chat'
import { ChatProvider } from '@/components/chat/ChatProvider'

export const metadata: Metadata = {
  title: 'Inkray — The Publishing Platform Where You Own Your Content',
  description:
    'Inkray is a publishing platform where creators truly own their work. Write in a modern editor, publish permanently, and earn from subscriptions, tips, and collectibles — with no platform risk and no middlemen.',
  keywords: [
    'Inkray',
    'publishing platform',
    'blogging platform',
    'content ownership',
    'creator economy',
    'digital ownership',
    'Web3 publishing',
    'decentralized blogging',
    'Sui blockchain',
    'Walrus storage',
    'Seal encryption',
    'SuiNS',
    'NFT articles',
    'on-chain publishing',
    'creator monetization',
    'own your content',
  ],
  authors: [{ name: 'Inkray Team', url: 'https://inkray.xyz' }],
  creator: 'Inkray',
  publisher: 'Inkray',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
  alternates: {
    canonical: 'https://inkray.xyz',
  },
  openGraph: {
    type: 'website',
    url: 'https://inkray.xyz',
    title: 'Inkray — The Publishing Platform Where You Own Your Content',
    description:
      'Inkray is a publishing platform where creators truly own their work. Write in a modern editor, publish permanently, and earn from subscriptions, tips, and collectibles — with no platform risk and no middlemen.',
    siteName: 'Inkray',
    images: [
      {
        url: 'https://inkray.xyz/og-image.jpeg',
        width: 1600,
        height: 900,
        alt: 'Inkray — The Publishing Platform Where You Own Your Content',
      },
    ],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Inkray — The Publishing Platform Where You Own Your Content',
    description:
      'A publishing platform where your content can\'t be taken down, your audience is yours, and you earn directly. No middlemen, no algorithms.',
    site: '@inkray_io',
    creator: '@inkray_io',
    images: ['https://inkray.xyz/og-image.jpeg'],
  },
  icons: {
    icon: '/favicon.ico',
  },
  category: 'technology',
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="dns-prefetch" href="https://cdn.prod.website-files.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                '@context': 'https://schema.org',
                '@type': 'Organization',
                name: 'Inkray',
                url: 'https://inkray.xyz',
                logo: 'https://inkray.xyz/logo-icon-512.png',
                sameAs: ['https://x.com/inkray_io'],
                description:
                  'Inkray is a publishing platform where creators truly own their work. Write in a modern editor, publish permanently, and earn from subscriptions, tips, and collectibles.',
              },
              {
                '@context': 'https://schema.org',
                '@type': 'WebSite',
                name: 'Inkray',
                url: 'https://inkray.xyz',
                potentialAction: {
                  '@type': 'SearchAction',
                  target: 'https://inkray.xyz/feed?q={search_term_string}',
                  'query-input': 'required name=search_term_string',
                },
              },
            ]),
          }}
        />
      </head>
      <body className={`font-sans ${inter.variable}`}>
        <CacheProvider>
          <WalletProviders>
            <WalletChangeProvider>
              <AuthProvider>
                <ChatProvider>
                  {children}
                  <Toaster />
                  <OnboardingModal />
                  <ProfileCompletionPrompt />
                  <ChatModal />
                </ChatProvider>
              </AuthProvider>
            </WalletChangeProvider>
          </WalletProviders>
        </CacheProvider>
      </body>
    </html>
  )
}
