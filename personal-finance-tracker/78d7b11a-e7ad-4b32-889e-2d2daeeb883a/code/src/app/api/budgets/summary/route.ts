import { NextRequest, NextResponse } from 'next/server';
import { validateUserSession } from '@/lib/auth';
import { calculateBudgetSummaries } from '@/lib/budgetUtils';
import { isApiError } from '@/lib/types';

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

    // Calculate budget summaries
    const summaries = calculateBudgetSummaries(userId, month);

    return NextResponse.json({ data: summaries });
  } catch (error) {
    console.error('Budget summary error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Note: This is a GET endpoint, so we don't need other HTTP methods
export const dynamic = 'force-dynamic';