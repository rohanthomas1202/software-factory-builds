import { NextRequest, NextResponse } from 'next/server';
import { createUser as createAuthUser, authenticateUser } from '@/lib/auth';
import { createSession } from '@/lib/session';
import { createCategory, getCategoriesByUser } from '@/lib/store';
import { ApiError } from '@/lib/types';

export async function POST(request: NextRequest): Promise<NextResponse<{ data: { userId: string } } | ApiError>> {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Invalid input format' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = authenticateUser(email, password);
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }

    // Create user (auth.ts handles password hashing)
    const user = createAuthUser(email, password);
    
    // Create default categories for the new user
    const defaultCategories = [
      { name: 'Food & Dining', color: '#3B82F6' },
      { name: 'Transportation', color: '#10B981' },
      { name: 'Shopping', color: '#8B5CF6' },
      { name: 'Entertainment', color: '#F59E0B' },
      { name: 'Bills & Utilities', color: '#EF4444' },
      { name: 'Healthcare', color: '#EC4899' },
      { name: 'Income', color: '#06B6D4' },
      { name: 'Other', color: '#6B7280' }
    ];

    defaultCategories.forEach(category => {
      createCategory({
        userId: user.id,
        name: category.name,
        color: category.color,
        createdAt: new Date()
      });
    });

    // Create session and set HTTP-only cookie
    const token = createSession(user.id);
    
    const response = NextResponse.json(
      { data: { userId: user.id } },
      { status: 201 }
    );

    // Set HttpOnly cookie with 7-day expiration (matches session expiration)
    response.cookies.set('session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
      path: '/',
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