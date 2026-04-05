import { randomBytes } from 'crypto';

export type Session = {
  userId: string;
  token: string;
  createdAt: Date;
  expiresAt: Date;
};

// In-memory session storage (resets on server restart)
const sessions = new Map<string, Session>();

// Session duration: 7 days
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export function createSession(userId: string): string {
  const token = randomBytes(32).toString('hex');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS);
  
  const session: Session = {
    userId,
    token,
    createdAt: now,
    expiresAt
  };
  
  sessions.set(token, session);
  return token;
}

export function verifySession(token: string): string | null {
  const session = sessions.get(token);
  
  if (!session) {
    return null;
  }
  
  // Check if session has expired
  if (new Date() > session.expiresAt) {
    sessions.delete(token);
    return null;
  }
  
  // Update expiration time (refresh on verification)
  session.expiresAt = new Date(new Date().getTime() + SESSION_DURATION_MS);
  sessions.set(token, session);
  
  return session.userId;
}

export function clearSession(token: string): void {
  sessions.delete(token);
}

export function cleanupExpiredSessions(): void {
  const now = new Date();
  for (const [token, session] of sessions.entries()) {
    if (now > session.expiresAt) {
      sessions.delete(token);
    }
  }
}

export function getUserSessions(userId: string): Array<Session> {
  return Array.from(sessions.values())
    .filter(session => session.userId === userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}