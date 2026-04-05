import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/session';
import { getCategoryById, updateTransaction, deleteCategory, getTransactionsByUser, getMonthlyBudgetsByUser, createOrUpdateMonthlyBudget, deleteMonthlyBudget } from '@/lib/store';
import { Category, MonthlyBudget, Transaction } from '@/lib/types';

interface ReassignRequest {
  targetCategoryId: string;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    // 1. Authentication check
    const token = request.cookies.get('session_token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const userId = verifySession(token);
    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      );
    }

    // 2. Validate source category
    const sourceCategoryId = params.id;
    const sourceCategory = getCategoryById(sourceCategoryId);
    
    if (!sourceCategory) {
      return NextResponse.json(
        { error: 'Source category not found' },
        { status: 404 }
      );
    }

    if (sourceCategory.userId !== userId) {
      return NextResponse.json(
        { error: 'Source category does not belong to user' },
        { status: 403 }
      );
    }

    // 3. Validate target category
    const body = await request.json() as ReassignRequest;
    const { targetCategoryId } = body;

    if (!targetCategoryId) {
      return NextResponse.json(
        { error: 'targetCategoryId is required' },
        { status: 400 }
      );
    }

    if (sourceCategoryId === targetCategoryId) {
      return NextResponse.json(
        { error: 'Source and target categories must be different' },
        { status: 400 }
      );
    }

    const targetCategory = getCategoryById(targetCategoryId);
    if (!targetCategory) {
      return NextResponse.json(
        { error: 'Target category not found' },
        { status: 404 }
      );
    }

    if (targetCategory.userId !== userId) {
      return NextResponse.json(
        { error: 'Target category does not belong to user' },
        { status: 403 }
      );
    }

    // 4. Update all transactions' category_id
    const userTransactions = getTransactionsByUser(userId);
    const transactionsToUpdate = userTransactions.filter(
      (t: Transaction) => t.categoryId === sourceCategoryId
    );

    for (const transaction of transactionsToUpdate) {
      updateTransaction(transaction.id, { categoryId: targetCategoryId });
    }

    // 5. Update MonthlyBudgetSummary rows
    const userBudgets = getMonthlyBudgetsByUser(userId);
    const budgetsToUpdate = userBudgets.filter(
      (b: MonthlyBudget) => b.categoryId === sourceCategoryId
    );

    for (const sourceBudget of budgetsToUpdate) {
      // Check if target already has a budget for this month
      const existingTargetBudget = userBudgets.find(
        (b: MonthlyBudget) => b.categoryId === targetCategoryId && b.month === sourceBudget.month
      );

      if (existingTargetBudget) {
        // Merge limits: add source limit to target limit
        createOrUpdateMonthlyBudget({
          userId,
          categoryId: targetCategoryId,
          month: sourceBudget.month,
          limitCents: existingTargetBudget.limitCents + sourceBudget.limitCents
        });
      } else {
        // Create new budget for target category with source's limit
        createOrUpdateMonthlyBudget({
          userId,
          categoryId: targetCategoryId,
          month: sourceBudget.month,
          limitCents: sourceBudget.limitCents
        });
      }

      // Delete the source budget
      deleteMonthlyBudget(sourceBudget.id);
    }

    // 6. Delete source category
    const deleted = deleteCategory(sourceCategoryId);
    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete source category' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        data: { 
          message: `Successfully reassigned ${transactionsToUpdate.length} transactions and deleted source category`,
          reassignedTransactions: transactionsToUpdate.length
        } 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Reassign category error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}