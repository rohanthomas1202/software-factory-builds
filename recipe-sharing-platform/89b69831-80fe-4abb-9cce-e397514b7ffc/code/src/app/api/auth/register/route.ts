import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { RecipeStore } from '@/lib/store';
import { User } from '@/types';
import { createSession, setSessionCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, password, displayName } = body;

    // Validate required fields
    if (!username || !email || !password || !displayName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate username format (alphanumeric, underscores, hyphens)
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        { error: 'Username can only contain letters, numbers, underscores, and hyphens' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    const store = RecipeStore.getInstance();

    // Check if username already exists
    if (store.getUserByUsername(username)) {
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 409 }
      );
    }

    // Check if email already exists
    if (store.getUserByEmail(email)) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser: User = {
      id: crypto.randomUUID(),
      username,
      email,
      displayName,
      bio: '',
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      coverImageUrl: `https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80`,
      joinDate: new Date().toISOString(),
      followers: [],
      following: [],
      recipeCount: 0,
      savedRecipes: [],
      isAdmin: false,
    };

    // Store user with hashed password
    store.createUser(newUser, hashedPassword);

    // Create session
    const session = await createSession(newUser.id);

    // Set session cookie
    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          displayName: newUser.displayName,
          avatarUrl: newUser.avatarUrl,
          bio: newUser.bio,
          joinDate: newUser.joinDate,
          recipeCount: newUser.recipeCount,
          followers: newUser.followers.length,
          following: newUser.following.length,
          isAdmin: newUser.isAdmin,
        },
      },
      { status: 201 }
    );

    await setSessionCookie(response, session.id);

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}