import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { RecipeStore } from '@/lib/store';
import { createSession, setSessionCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { usernameOrEmail, password } = body;

    // Validate required fields
    if (!usernameOrEmail || !password) {
      return NextResponse.json(
        { error: 'Username/email and password are required' },
        { status: 400 }
      );
    }

    const store = RecipeStore.getInstance();

    // Find user by username or email
    let user = store.getUserByUsername(usernameOrEmail);
    if (!user) {
      user = store.getUserByEmail(usernameOrEmail);
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await store.verifyPassword(user.id, password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Create session
    const session = await createSession(user.id);

    // Set session cookie
    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          bio: user.bio,
          joinDate: user.joinDate,
          recipeCount: user.recipeCount,
          followers: user.followers.length,
          following: user.following.length,
          isAdmin: user.isAdmin,
        },
      },
      { status: 200 }
    );

    await setSessionCookie(response, session.id);

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}