import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail } from '@/lib/store';
import { authenticate, setSessionCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Use authenticate from auth.ts which handles verification
    const sessionToken = await authenticate(email, password);
    
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Get user to check if email is verified
    const user = findUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.emailVerified) {
      return NextResponse.json(
        { error: 'Please verify your email before logging in' },
        { status: 403 }
      );
    }

    // Set session cookie
    await setSessionCookie(sessionToken);

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json(
      { data: userWithoutPassword },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';