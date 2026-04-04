```typescript
import React from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { Plus, Filter, Download, Search, TrendingUp, TrendingDown, MoreVertical, Eye, Edit, Trash2, Receipt } from 'lucide-react'
import { getSession } from '@/lib/auth'
import { store } from '@/lib/store'
import PageHeader from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/utils'
import { ExpenseCategory } from '@/types'

export const metadata = {
  title: 'Expenses - InvoiceFlow',
  description: 'Manage your business expenses',
}

export default async function ExpensesPage() {
  const session = await getSession()
  
  if (!session) {
    redirect('/login')
  }

  // Get expenses for the current user
  const expenses = await store.getExpensesByUserId(session.userId)
  
  // Calculate totals
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const pendingExpenses = expenses.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0)
  const paidExpenses = expenses.filter(e => e.status === 'paid').reduce((sum, e) => sum + e.amount, 0)
  
  // Get category totals
  const categoryTotals = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount
    return acc
  }, {} as Record<ExpenseCategory, number>)

  // Get most recent expenses (last 10)
  const recentExpenses = expenses.slice(0, 10)

  const getCategoryColor = (category: ExpenseCategory) => {
    const colors: Record<ExpenseCategory, string> = {
      office: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      travel: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      software: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      hardware: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      marketing: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
      professional: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
      other: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    }
    return colors[category]
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 'reimbursed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  const getCategoryLabel = (category: ExpenseCategory) => {
    const labels: Record<ExpenseCategory, string> = {
      office: 'Office Supplies',
      travel: 'Travel & Transportation',
      software: 'Software & Subscriptions',
      hardware: 'Hardware & Equipment',
      marketing: 'Marketing & Advertising',
      professional: 'Professional Services',
      other: 'Other Expenses',
    }
    return labels[category]
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expenses"
        description="Track and manage your business expenses"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Expenses', href: '/expenses' },
        ]}
      >
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Link href="/expenses/new">
            <Button className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </Link>
        </div>
      </PageHeader>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(totalExpenses, 'USD')}</div>
            <div className="flex items-center text-sm text-muted-foreground mt-2">
              <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
              <span>Across all categories</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(pendingExpenses, 'USD')}</div>
            <div className="flex items-center text-sm text-muted-foreground mt-2">
              <Clock className="h-4 w-4 mr-1 text-yellow-500" />
              <span>Awaiting payment</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Paid Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(paidExpenses, 'USD')}</div>
            <div className="flex items-center text-sm text-muted-foreground mt-2">
              <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
              <span>Successfully processed</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Expenses by Category</CardTitle>
          <CardDescription>Breakdown of your expenses across different categories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(categoryTotals).map(([category, amount]) => (
              <div key={category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{getCategoryLabel(category as ExpenseCategory)}</span>
                  <Badge className={getCategoryColor(category as ExpenseCategory)}>
                    {category}
                  </Badge>
                </div>
                <div className="text-2xl font-bold">{formatCurrency(amount, 'USD')}</div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full" 
                    style={{ width: `${(amount / totalExpenses) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Expenses Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Expenses</CardTitle>
              <CardDescription>Your most recent business expenses</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search expenses..."
                  className="pl-9 w-64"
                />
              </div>
              <Select
                options={[
                  { value: 'all', label: 'All Categories' },
                  { value: 'office', label: 'Office Supplies' },
                  { value: 'travel', label: 'Travel' },
                  { value: 'software', label: 'Software' },
                  { value: 'hardware', label: 'Hardware' },
                ]}
                defaultValue="all"
                className="w-40"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentExpenses.length > 0 ? (
                recentExpenses.map((expense) => (
                  <TableRow key={expense.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      {format(new Date(expense.date), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{expense.description}</div>
                      {expense.receiptNumber && (
                        <div className="text-sm text-muted-foreground">
                          Receipt: {expense.receiptNumber}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getCategoryColor(expense.category)}>
                        {getCategoryLabel(expense.category)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {expense.vendor || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(expense.status)}>
                        {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {formatCurrency(expense.amount, 'USD')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/expenses/${expense.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/expenses/${expense.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Receipt className="h-12 w-12 text-muted-foreground" />
                      <div className="text-lg font-medium">No expenses yet</div>
                      <p className="text-muted-foreground max-w-md text-center">
                        Start tracking your business expenses to better manage your finances
                      </p>
                      <Link href="/expenses/new">
                        <Button className="mt-4">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Your First Expense
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
```