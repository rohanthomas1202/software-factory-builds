import { NextRequest, NextResponse } from 'next/server';
import { logout } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await logout();

    const response = NextResponse.json(
      { message: 'Logout successful' },
      { status: 200 }
    );

    // Clear session cookie
    response.cookies.delete('session_id');

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await logout();

    const response = NextResponse.json(
      { message: 'Logout successful' },
      { status: 200 }
    );

    // Clear session cookie
    response.cookies.delete('session_id');

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}