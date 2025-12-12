import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
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
import { OnboardingModal } from '@/components/onboarding'

export const metadata: Metadata = {
  title: 'Inkray – True Digital Ownership for Creators',
  description:
    'Inkray combines the simplicity of modern blogging with the power of blockchain ownership. Publish effortlessly, own permanently.',
  keywords: [
    'Inkray',
    'Web3 blogging',
    'decentralized publishing',
    'creator economy',
    'digital ownership',
    'Sui blockchain',
    'Walrus storage',
    'SuiNS',
    'NFT content',
  ],
  authors: [{ name: 'Inkray Team', url: 'https://inkray.xyz' }],
  creator: 'Inkray',
  publisher: 'Inkray',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
  openGraph: {
    type: 'website',
    url: 'https://inkray.xyz',
    title: 'Inkray – True Digital Ownership for Creators',
    description:
      'Inkray combines the simplicity of modern blogging with the power of blockchain ownership. Publish effortlessly, own permanently.',
    siteName: 'Inkray',
    images: [
      {
        url: 'https://inkray.xyz/og-image.jpeg', // replace with your OG image
        width: 1600,
        height: 900,
        alt: 'Inkray – True Digital Ownership for Creators',
      },
    ],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Inkray – True Digital Ownership for Creators',
    description:
      'Publish effortlessly, own permanently. Inkray brings together modern blogging simplicity and blockchain-powered ownership.',
    site: '@inkray_io', // replace with your handle if available
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
      <body className={`font-sans ${inter.variable}`}>
        <CacheProvider>
          <WalletProviders>
            <WalletChangeProvider>
              <AuthProvider>
                {children}
                <Toaster />
                <OnboardingModal />
              </AuthProvider>
            </WalletChangeProvider>
          </WalletProviders>
        </CacheProvider>

        {/* DigitalOcean AI Chatbot */}
        <Script
          id="digitalocean-chatbot"
          src="https://nabqygyhmmhom56tewiv3yla.agents.do-ai.run/static/chatbot/widget.js"
          strategy="afterInteractive"
          data-agent-id="ec14d47c-d74a-11f0-b074-4e013e2ddde4"
          data-chatbot-id="LL0Wk_OGxrc1lQN2twhwokas-HBXWLIg"
          data-name="Inkray"
          data-primary-color="#005EFC"
          data-secondary-color="#FAFAFA"
          data-button-background-color="#005EFC"
          data-starting-message="Hello! How can I help you today?"
          data-logo="https://inkray.xyz/favicon.ico"
        />
      </body>
    </html>
  )
}
