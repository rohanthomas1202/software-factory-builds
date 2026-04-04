import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { store } from './store';
import { User } from '@/types';

// Session cookie name
const SESSION_COOKIE_NAME = 'invoiceflow_session';

// Session duration (7 days)
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export interface Session {
  userId: string;
  email: string;
  expiresAt: Date;
}

/**
 * Create a new session for a user
 */
export async function createSession(userId: string, email: string): Promise<string> {
  const sessionId = await store.createSession(userId, email);
  
  // Set session cookie
  const cookieStore = await cookies();
  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: sessionId,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
  
  return sessionId;
}

/**
 * Get the current session from cookies
 */
export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    
    if (!sessionId) {
      return null;
    }
    
    const session = await store.getSession(sessionId);
    
    if (!session || new Date(session.expiresAt) < new Date()) {
      // Session expired or invalid
      await deleteSession(sessionId);
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

/**
 * Get the current authenticated user
 */
export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession();
  
  if (!session) {
    return null;
  }
  
  return await store.getUserById(session.userId);
}

/**
 * Delete a session (logout)
 */
export async function deleteSession(sessionId?: string): Promise<void> {
  const cookieStore = await cookies();
  
  if (!sessionId) {
    sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  }
  
  if (sessionId) {
    await store.deleteSession(sessionId);
  }
  
  // Clear the session cookie
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Require authentication for a page
 * Redirects to login if not authenticated
 */
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }
  
  return user;
}

/**
 * Redirect authenticated users away from auth pages
 */
export async function redirectIfAuthenticated(): Promise<void> {
  const user = await getCurrentUser();
  
  if (user) {
    redirect('/dashboard');
  }
}

/**
 * Verify user credentials
 */
export async function verifyCredentials(email: string, password: string): Promise<User | null> {
  return await store.verifyUserCredentials(email, password);
}

/**
 * Create a new user account
 */
export async function createUser(
  email: string,
  password: string,
  name: string,
  businessName?: string
): Promise<User> {
  return await store.createUser(email, password, name, businessName);
}

/**
 * Update user session expiration
 */
export async function refreshSession(sessionId: string): Promise<void> {
  await store.refreshSession(sessionId);
}