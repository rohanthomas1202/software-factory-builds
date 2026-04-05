import { NextRequest, NextResponse } from 'next/server';
import { validateUserSession } from '@/lib/auth';
import { getTransactionsByUser } from '@/lib/store';
import { getCategoriesByUser } from '@/lib/store';
import { PieChartDataPoint } from '@/lib/types';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Validate user session
    const token = request.cookies.get('session_token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const userId = validateUserSession(token);
    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      );
    }

    // Get month parameter (default to current month)
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || 
      new Date().toISOString().slice(0, 7); // YYYY-MM

    // Validate month format (YYYY-MM)
    const monthRegex = /^\d{4}-\d{2}$/;
    if (!monthRegex.test(month)) {
      return NextResponse.json(
        { error: 'Invalid month format. Use YYYY-MM' },
        { status: 400 }
      );
    }

    // Get all categories for the user
    const categories = getCategoriesByUser(userId);
    
    // Get transactions for the specified month
    const transactions = getTransactionsByUser(userId, { month });
    
    // Filter expense transactions and group by category
    const categorySpending: Record<string, { spentCents: number; name: string; color: string }> = {};
    
    // Initialize with all categories
    categories.forEach(category => {
      categorySpending[category.id] = {
        spentCents: 0,
        name: category.name,
        color: category.color
      };
    });
    
    // Aggregate spending
    transactions.forEach(transaction => {
      if (transaction.type === 'EXPENSE' && categorySpending[transaction.categoryId]) {
        categorySpending[transaction.categoryId].spentCents += transaction.amountCents;
      }
    });
    
    // Convert to PieChartDataPoint format, excluding zero-spend categories
    const pieData: PieChartDataPoint[] = Object.entries(categorySpending)
      .filter(([_, data]) => data.spentCents > 0)
      .map(([_, data]) => ({
        name: data.name,
        value: data.spentCents,
        color: data.color
      }))
      .sort((a, b) => b.value - a.value); // Sort by highest spending first

    return NextResponse.json({ data: pieData });
  } catch (error) {
    console.error('Pie chart data error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';