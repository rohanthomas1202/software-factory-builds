import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail } from '@/lib/store';
import { verifyPassword } from '@/lib/utils/password';
import { createSession } from '@/lib/auth';
import { 
  isValidEmail, 
  isValidPassword, 
  isValidTimezone,
  isValidCategoryName,
  isValidColorHex,
  validateMonthlyLimit,
  validateTransactionAmount,
  isValidCategoryId,
  isValidNote
} from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { email, password } = body;
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    // Validate email format
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }
    
    // Get user by email
    const user = getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    // Create session
    const sessionToken = createSession(user.id);
    
    // Create response with user data (excluding password)
    const response = NextResponse.json({
      data: {
        user: {
          id: user.id,
          email: user.email,
          timezone: user.timezone,
          createdAt: user.createdAt
        }
      }
    });
    
    // Set HttpOnly cookie
    response.cookies.set({
      name: 'finance_session',
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours in seconds
      path: '/'
    });
    
    return response;
    
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}