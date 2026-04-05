import { NextRequest } from 'next/server';
import { store } from '@/lib/store';
import { validateEmail, createUserSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return Response.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (!validateEmail(email)) {
      return Response.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const user = store.users.find(u => u.email === email);
    
    if (!user) {
      return Response.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // In production, compare hashed passwords
    if (user.password !== password) {
      return Response.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    await createUserSession(user.id);

    return Response.json({
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}