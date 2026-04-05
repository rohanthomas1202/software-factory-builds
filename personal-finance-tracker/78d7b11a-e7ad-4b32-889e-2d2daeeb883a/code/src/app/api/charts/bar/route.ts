import { NextRequest, NextResponse } from 'next/server';
import { validateUserSession } from '@/lib/auth';
import { getTransactionsByUser } from '@/lib/store';
import { BarChartDataPoint } from '@/lib/types';

function getPreviousMonths(currentMonth: string, count: number): string[] {
  const months: string[] = [];
  const [year, month] = currentMonth.split('-').map(Number);
  
  for (let i = count - 1; i >= 0; i--) {
    let calcYear = year;
    let calcMonth = month - i;
    
    while (calcMonth < 1) {
      calcMonth += 12;
      calcYear -= 1;
    }
    while (calcMonth > 12) {
      calcMonth -= 12;
      calcYear += 1;
    }
    
    const monthStr = calcMonth.toString().padStart(2, '0');
    months.push(`${calcYear}-${monthStr}`);
  }
  
  return months;
}

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

    // Get reference month parameter (default to current month)
    const { searchParams } = new URL(request.url);
    const referenceMonth = searchParams.get('month') || 
      new Date().toISOString().slice(0, 7); // YYYY-MM

    // Validate month format (YYYY-MM)
    const monthRegex = /^\d{4}-\d{2}$/;
    if (!monthRegex.test(referenceMonth)) {
      return NextResponse.json(
        { error: 'Invalid month format. Use YYYY-MM' },
        { status: 400 }
      );
    }

    // Get trailing 6 months including reference month
    const months = getPreviousMonths(referenceMonth, 6);
    
    // Calculate income and expenses for each month
    const barData: BarChartDataPoint[] = await Promise.all(
      months.map(async (month) => {
        // Get transactions for this month
        const transactions = getTransactionsByUser(userId, { month });
        
        let incomeCents = 0;
        let expensesCents = 0;
        
        transactions.forEach(transaction => {
          if (transaction.type === 'INCOME') {
            incomeCents += transaction.amountCents;
          } else if (transaction.type === 'EXPENSE') {
            expensesCents += transaction.amountCents;
          }
        });
        
        return {
          month,
          income: incomeCents,
          expenses: expensesCents
        };
      })
    );

    return NextResponse.json({ data: barData });
  } catch (error) {
    console.error('Bar chart data error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';