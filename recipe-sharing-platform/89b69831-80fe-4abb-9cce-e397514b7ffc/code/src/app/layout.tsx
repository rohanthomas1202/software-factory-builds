import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Navigation } from '@/components/navigation'
import { Toaster } from '@/components/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'RecipeShare - A Social Recipe Sharing Platform',
  description: 'Share, discover, and rate recipes with a community of cooking enthusiasts',
  keywords: ['recipes', 'cooking', 'food', 'community', 'sharing', 'ratings'],
  authors: [{ name: 'RecipeShare Team' }],
  creator: 'RecipeShare',
  publisher: 'RecipeShare',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://recipeshare.app',
    title: 'RecipeShare - A Social Recipe Sharing Platform',
    description: 'Share, discover, and rate recipes with a community of cooking enthusiasts',
    siteName: 'RecipeShare',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'RecipeShare Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RecipeShare - A Social Recipe Sharing Platform',
    description: 'Share, discover, and rate recipes with a community of cooking enthusiasts',
    images: ['/twitter-image.png'],
    creator: '@recipeshare',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-gradient-to-br from-background via-secondary/5 to-background`}>
        <ThemeProvider>
          <Navigation>
            <main className="min-h-screen pt-16">
              {children}
            </main>
            <Toaster />
          </Navigation>
        </ThemeProvider>
      </body>
    </html>
  )
}