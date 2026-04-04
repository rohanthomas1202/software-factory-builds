```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { store } from '@/lib/store'
import { CreateExpenseRequest, ExpenseCategory } from '@/types'

// GET /api/expenses - Get all expenses for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') as ExpenseCategory | null
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    // Get all expenses for the user
    let expenses = await store.getExpensesByUserId(session.userId)

    // Apply filters
    if (category) {
      expenses = expenses.filter(expense => expense.category === category)
    }

    if (startDate) {
      const start = new Date(startDate)
      expenses = expenses.filter(expense => new Date(expense.date) >= start)
    }

    if (endDate) {
      const end = new Date(endDate)
      expenses = expenses.filter(expense => new Date(expense.date) <= end)
    }

    if (status) {
      expenses = expenses.filter(expense => expense.status === status)
    }

    if (search) {
      const searchLower = search.toLowerCase()
      expenses = expenses.filter(expense =>
        expense.description.toLowerCase().includes(searchLower) ||
        expense.vendor?.toLowerCase().includes(searchLower) ||
        expense.receiptNumber?.toLowerCase().includes(searchLower)
      )
    }

    // Sort by date (newest first)
    expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return NextResponse.json({ expenses })
  } catch (error) {
    console.error('Error fetching expenses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch expenses' },
      { status: 500 }
    )
  }
}

// POST /api/expenses - Create a new expense
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const expenseData: CreateExpenseRequest = {
      ...body,
      userId: session.userId,
      // Ensure date is properly formatted
      date: body.date ? new Date(body.date).toISOString() : new Date().toISOString(),
      // Ensure amount is a number
      amount: typeof body.amount === 'string' ? parseFloat(body.amount) : body.amount,
      // Ensure tax is a number or undefined
      tax: body.tax ? (typeof body.tax === 'string' ? parseFloat(body.tax) : body.tax) : undefined,
    }

    // Validate required fields
    if (!expenseData.description || !expenseData.amount || !expenseData.category) {
      return NextResponse.json(
        { error: 'Description, amount, and category are required' },
        { status: 400 }
      )
    }

    // Validate amount
    if (expenseData.amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      )
    }

    // Validate category
    const validCategories: ExpenseCategory[] = ['office', 'travel', 'software', 'hardware', 'marketing', 'professional', 'other']
    if (!validCategories.includes(expenseData.category)) {
      return NextResponse.json(
        { error: 'Invalid expense category' },
        { status: 400 }
      )
    }

    // Create the expense
    const expense = await store.createExpense(expenseData)

    return NextResponse.json(
      { expense, message: 'Expense created successfully' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating expense:', error)
    return NextResponse.json(
      { error: 'Failed to create expense' },
      { status: 500 }
    )
  }
}
```