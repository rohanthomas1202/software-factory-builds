import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/session';
import { 
  getTransactionById, 
  updateTransaction, 
  deleteTransaction,
  getCategoryById
} from '@/lib/store';
import { checkBudgetWarning } from '@/lib/budgetUtils';
import type { Transaction } from '@/lib/types';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const token = request.cookies.get('session')?.value;
    const userId = token ? verifySession(token) : null;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const transaction = getTransactionById(id);
    
    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }
    
    if (transaction.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const updates: Partial<Omit<Transaction, 'id' | 'userId' | 'createdAt'>> = {};
    
    // Validate and apply updates
    if (body.amountCents !== undefined) {
      if (typeof body.amountCents !== 'number' || body.amountCents <= 0) {
        return NextResponse.json(
          { error: 'Amount must be a positive number' },
          { status: 400 }
        );
      }
      updates.amountCents = body.amountCents;
    }
    
    if (body.date !== undefined) {
      if (typeof body.date !== 'string') {
        return NextResponse.json(
          { error: 'Date must be a string' },
          { status: 400 }
        );
      }
      updates.date = body.date;
    }
    
    if (body.categoryId !== undefined) {
      if (typeof body.categoryId !== 'string') {
        return NextResponse.json(
          { error: 'Category ID must be a string' },
          { status: 400 }
        );
      }
      
      // Validate category ownership
      const category = getCategoryById(body.categoryId);
      if (!category || category.userId !== userId) {
        return NextResponse.json(
          { error: 'Category not found or does not belong to user' },
          { status: 404 }
        );
      }
      updates.categoryId = body.categoryId;
    }
    
    if (body.type !== undefined) {
      if (body.type !== 'INCOME' && body.type !== 'EXPENSE') {
        return NextResponse.json(
          { error: 'Type must be INCOME or EXPENSE' },
          { status: 400 }
        );
      }
      updates.type = body.type;
    }
    
    if (body.notes !== undefined) {
      updates.notes = typeof body.notes === 'string' ? body.notes : String(body.notes);
    }
    
    // Check budget warning for expense updates
    let warning = null;
    if ((updates.type === 'EXPENSE' || transaction.type === 'EXPENSE') && 
        (updates.amountCents !== undefined || updates.categoryId !== undefined || updates.date !== undefined)) {
      
      const month = updates.date ? updates.date.substring(0, 7) : transaction.date.substring(0, 7);
      const categoryId = updates.categoryId || transaction.categoryId;
      const amountChange = updates.amountCents !== undefined 
        ? updates.amountCents - transaction.amountCents
        : 0;
      
      warning = checkBudgetWarning(userId, categoryId, month, amountChange);
    }
    
    const updated = updateTransaction(id, updates);
    
    if (!updated) {
      return NextResponse.json(
        { error: 'Failed to update transaction' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      data: updated,
      warning: warning
    });
  } catch (error) {
    console.error('PATCH /api/transactions/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const token = request.cookies.get('session')?.value;
    const userId = token ? verifySession(token) : null;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const transaction = getTransactionById(id);
    
    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }
    
    if (transaction.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    const success = deleteTransaction(id);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete transaction' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      data: { id },
      message: 'Transaction deleted successfully'
    });
  } catch (error) {
    console.error('DELETE /api/transactions/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}