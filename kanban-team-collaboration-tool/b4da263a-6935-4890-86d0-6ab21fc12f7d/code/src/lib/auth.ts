import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { InMemoryStore } from './store';
import { User, Session } from './types';

const store = InMemoryStore.getInstance();

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session_id')?.value;
  
  if (!sessionId) {
    return null;
  }
  
  const session = store.getSession(sessionId);
  
  if (!session || session.expiresAt < new Date()) {
    // Clear expired session
    if (session) {
      store.deleteSession(sessionId);
    }
    return null;
  }
  
  const user = store.getUser(session.userId);
  return user || null;
}

export async function login(email: string, password: string): Promise<{ user: User; session: Session }> {
  // For demo purposes, accept any password for existing users
  const user = store.getUserByEmail(email);
  
  if (!user) {
    throw new Error('Invalid email or password');
  }
  
  // In a real app, you would verify the password hash here
  // For demo: accept any non-empty password
  if (!password || password.trim().length === 0) {
    throw new Error('Password is required');
  }
  
  const session = store.createSession(user.id);
  return { user, session };
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session_id')?.value;
  
  if (sessionId) {
    store.deleteSession(sessionId);
  }
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 1 week
  };
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }
  
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireAuth();
  
  if (user.role !== 'admin') {
    redirect('/dashboard');
  }
  
  return user;
}