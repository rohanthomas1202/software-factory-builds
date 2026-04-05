import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { User, Session } from './types';
import { store, getSessionByToken, deleteSession, createSession } from './store';

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): string[] {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return errors;
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session_token')?.value;
  
  if (!sessionToken) {
    return null;
  }
  
  const session = getSessionByToken(sessionToken);
  
  if (!session || session.expiresAt < new Date()) {
    return null;
  }
  
  const user = store.users.find(u => u.id === session.userId);
  return user || null;
}

export async function createUserSession(userId: string): Promise<Session> {
  const session = createSession(userId, 24); // 24 hours
  const cookieStore = await cookies();
  
  cookieStore.set('session_token', session.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60, // 24 hours in seconds
    path: '/',
  });
  
  return session;
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session_token')?.value;
  
  if (sessionToken) {
    deleteSession(sessionToken);
  }
  
  cookieStore.delete('session_token');
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }
  
  return user;
}

export async function requireGuest(): Promise<void> {
  const user = await getCurrentUser();
  
  if (user) {
    redirect('/dashboard');
  }
}