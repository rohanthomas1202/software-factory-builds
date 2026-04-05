/**
 * Authentication utilities for KanbanFlow
 * Simple cookie-based session management
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { User, UserRole } from './types';
import { store } from './store';

// Session interface
export interface Session {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  expiresAt: Date;
}

// Cookie name for session
const SESSION_COOKIE_NAME = 'kanbanflow_session';
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Create a new session for a user
 */
export async function createSession(user: User): Promise<void> {
  const session: Session = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
  };

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: session.expiresAt,
    path: '/',
  });
}

/**
 * Get current session from cookies
 */
export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
    
    if (!sessionCookie?.value) {
      return null;
    }

    const session: Session = JSON.parse(sessionCookie.value);
    
    // Check if session is expired
    if (new Date(session.expiresAt) < new Date()) {
      await destroySession();
      return null;
    }

    return session;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

/**
 * Destroy current session
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession();
  if (!session) {
    return null;
  }

  return store.getUser(session.userId);
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return !!session;
}

/**
 * Require authentication - redirect to login if not authenticated
 */
export async function requireAuth(redirectTo: string = '/login'): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(redirectTo);
  }
  return user;
}

/**
 * Hash password (mock implementation for in-memory store)
 * In a real app, use bcrypt or similar
 */
export function hashPassword(password: string): string {
  // Simple mock hashing for demo purposes
  // In production, use: await bcrypt.hash(password, 10);
  return `mock_hash_${password}_${Date.now()}`;
}

/**
 * Verify password (mock implementation)
 */
export function verifyPassword(password: string, hashedPassword: string): boolean {
  // Simple mock verification for demo purposes
  // In production, use: await bcrypt.compare(password, hashedPassword);
  return hashedPassword.startsWith(`mock_hash_${password}_`);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  
  if (!/\d/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  
  return { valid: true };
}

/**
 * Generate a secure random token
 */
export function generateToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}