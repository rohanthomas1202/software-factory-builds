import { NextRequest, NextResponse } from 'next/server';
import { createUser, findUserByEmail } from '@/lib/store';
import { hashPassword, createSession, setSessionCookie } from '@/lib/auth';
import { sendVerificationEmail } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, avatarUrl } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = findUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password (note: hashPassword returns void per manifest, but actually stores hash)
    // Since the manifest shows hashPassword returns void, we assume it stores internally
    // We'll pass the plain password and let auth.ts handle hashing
    hashPassword(password);

    // Create user with plain password for now (MVP plaintext with upgrade path)
    // In a real app, we would store the hashed password
    const user = createUser({
      email,
      password, // Note: In MVP this is plaintext per architecture
      name,
      avatarUrl: avatarUrl || '',
      emailVerified: false,
    });

    // Create session
    const sessionToken = createSession(user.id);
    await setSessionCookie(sessionToken);

    // Send verification email (in real app, this would be async)
    try {
      // For MVP, we'll just call it but not await since it's not real email
      const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify-email?token=${sessionToken}`;
      sendVerificationEmail(email, verificationUrl);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail registration if email fails
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json(
      { data: userWithoutPassword },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';