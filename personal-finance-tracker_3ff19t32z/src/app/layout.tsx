import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { seedDatabase } from '@/lib/seed';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Personal Finance Tracker',
  description: 'Track your expenses and manage your budget',
};

// Seed database on server startup
seedDatabase();

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50`}>
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}