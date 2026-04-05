import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import {
  getCategoriesByUserId,
  getTransactionsByUserId,
} from '@/lib/store';
import {
  getCurrentMonthInTimezone,
  getTransactionsForMonth,
  computeDashboardAggregates,
} from '@/lib/aggregates';

export async function GET(request: NextRequest) {
  try {
    // 1. Get current session/user
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Get user's categories
    const categories = getCategoriesByUserId(session.userId);

    // 3. Get all user transactions
    const allTransactions = getTransactionsByUserId(session.userId);

    // 4. Get current month in user's timezone
    const { year, month } = getCurrentMonthInTimezone(session.timezone);

    // 5. Filter transactions for current month
    const monthlyTransactions = getTransactionsForMonth(
      allTransactions,
      year,
      month,
      session.timezone
    );

    // 6. Compute aggregates
    const aggregates = computeDashboardAggregates(monthlyTransactions, categories);

    // 7. Return data
    return NextResponse.json({
      data: {
        ...aggregates,
        currentMonth: { year, month },
      },
    });
  } catch (error) {
    console.error('Dashboard summary error:', error);
    return NextResponse.json(
      { error: 'Failed to load dashboard data' },
      { status: 500 }
    );
  }
}