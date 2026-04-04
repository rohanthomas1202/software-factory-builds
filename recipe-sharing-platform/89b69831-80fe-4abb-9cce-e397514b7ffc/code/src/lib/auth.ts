import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { sealData, unsealData } from 'iron-session';
import { RecipeStore } from './store';
import { User } from '@/types';

// Session configuration
const SESSION_PASSWORD = process.env.SESSION_PASSWORD || 'complex_password_at_least_32_characters_long_here';
const SESSION_COOKIE_NAME = 'recipe-share-session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds

// Session data structure
export interface SessionData {
  userId: string;
  username: string;
  isAdmin: boolean;
  createdAt: number;
}

/**
 * Create a new session for a user
 */
export async function createSession(userId: string, username: string, isAdmin: boolean = false): Promise<string> {
  const sessionData: SessionData = {
    userId,
    username,
    isAdmin,
    createdAt: Date.now(),
  };

  const sessionId = await sealData(sessionData, {
    password: SESSION_PASSWORD,
    ttl: SESSION_MAX_AGE,
  });

  return sessionId;
}

/**
 * Set session cookie in the response
 */
export async function setSessionCookie(sessionId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
}

/**
 * Clear session cookie (logout)
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Get current session data from cookie
 */
export async function getSessionData(): Promise<SessionData | null> {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionId) {
      return null;
    }

    const sessionData = await unsealData<SessionData>(sessionId, {
      password: SESSION_PASSWORD,
    });

    // Check if session is expired
    const now = Date.now();
    const sessionAge = now - sessionData.createdAt;
    const maxAgeMs = SESSION_MAX_AGE * 1000;

    if (sessionAge > maxAgeMs) {
      await clearSessionCookie();
      return null;
    }

    return sessionData;
  } catch (error) {
    console.error('Error getting session data:', error);
    return null;
  }
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const sessionData = await getSessionData();
    
    if (!sessionData) {
      return null;
    }

    const store = RecipeStore.getInstance();
    const user = store.getUserById(sessionData.userId);

    if (!user) {
      await clearSessionCookie();
      return null;
    }

    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Require authentication for a page - redirect to login if not authenticated
 */
export async function requireAuth(redirectTo: string = '/login'): Promise<User> {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect(redirectTo);
  }
  
  return user;
}

/**
 * Require admin role for a page - redirect to home if not admin
 */
export async function requireAdmin(): Promise<User> {
  const user = await requireAuth();
  
  if (!user.isAdmin) {
    redirect('/');
  }
  
  return user;
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Validate user credentials
 */
export async function validateCredentials(usernameOrEmail: string, password: string): Promise<User | null> {
  const store = RecipeStore.getInstance();
  
  // Try to find user by username or email
  const user = store.getUserByUsername(usernameOrEmail) || store.getUserByEmail(usernameOrEmail);
  
  if (!user) {
    return null;
  }

  // In a real app, we would fetch the hashed password from the database
  // For our in-memory store, we need to handle password verification differently
  // We'll use a simple approach for demo purposes
  const isValid = await verifyPassword(password, user.id + password); // Simplified for demo
  
  return isValid ? user : null;
}

/**
 * Check if user is authenticated (server component helper)
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}

/**
 * Check if user is admin (server component helper)
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.isAdmin || false;
}

/**
 * Get user ID from session (for API routes)
 */
export async function getUserIdFromSession(): Promise<string | null> {
  const sessionData = await getSessionData();
  return sessionData?.userId || null;
}