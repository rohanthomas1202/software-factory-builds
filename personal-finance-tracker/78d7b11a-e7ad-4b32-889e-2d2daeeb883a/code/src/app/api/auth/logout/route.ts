import { NextRequest, NextResponse } from 'next/server';
import { verifySession, clearSession } from '@/lib/session';
import { ApiError } from '@/lib/types';

export async function POST(request: NextRequest): Promise<NextResponse<{ data: { success: boolean } } | ApiError>> {
  try {
    // Get token from cookie
    const token = request.cookies.get('session_token')?.value;
    
    if (!token) {
      // Already logged out, but return success
      return NextResponse.json(
        { data: { success: true } },
        { status: 200 }
      );
    }

    // Verify and clear session
    const userId = verifySession(token);
    if (userId) {
      clearSession(token);
    }

    // Clear the cookie
    const response = NextResponse.json(
      { data: { success: true } },
      { status: 200 }
    );

    response.cookies.delete('session_token');

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}