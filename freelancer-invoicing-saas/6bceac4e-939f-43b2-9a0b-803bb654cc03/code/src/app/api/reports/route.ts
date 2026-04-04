```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { store } from '@/lib/store'
import { InvoiceStatus, ExpenseCategory } from '@/types'
import { format, subMonths, startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO, eachDayOfInterval, eachMonthOfInterval, subDays } from 'date-fns'

// GET /api/reports - Generate various financial reports
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const reportType = searchParams.get('type') || 'overview'
    const period = searchParams.get('period') || 'month'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const currency = searchParams.get('currency') || 'USD'

    // Get user's data
    const user = await store.getUserById(session.userId)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get all invoices and expenses for the user
    const invoices = await store.getInvoicesByUserId(session.userId)
    const expenses = await store.getExpensesByUserId(session.userId)

    // Calculate date range based on period
    let dateRange: { start: Date; end: Date }
    const now = new Date()

    switch (period) {
      case 'week':
        dateRange = {
          start: subDays(now, 7),
          end: now
        }
        break
      case 'month':
        dateRange = {
          start: startOfMonth(now),
          end: endOfMonth(now)
        }
        break
      case 'quarter':
        dateRange = {
          start: subMonths(now, 3),
          end: now
        }
        break
      case 'year':
        dateRange = {
          start: startOfYear(now),
          end: endOfYear(now)
        }
        break
      case 'custom':
        if (!startDate || !endDate) {
          return NextResponse.json(
            { error: 'Custom period requires startDate and endDate' },
            { status: 400 }
          )
        }
        dateRange = {
          start: parseISO(startDate),
          end: parseISO(endDate)
        }
        break
      default:
        dateRange = {
          start: subMonths(now, 12),
          end: now
        }
    }

    // Filter data by date range
    const filteredInvoices = invoices.filter(invoice => {
      const invoiceDate = parseISO(invoice.issueDate)
      return invoiceDate >= dateRange.start && invoiceDate <= dateRange.end
    })

    const filteredExpenses = expenses.filter(expense => {
      const expenseDate = parseISO(expense.date)
      return expenseDate >= dateRange.start && expenseDate <= dateRange.end
    })

    // Generate report based on type
    switch (reportType) {
      case 'overview':
        return NextResponse.json(generateOverviewReport(filteredInvoices, filteredExpenses, dateRange, currency))
      
      case 'revenue':
        return NextResponse.json(generateRevenueReport(filteredInvoices, dateRange, currency))
      
      case 'expenses':
        return NextResponse.json(generateExpensesReport(filteredExpenses, dateRange, currency))
      
      case 'profit-loss':
        return NextResponse.json(generateProfitLossReport(filteredInvoices, filteredExpenses, dateRange, currency))
      
      case 'client':
        return NextResponse.json(generateClientReport(filteredInvoices, dateRange, currency))
      
      case 'tax':
        return NextResponse.json(generateTaxReport(filteredInvoices, filteredExpenses, dateRange, currency))
      
      default:
        return NextResponse.json(
          { error: 'Invalid report type' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    )
  }
}

// Helper functions for different report types
function generateOverviewReport(
  invoices: any[],
  expenses: any[],
  dateRange: { start: Date; end: Date },
  currency: string
) {
  const totalRevenue = invoices.reduce((sum, invoice) => sum + invoice.total, 0)
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const totalProfit = totalRevenue - totalExpenses
  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

  const paidInvoices = invoices.filter(inv => inv.status === 'paid')
  const pendingInvoices = invoices.filter(inv => inv.status === 'sent' || inv.status === 'viewed')
  const overdueInvoices = invoices.filter(inv => {
    if (inv.status !== 'paid' && inv.dueDate) {
      const dueDate = parseISO(inv.dueDate)
      return dueDate < new Date()
    }
    return false
  })

  const totalPaid = paidInvoices.reduce((sum, inv) => sum + inv.total, 0)
  const totalPending = pendingInvoices.reduce((sum, inv) => sum + inv.total, 0)
  const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + inv.total, 0)

  // Calculate average invoice value
  const avgInvoiceValue = invoices.length > 0 ? totalRevenue / invoices.length : 0

  // Calculate payment collection rate
  const collectionRate = invoices.length > 0 ? (paidInvoices.length / invoices.length) * 100 : 0

  // Top clients by revenue
  const clientRevenue = new Map()
  invoices.forEach(invoice => {
    const clientId = invoice.clientId
    const current = clientRevenue.get(clientId) || 0
    clientRevenue.set(clientId, current + invoice.total)
  })

  const topClients = Array.from(clientRevenue.entries())
    .map(([clientId, revenue]) => ({ clientId, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  // Expense breakdown by category
  const expenseByCategory = new Map()
  expenses.forEach(expense => {
    const category = expense.category
    const current = expenseByCategory.get(category) || 0
    expenseByCategory.set(category, current + expense.amount)
  })

  const expenseBreakdown = Array.from(expenseByCategory.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)

  return {
    type: 'overview',
    period: dateRange,
    summary: {
      totalRevenue,
      totalExpenses,
      totalProfit,
      profitMargin: parseFloat(profitMargin.toFixed(2)),
      avgInvoiceValue: parseFloat(avgInvoiceValue.toFixed(2)),
      collectionRate: parseFloat(collectionRate.toFixed(2))
    },
    invoiceMetrics: {
      total: invoices.length,
      paid: paidInvoices.length,
      pending: pendingInvoices.length,
      overdue: overdueInvoices.length,
      totalPaid,
      totalPending,
      totalOverdue
    },
    topClients,
    expenseBreakdown,
    currency
  }
}

function generateRevenueReport(
  invoices: any[],
  dateRange: { start: Date; end: Date },
  currency: string
) {
  // Group by time period (daily, monthly)
  const isLongPeriod = (dateRange.end.getTime() - dateRange.start.getTime()) > 30 * 24 * 60 * 60 * 1000
  const timeFormat = isLongPeriod ? 'MMM yyyy' : 'MMM dd'

  const revenueByPeriod = new Map()
  const invoicesByPeriod = new Map()

  invoices.forEach(invoice => {
    const date = parseISO(invoice.issueDate)
    const periodKey = format(date, timeFormat)
    
    const currentRevenue = revenueByPeriod.get(periodKey) || 0
    revenueByPeriod.set(periodKey, currentRevenue + invoice.total)

    const currentInvoices = invoicesByPeriod.get(periodKey) || []
    currentInvoices.push(invoice)
    invoicesByPeriod.set(periodKey, currentInvoices)
  })

  // Create time series data
  const timeSeries = Array.from(revenueByPeriod.entries())
    .map(([period, revenue]) => ({
      period,
      revenue: parseFloat(revenue.toFixed(2)),
      invoices: invoicesByPeriod.get(period)?.length || 0,
      avgValue: parseFloat((revenue / (invoicesByPeriod.get(period)?.length || 1)).toFixed(2))
    }))
    .sort((a, b) => new Date(a.period).getTime() - new Date(b.period).getTime())

  // Calculate growth metrics
  let revenueGrowth = 0
  if (timeSeries.length >= 2) {
    const current = timeSeries[timeSeries.length - 1].revenue
    const previous = timeSeries[timeSeries.length - 2].revenue
    revenueGrowth = previous > 0 ? ((current - previous) / previous) * 100 : 100
  }

  // Revenue by status
  const revenueByStatus = {
    draft: invoices.filter(inv => inv.status === 'draft').reduce((sum, inv) => sum + inv.total, 0),
    sent: invoices.filter(inv => inv.status === 'sent').reduce((sum, inv) => sum + inv.total, 0),
    viewed: invoices.filter(inv => inv.status === 'viewed').reduce((sum, inv) => sum + inv.total, 0),
    paid: invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.total, 0),
    overdue: invoices.filter(inv => {
      if (inv.status !== 'paid' && inv.dueDate) {
        const dueDate = parseISO(inv.dueDate)
        return dueDate < new Date()
      }
      return false
    }).reduce((sum, inv) => sum + inv.total, 0)
  }

  return {
    type: 'revenue',
    period: dateRange,
    timeSeries,
    growth: parseFloat(revenueGrowth.toFixed(2)),
    revenueByStatus,
    totalRevenue: invoices.reduce((sum, inv) => sum + inv.total, 0),
    totalInvoices: invoices.length,
    currency
  }
}

function generateExpensesReport(
  expenses: any[],
  dateRange: { start: Date; end: Date },
  currency: string
) {
  // Group by category
  const expensesByCategory = new Map()
  expenses.forEach(expense => {
    const category = expense.category
    const current = expensesByCategory.get(category) || { amount: 0, count: 0 }
    expensesByCategory.set(category, {
      amount: current.amount + expense.amount,
      count: current.count + 1
    })
  })

  const categoryBreakdown = Array.from(expensesByCategory.entries())
    .map(([category, data]) => ({
      category,
      amount: parseFloat(data.amount.toFixed(2)),
      count: data.count,
      percentage: parseFloat((data.amount / expenses.reduce((sum, exp) => sum + exp.amount, 0) * 100).toFixed(2))
    }))
    .sort((a, b) => b.amount - a.amount)

  // Time series data
  const isLongPeriod = (dateRange.end.getTime() - dateRange.start.getTime()) > 30 * 24 * 60 * 60 * 1000
  const timeFormat = isLongPeriod ? 'MMM yyyy' : 'MMM dd'

  const expensesByPeriod = new Map()
  expenses.forEach(expense => {
    const date = parseISO(expense.date)
    const periodKey = format(date, timeFormat)
    
    const current = expensesByPeriod.get(periodKey) || 0
    expensesByPeriod.set(periodKey, current + expense.amount)
  })

  const timeSeries = Array.from(expensesByPeriod.entries())
    .map(([period, amount]) => ({
      period,
      amount: parseFloat(amount.toFixed(2))
    }))
    .sort((a, b) => new Date(a.period).getTime() - new Date(b.period).getTime())

  // Calculate growth
  let expenseGrowth = 0
  if (timeSeries.length >= 2) {
    const current = timeSeries[timeSeries.length - 1].amount
    const previous = timeSeries[timeSeries.length - 2].amount
    expenseGrowth = previous > 0 ? ((current - previous) / previous) * 100 : 100
  }

  // Top expenses
  const topExpenses = expenses
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10)
    .map(expense => ({
      id: expense.id,
      description: expense.description,
      category: expense.category,
      amount: expense.amount,
      date: expense.date,
      vendor: expense.vendor || 'N/A'
    }))

  return {
    type: 'expenses',
    period: dateRange,
    totalExpenses: expenses.reduce((sum, exp) => sum + exp.amount, 0),
    totalCount: expenses.length,
    avgExpense: expenses.length > 0 ? expenses.reduce((sum, exp) => sum + exp.amount, 0) / expenses.length : 0,
    categoryBreakdown,
    timeSeries,
    growth: parseFloat(expenseGrowth.toFixed(2)),
    topExpenses,
    currency
  }
}

function generateProfitLossReport(
  invoices: any[],
  expenses: any[],
  dateRange: { start: Date; end: Date },
  currency: string
) {
  const revenue = invoices.reduce((sum, inv) => sum + inv.total, 0)
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0)
  const netProfit = revenue - totalExpenses
  const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0

  // Group by period
  const isLongPeriod = (dateRange.end.getTime() - dateRange.start.getTime()) > 30 * 24 * 60 * 60 * 1000
  const timeFormat = isLongPeriod ? 'MMM yyyy' : 'MMM dd'

  const profitByPeriod = new Map()
  const revenueByPeriod = new Map()
  const expensesByPeriod = new Map()

  // Aggregate revenue by period
  invoices.forEach(invoice => {
    const date = parseISO(invoice.issueDate)
    const periodKey = format(date, timeFormat)
    
    const current = revenueByPeriod.get(periodKey) || 0
    revenueByPeriod.set(periodKey, current + invoice.total)
  })

  // Aggregate expenses by period
  expenses.forEach(expense => {
    const date = parseISO(expense.date)
    const periodKey = format(date, timeFormat)
    
    const current = expensesByPeriod.get(periodKey) || 0
    expensesByPeriod.set(periodKey, current + expense.amount)
  })

  // Calculate profit by period
  const allPeriods = new Set([
    ...Array.from(revenueByPeriod.keys()),
    ...Array.from(expensesByPeriod.keys())
  ])

  const timeSeries = Array.from(allPeriods)
    .map(period => {
      const periodRevenue = revenueByPeriod.get(period) || 0
      const periodExpenses = expensesByPeriod.get(period) || 0
      const periodProfit = periodRevenue - periodExpenses
      const periodMargin = periodRevenue > 0 ? (periodProfit / periodRevenue) * 100 : 0

      return {
        period,
        revenue: parseFloat(periodRevenue.toFixed(2)),
        expenses: parseFloat(periodExpenses.toFixed(2)),
        profit: parseFloat(periodProfit.toFixed(2)),
        margin: parseFloat(periodMargin.toFixed(2))
      }
    })
    .sort((a, b) => new Date(a.period).getTime() - new Date(b.period).getTime())

  // Calculate profitability trends
  let profitGrowth = 0
  if (timeSeries.length >= 2) {
    const current = timeSeries[timeSeries.length - 1].profit
    const previous = timeSeries[timeSeries.length - 2].profit
    profitGrowth = previous !== 0 ? ((current - previous) / Math.abs(previous)) * 100 : (current > 0 ? 100 : -100)
  }

  // Expense to revenue ratio
  const expenseRatio = revenue > 0 ? (totalExpenses / revenue) * 100 : 0

  return {
    type: 'profit-loss',
    period: dateRange,
    summary: {
      revenue: parseFloat(revenue.toFixed(2)),
      expenses: parseFloat(totalExpenses.toFixed(2)),
      netProfit: parseFloat(netProfit.toFixed(2)),
      profitMargin: parseFloat(profitMargin.toFixed(2)),
      expenseRatio: parseFloat(expenseRatio.toFixed(2))
    },
    timeSeries,
    growth: parseFloat(profitGrowth.toFixed(2)),
    currency
  }
}

function generateClientReport(
  invoices: any[],
  dateRange: { start: Date; end: Date },
  currency: string
) {
  // Group invoices by client
  const clientInvoices = new Map()
  const clientStats = new Map()

  invoices.forEach(invoice => {
    const clientId = invoice.clientId
    
    if (!clientInvoices.has(clientId)) {
      clientInvoices.set(clientId, [])
      clientStats.set(clientId, {
        totalRevenue: 0,
        invoiceCount: 0,
        paidCount: 0,
        pendingCount: 0,
        overdueCount: 0,
        avgPaymentTime: 0,
        lastInvoiceDate: null
      })
    }

    clientInvoices.get(clientId).push(invoice)
    
    const stats = clientStats.get(clientId)
    stats.totalRevenue += invoice.total
    stats.invoiceCount += 1
    
    if (invoice.status === 'paid') {
      stats.paidCount += 1
    } else if (invoice.status === 'sent' || invoice.status === 'viewed') {
      stats.pendingCount += 1
    } else if (invoice.status !== 'draft') {
      // Check if overdue
      if (invoice.dueDate) {
        const dueDate = parseISO(invoice.dueDate)
        if (dueDate < new Date()) {
          stats.overdueCount += 1
        }
      }
    }

    const invoiceDate = parseISO(invoice.issueDate)
    if (!stats.lastInvoiceDate || invoiceDate > stats.lastInvoiceDate) {
      stats.lastInvoiceDate = invoiceDate
    }
  })

  // Convert to array and calculate additional metrics
  const clientReport = Array.from(clientStats.entries())
    .map(([clientId, stats]) => {
      const clientInvoicesList = clientInvoices.get(clientId) || []
      
      // Calculate average invoice value
      const avgInvoiceValue = stats.invoiceCount > 0 ? stats.totalRevenue / stats.invoiceCount : 0
      
      // Calculate collection rate
      const collectionRate = stats.invoiceCount > 0 ? (stats.paidCount / stats.invoiceCount) * 100 : 0
      
      // Calculate percentage of total revenue
      const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0)
      const revenuePercentage = totalRevenue > 0 ? (stats.totalRevenue / totalRevenue) * 100 : 0

      return {
        clientId,
        totalRevenue: parseFloat(stats.totalRevenue.toFixed(2)),
        invoiceCount: stats.invoiceCount,
        paidCount: stats.paidCount,
        pendingCount: stats.pendingCount,
        overdueCount: stats.overdueCount,
        avgInvoiceValue: parseFloat(avgInvoiceValue.toFixed(2)),
        collectionRate: parseFloat(collectionRate.toFixed(2)),
        revenuePercentage: parseFloat(revenuePercentage.toFixed(2)),
        lastInvoiceDate: stats.lastInvoiceDate ? format(stats.lastInvoiceDate, 'yyyy-MM-dd') : null
      }
    })
    .sort((a, b) => b.totalRevenue - a.totalRevenue)

  // Top clients by various metrics
  const topByRevenue = clientReport.slice(0, 5)
  const topByVolume = [...clientReport].sort((a, b) => b.invoiceCount - a.invoiceCount).slice(0, 5)
  const worstCollection = [...clientReport]
    .filter(client => client.invoiceCount >= 3) // Only clients with enough invoices
    .sort((a, b) => a.collectionRate - b.collectionRate)
    .slice(0, 5)

  return {
    type: 'client',
    period: dateRange,
    totalClients: clientReport.length,
    clientReport,
    topByRevenue,
    topByVolume,
    worstCollection,
    currency
  }
}

function generateTaxReport(
  invoices: any[],
  expenses: any[],
  dateRange: { start: Date; end: Date },
  currency: string
) {
  // Calculate taxable revenue (only paid invoices)
  const paidInvoices = invoices.filter(inv => inv.status === 'paid')
  const taxableRevenue = paidInvoices.reduce((sum, inv) => {
    // For tax purposes, we might want to consider only the taxable portion
    // This is a simplified version - in reality, tax calculations are more complex
    return sum + inv.total
  }, 0)

  // Calculate deductible expenses
  const deductibleExpenses = expenses.reduce((sum, exp) => {
    // Some expense categories might not be fully deductible
    // This is a simplified version
    return sum + exp.amount
  }, 0)

  const taxableIncome = taxableRevenue - deductibleExpenses

  // Group by tax category (simplified)
  const revenueByTaxCategory = {
    services: taxableRevenue, // Assuming all revenue is from services
    products: 0
  }

  const expensesByTaxCategory = expenses.reduce((acc, exp) => {
    const category = getTaxCategory(exp.category)
    acc[category] = (acc[category] || 0) + exp.amount
    return acc
  }, {} as Record<string, number>)

  // Calculate estimated taxes (simplified - using flat rates)
  const taxRates = {
    federal: 0.15, // 15% federal tax
    state: 0.05,   // 5% state tax
    selfEmployment: 0.153 // 15.3% self-employment tax
  }

  const estimatedTaxes = {
    federal: taxableIncome * taxRates.federal,
    state: taxableIncome * taxRates.state,
    selfEmployment: taxableIncome * taxRates.selfEmployment,
    total: taxableIncome * (taxRates.federal + taxRates.state + taxRates.selfEmployment)
  }

  // Quarterly breakdown
  const quarters = ['Q1', 'Q2', 'Q3', 'Q4']
  const quarterlyData = quarters.map(quarter => {
    // Simplified - in reality, you'd filter by actual quarter dates
    return {
      quarter,
      revenue: parseFloat((taxableRevenue / 4).toFixed(2)),
      expenses: parseFloat((deductibleExpenses / 4).toFixed(2)),
      taxableIncome: parseFloat((taxableIncome / 4).toFixed(2)),
      estimatedTax: parseFloat((estimatedTaxes.total / 4).toFixed(2))
    }
  })

  return {
    type: 'tax',
    period: dateRange,
    summary: {
      taxableRevenue: parseFloat(taxableRevenue.toFixed(2)),
      deductibleExpenses: parseFloat(deductibleExpenses.toFixed(2)),
      taxableIncome: parseFloat(taxableIncome.toFixed(2)),
      estimatedTaxLiability: parseFloat(estimatedTaxes.total.toFixed(2))
    },
    taxBreakdown: {
      federal: parseFloat(estimatedTaxes.federal.toFixed(2)),
      state: parseFloat(estimatedTaxes.state.toFixed(2)),
      selfEmployment: parseFloat(estimatedTaxes.selfEmployment.toFixed(2))
    },
    revenueByTaxCategory,
    expensesByTaxCategory,
    quarterlyData,
    currency,
    disclaimer: 'This is an estimated calculation for informational purposes only. Consult with a tax professional for accurate tax advice.'
  }
}

function getTaxCategory(expenseCategory: ExpenseCategory): string {
  // Map expense categories to tax categories
  switch (expenseCategory) {
    case 'office_supplies':
    case 'software':
    case 'equipment':
      return 'business_expenses'
    case 'travel':
    case 'meals':
      return 'travel_meals'
    case 'marketing':
    case 'advertising':
      return 'marketing'
    case 'professional_services':
      return 'professional_fees'
    case 'utilities':
    case 'rent':
      return 'office_costs'
    case 'insurance':
      return 'insurance'
    case 'taxes':
      return 'tax_payments'
    default:
      return 'other'
  }
}
```