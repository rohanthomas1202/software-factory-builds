import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUserByEmail } from '@/lib/store';
import { hashPassword } from '@/lib/utils/password';
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
    const { email, password, timezone } = body;
    
    if (!email || !password || !timezone) {
      return NextResponse.json(
        { error: 'Email, password, and timezone are required' },
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
    
    // Validate password strength
    if (!isValidPassword(password)) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }
    
    // Validate timezone
    if (!isValidTimezone(timezone)) {
      return NextResponse.json(
        { error: 'Invalid timezone' },
        { status: 400 }
      );
    }
    
    // Check if user already exists
    const existingUser = getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }
    
    // Hash password
    const passwordHash = await hashPassword(password);
    
    // Create user
    const user = createUser({
      email,
      passwordHash,
      timezone,
      createdAt: new Date()
    });
    
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
    }, { status: 201 });
    
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
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}