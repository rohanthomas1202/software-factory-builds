```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { store } from '@/lib/store'
import { InvoiceStatus } from '@/types'
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get all invoices for the user
    const invoices = await store.getInvoicesByUserId(session.userId)
    const clients = await store.getClientsByUserId(session.userId)
    const expenses = await store.getExpensesByUserId(session.userId)

    // Calculate dashboard stats
    const totalRevenue = invoices
      .filter(invoice => invoice.status === 'paid')
      .reduce((sum, invoice) => sum + invoice.total, 0)

    const pendingInvoices = invoices.filter(invoice => 
      invoice.status === 'sent' || invoice.status === 'pending'
    )
    const pendingAmount = pendingInvoices.reduce((sum, invoice) => sum + invoice.total, 0)

    const overdueInvoices = invoices.filter(invoice => invoice.status === 'overdue')
    const overdueAmount = overdueInvoices.reduce((sum, invoice) => sum + invoice.total, 0)

    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)

    // Calculate month-over-month change
    const now = new Date()
    const currentMonthStart = startOfMonth(now)
    const currentMonthEnd = endOfMonth(now)
    const lastMonthStart = startOfMonth(subDays(currentMonthStart, 1))
    const lastMonthEnd = endOfMonth(lastMonthStart)

    const currentMonthRevenue = invoices
      .filter(invoice => 
        invoice.status === 'paid' && 
        invoice.paidAt && 
        new Date(invoice.paidAt) >= currentMonthStart &&
        new Date(invoice.paidAt) <= currentMonthEnd
      )
      .reduce((sum, invoice) => sum + invoice.total, 0)

    const lastMonthRevenue = invoices
      .filter(invoice => 
        invoice.status === 'paid' && 
        invoice.paidAt && 
        new Date(invoice.paidAt) >= lastMonthStart &&
        new Date(invoice.paidAt) <= lastMonthEnd
      )
      .reduce((sum, invoice) => sum + invoice.total, 0)

    const revenueChange = lastMonthRevenue > 0 
      ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : currentMonthRevenue > 0 ? 100 : 0

    // Generate revenue chart data for last 30 days
    const last30Days = eachDayOfInterval({
      start: subDays(now, 29),
      end: now,
    })

    const revenueData = last30Days.map(date => {
      const dateStr = format(date, 'MMM d')
      const dayRevenue = invoices
        .filter(invoice => 
          invoice.status === 'paid' && 
          invoice.paidAt && 
          format(new Date(invoice.paidAt), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
        )
        .reduce((sum, invoice) => sum + invoice.total, 0)

      const dayInvoices = invoices.filter(invoice => 
        format(new Date(invoice.issueDate), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      ).length

      const dayExpenses = expenses
        .filter(expense => 
          format(new Date(expense.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
        )
        .reduce((sum, expense) => sum + expense.amount, 0)

      return {
        date: dateStr,
        revenue: dayRevenue,
        invoices: dayInvoices,
        expenses: dayExpenses,
        profit: dayRevenue - dayExpenses,
      }
    })

    // Get recent invoices (last 5)
    const recentInvoices = invoices
      .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime())
      .slice(0, 5)
      .map(invoice => ({
        ...invoice,
        client: clients.find(client => client.id === invoice.clientId),
      }))

    // Get user's currency
    const user = await store.getUserById(session.userId)
    const currency = user?.currency || 'USD'

    const response = {
      stats: {
        totalRevenue,
        pendingAmount,
        overdueAmount,
        totalExpenses,
        totalClients: clients.length,
        totalInvoices: invoices.length,
        paidInvoices: invoices.filter(i => i.status === 'paid').length,
        pendingInvoices: pendingInvoices.length,
        overdueInvoices: overdueInvoices.length,
        revenueChange,
        profit: totalRevenue - totalExpenses,
      },
      chartData: revenueData,
      recentInvoices,
      currency,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Failed to load dashboard data' },
      { status: 500 }
    )
  }
}
```