import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/app/providers";
import { getCurrentUser } from "@/lib/auth";
import { NotificationBell } from "@/components/NotificationBell";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kanban Collab",
  description: "Project management tool with kanban boards and team collaboration",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-gray-50 text-gray-900`}>
        <Providers user={user}>
          <div className="min-h-screen flex flex-col">
            <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
              <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-8">
                  <a href="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                        <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
                      </svg>
                    </div>
                    <span className="text-xl font-bold text-gray-900">Kanban Collab</span>
                  </a>
                  {user && (
                    <nav className="hidden md:flex items-center gap-6">
                      <a href="/" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                        Dashboard
                      </a>
                      <a href="#" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                        Projects
                      </a>
                      <a href="#" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                        Teams
                      </a>
                    </nav>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  {user ? (
                    <>
                      <NotificationBell />
                      <div className="flex items-center gap-3">
                        <div className="hidden sm:flex flex-col items-end">
                          <span className="text-sm font-medium text-gray-900">{user.name}</span>
                          <span className="text-xs text-gray-500">{user.email}</span>
                        </div>
                        <div className="w-9 h-9 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-3">
                      <a
                        href="/login"
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                      >
                        Sign in
                      </a>
                      <a
                        href="/register"
                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        Get started
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </header>
            <main className="flex-1">{children}</main>
            <footer className="border-t border-gray-200 py-6">
              <div className="container mx-auto px-4 text-center text-sm text-gray-500">
                <p>© {new Date().getFullYear()} Kanban Collab. Built with Next.js and Tailwind CSS.</p>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}