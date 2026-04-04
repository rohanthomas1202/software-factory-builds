```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { store } from '@/lib/store'
import { UpdateExpenseRequest, ExpenseCategory } from '@/types'

// GET /api/expenses/[id] - Get a specific expense
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const expense = await store.getExpenseById(params.id)

    if (!expense) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      )
    }

    // Check if expense belongs to the current user
    if (expense.userId !== session.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    return NextResponse.json({ expense })
  } catch (error) {
    console.error('Error fetching expense:', error)
    return NextResponse.json(
      { error: 'Failed to fetch expense' },
      { status: 500 }
    )
  }
}

// PUT /api/expenses/[id] - Update an expense
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const expense = await store.getExpenseById(params.id)

    if (!expense) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      )
    }

    // Check if expense belongs to the current user
    if (expense.userId !== session.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const updateData: UpdateExpenseRequest = {
      ...body,
      // Ensure date is properly formatted if provided
      date: body.date ? new Date(body.date).toISOString() : undefined,
      // Ensure amount is a number if provided
      amount: body.amount ? (typeof body.amount === 'string' ? parseFloat(body.amount) : body.amount) : undefined,
      // Ensure tax is a number or undefined if provided
      tax: body.tax !== undefined ? (typeof body.tax === 'string' ? parseFloat(body.tax) : body.tax) : undefined,
    }

    // Validate amount if provided
    if (updateData.amount !== undefined && updateData.amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      )
    }

    // Validate category if provided
    if (updateData.category) {
      const validCategories: ExpenseCategory[] = ['office', 'travel', 'software', 'hardware', 'marketing', 'professional', 'other']
      if (!validCategories.includes(updateData.category)) {
        return NextResponse.json(
          { error: 'Invalid expense category' },
          { status: 400 }
        )
      }
    }

    const updatedExpense = await store.updateExpense(params.id, updateData)

    return NextResponse.json({
      expense: updatedExpense,
      message: 'Expense updated successfully'
    })
  } catch (error) {
    console.error('Error updating expense:', error)
    return NextResponse.json(
      { error: 'Failed to update expense' },
      { status: 500 }
    )
  }
}

// DELETE /api/expenses/[id] - Delete an expense
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const expense = await store.getExpenseById(params.id)

    if (!expense) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      )
    }

    // Check if expense belongs to the current user
    if (expense.userId !== session.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    await store.deleteExpense(params.id)

    return NextResponse.json({
      message: 'Expense deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting expense:', error)
    return NextResponse.json(
      { error: 'Failed to delete expense' },
      { status: 500 }
    )
  }
}
```