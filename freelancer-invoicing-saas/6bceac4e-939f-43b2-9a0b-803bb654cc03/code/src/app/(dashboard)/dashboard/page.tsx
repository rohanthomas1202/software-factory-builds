```typescript
import React from 'react'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { store } from '@/lib/store'
import PageHeader from '@/components/layout/PageHeader'
import StatsCard from '@/components/dashboard/StatsCard'
import RecentInvoices from '@/components/dashboard/RecentInvoices'
import RevenueChart from '@/components/dashboard/RevenueChart'
import { formatCurrency } from '@/lib/utils'

export const metadata = {
  title: 'Dashboard - InvoiceFlow',
  description: 'Your invoicing dashboard with key metrics and insights',
}

export default async function DashboardPage() {
  const session = await getSession()
  
  if (!session) {
    redirect('/login')
  }

  // Fetch dashboard data
  let dashboardData = null
  let error = null

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/dashboard`, {
      headers: {
        'Cookie': `invoiceflow_session=${session.id}`,
      },
      cache: 'no-store',
    })

    if (response.ok) {
      dashboardData = await response.json()
    } else {
      error = 'Failed to load dashboard data'
    }
  } catch (err) {
    console.error('Failed to fetch dashboard data:', err)
    error = 'Failed to load dashboard data'
  }

  const user = await store.getUserById(session.userId)
  const currency = user?.currency || 'USD'

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Welcome back! Here's what's happening with your business."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Dashboard', href: '/dashboard' },
        ]}
      />

      {error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-destructive/20 flex items-center justify-center">
                <svg className="h-5 w-5 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-destructive">Error loading dashboard</h3>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Total Revenue"
              value={dashboardData ? formatCurrency(dashboardData.stats.totalRevenue, currency) : '...'}
              description="All time paid invoices"
              change={{
                value: dashboardData?.stats.revenueChange || 0,
                type: dashboardData?.stats.revenueChange >= 0 ? 'increase' : 'decrease',
              }}
            />
            <StatsCard
              title="Pending Payments"
              value={dashboardData ? formatCurrency(dashboardData.stats.pendingAmount, currency) : '...'}
              description="Awaiting payment"
              change={{
                value: 12.5,
                type: 'increase',
              }}
            />
            <StatsCard
              title="Active Clients"
              value={dashboardData?.stats.totalClients || 0}
              description="Total clients"
              change={{
                value: 8.2,
                type: 'increase',
              }}
            />
            <StatsCard
              title="Overdue Invoices"
              value={dashboardData ? formatCurrency(dashboardData.stats.overdueAmount, currency) : '...'}
              description={`${dashboardData?.stats.overdueInvoices || 0} invoices`}
              change={{
                value: -3.2,
                type: 'decrease',
              }}
            />
          </div>

          {/* Charts and Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <RevenueChart
              data={dashboardData?.chartData || []}
              loading={!dashboardData}
              currency={currency}
            />
            <RecentInvoices
              invoices={dashboardData?.recentInvoices || []}
              loading={!dashboardData}
            />
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Total Invoices"
              value={dashboardData?.stats.totalInvoices || 0}
              description="All invoices created"
              className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20"
            />
            <StatsCard
              title="Paid Invoices"
              value={dashboardData?.stats.paidInvoices || 0}
              description="Successfully collected"
              className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/20"
            />
            <StatsCard
              title="Total Expenses"
              value={dashboardData ? formatCurrency(dashboardData.stats.totalExpenses, currency) : '...'}
              description="Business costs"
              className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20"
            />
            <StatsCard
              title="Net Profit"
              value={dashboardData ? formatCurrency(dashboardData.stats.profit, currency) : '...'}
              description="Revenue minus expenses"
              className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20"
            />
          </div>

          {/* Quick Actions */}
          <div className="rounded-lg border bg-gradient-to-r from-primary/5 to-primary/10 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">Quick Actions</h3>
                <p className="text-sm text-muted-foreground">
                  Create a new invoice, add a client, or track an expense
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  href="/invoices/new"
                  className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Create Invoice
                </a>
                <a
                  href="/clients/new"
                  className="inline-flex items-center justify-center rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Add Client
                </a>
                <a
                  href="/expenses/new"
                  className="inline-flex items-center justify-center rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Track Expense
                </a>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
```