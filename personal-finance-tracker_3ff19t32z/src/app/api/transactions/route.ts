import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/session';
import { createTransaction, getTransactionsByUser, getCategoryById } from '@/lib/store';
import { checkBudgetWarning } from '@/lib/budgetUtils';
import type { Transaction } from '@/lib/types';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const token = request.cookies.get('session')?.value;
    const userId = token ? verifySession(token) : null;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const yearMonth = searchParams.get('year_month');
    const categoryId = searchParams.get('category_id');

    const transactions = getTransactionsByUser(userId, {
      month: yearMonth || undefined,
      categoryId: categoryId || undefined
    });

    return NextResponse.json({ data: transactions });
  } catch (error) {
    console.error('GET /api/transactions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const token = request.cookies.get('session')?.value;
    const userId = token ? verifySession(token) : null;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate required fields
    const { amountCents, date, categoryId, type, notes } = body;
    
    if (!amountCents || typeof amountCents !== 'number' || amountCents <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      );
    }
    
    if (!date || typeof date !== 'string') {
      return NextResponse.json(
        { error: 'Date is required' },
        { status: 400 }
      );
    }
    
    if (!categoryId || typeof categoryId !== 'string') {
      return NextResponse.json(
        { error: 'Category is required' },
        { status: 400 }
      );
    }
    
    if (!type || (type !== 'INCOME' && type !== 'EXPENSE')) {
      return NextResponse.json(
        { error: 'Type must be INCOME or EXPENSE' },
        { status: 400 }
      );
    }
    
    // Validate category ownership
    const category = getCategoryById(categoryId);
    if (!category || category.userId !== userId) {
      return NextResponse.json(
        { error: 'Category not found or does not belong to user' },
        { status: 404 }
      );
    }
    
    // Extract year-month for budget calculations (YYYY-MM format)
    const month = date.substring(0, 7);
    
    // Check budget warning for expenses
    let warning = null;
    if (type === 'EXPENSE') {
      warning = checkBudgetWarning(userId, categoryId, month, amountCents);
    }
    
    // Create transaction
    const transaction = createTransaction({
      userId,
      amountCents,
      date,
      categoryId,
      type,
      notes: notes || ''
    });
    
    return NextResponse.json(
      { 
        data: transaction,
        warning: warning
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/transactions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}