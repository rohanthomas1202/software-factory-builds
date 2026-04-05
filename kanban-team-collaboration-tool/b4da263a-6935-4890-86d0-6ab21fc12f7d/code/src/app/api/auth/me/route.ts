import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Return user without sensitive data
    const { id, email, name, avatar, role, createdAt } = user;
    
    return NextResponse.json(
      { 
        user: {
          id,
          email,
          name,
          avatar,
          role,
          createdAt,
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get current user error:', error);
    
    return NextResponse.json(
      { error: 'Failed to get user information' },
      { status: 500 }
    );
  }
}