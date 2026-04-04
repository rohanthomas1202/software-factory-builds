import React from 'react'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { store } from '@/lib/store'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'
import { ThemeProvider } from '@/components/theme-provider'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const session = await getSession()
  
  if (!session) {
    redirect('/login')
  }

  const user = await store.getUser(session.userId)
  
  if (!user) {
    redirect('/login')
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <div className="flex min-h-screen bg-background">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <Sidebar user={user} />
        </div>
        
        {/* Main Content */}
        <div className="flex-1">
          <TopBar user={user} showMenuButton={true} />
          <main className="p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </ThemeProvider>
  )
}