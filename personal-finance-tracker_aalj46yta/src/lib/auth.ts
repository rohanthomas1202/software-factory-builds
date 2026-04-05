import { User, Session } from './types';
import { getUserById } from './store';

// Session data stored in memory
interface SessionData {
  userId: string;
  expiresAt: Date;
}

// In-memory session store
const sessions = new Map<string, SessionData>();

const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export function createSession(userId: string): string {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  
  sessions.set(token, { userId, expiresAt });
  
  // Clean up expired sessions
  cleanupExpiredSessions();
  
  return token;
}

export function validateSession(token: string): Session | null {
  const sessionData = sessions.get(token);
  
  if (!sessionData) {
    return null;
  }
  
  // Check if session has expired
  if (sessionData.expiresAt < new Date()) {
    sessions.delete(token);
    return null;
  }
  
  // Extend session on validation
  sessionData.expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  
  // Get user details
  const user = getUserById(sessionData.userId);
  if (!user) {
    sessions.delete(token);
    return null;
  }
  
  return {
    userId: user.id,
    email: user.email,
    timezone: user.timezone
  };
}

export function destroySession(token: string): boolean {
  return sessions.delete(token);
}

export function getActiveSessions(): Map<string, SessionData> {
  cleanupExpiredSessions();
  return new Map(sessions);
}

export async function getSessionFromRequest(request: Request): Promise<Session | null> {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) {
    return null;
  }
  
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map(cookie => {
      const [name, ...value] = cookie.trim().split('=');
      return [name, value.join('=')];
    })
  );
  
  const sessionToken = cookies['finance_session'];
  if (!sessionToken) {
    return null;
  }
  
  return validateSession(sessionToken);
}

// Helper function to clean up expired sessions
function cleanupExpiredSessions(): void {
  const now = new Date();
  for (const [token, sessionData] of sessions.entries()) {
    if (sessionData.expiresAt < now) {
      sessions.delete(token);
    }
  }
}

// Export types for external use
export type { SessionData };
export interface UserSession extends Session {}