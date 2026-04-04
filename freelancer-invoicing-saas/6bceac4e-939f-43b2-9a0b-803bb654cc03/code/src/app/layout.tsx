import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'InvoiceFlow - Professional Invoicing for Freelancers',
  description: 'Streamline your invoicing workflow with our modern SaaS platform designed specifically for freelancers.',
  keywords: ['invoicing', 'freelancer', 'SaaS', 'billing', 'payments', 'financial management'],
  authors: [{ name: 'InvoiceFlow Team' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://invoiceflow.app',
    title: 'InvoiceFlow - Professional Invoicing for Freelancers',
    description: 'Streamline your invoicing workflow with our modern SaaS platform designed specifically for freelancers.',
    siteName: 'InvoiceFlow',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'InvoiceFlow - Professional Invoicing for Freelancers',
    description: 'Streamline your invoicing workflow with our modern SaaS platform designed specifically for freelancers.',
    creator: '@invoiceflow',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased min-h-screen bg-gradient-to-br from-background via-background to-primary/5`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}