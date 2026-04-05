import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import NavBar from '@/components/NavBar';
import { getSessionFromRequest } from '@/lib/auth';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Personal Finance Tracker',
  description: 'Track your spending and manage your budget',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSessionFromRequest();
  
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 text-gray-900 min-h-screen`}>
        <div className="flex flex-col min-h-screen">
          <NavBar userEmail={session?.email || null} />
          <main className="flex-1 p-4 md:p-6">{children}</main>
          <footer className="border-t border-gray-200 p-4 text-center text-sm text-gray-600">
            <p>Personal Finance Tracker &copy; {new Date().getFullYear()}</p>
          </footer>
        </div>
      </body>
    </html>
  );
}