import { NextRequest, NextResponse } from 'next/server';
import { login, getSessionCookieOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const { user, session } = await login(email, password);

    const response = NextResponse.json(
      { 
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          role: user.role,
        },
        message: 'Login successful'
      },
      { status: 200 }
    );

    // Set session cookie
    response.cookies.set({
      name: 'session_id',
      value: session.id,
      ...getSessionCookieOptions(),
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Authentication failed' },
      { status: 401 }
    );
  }
}