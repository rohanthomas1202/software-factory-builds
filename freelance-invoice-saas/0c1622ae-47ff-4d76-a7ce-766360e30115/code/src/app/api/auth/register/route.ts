import { NextRequest } from 'next/server';
import { User } from '@/lib/types';
import { store } from '@/lib/store';
import { validateEmail, validatePassword, createUserSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return Response.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    if (!validateEmail(email)) {
      return Response.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      return Response.json(
        { error: passwordErrors.join(', ') },
        { status: 400 }
      );
    }

    const existingUser = store.users.find(u => u.email === email);
    if (existingUser) {
      return Response.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    const user: User = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email,
      name,
      password, // In production, this should be hashed
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    store.users.push(user);

    await createUserSession(user.id);

    return Response.json({
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}