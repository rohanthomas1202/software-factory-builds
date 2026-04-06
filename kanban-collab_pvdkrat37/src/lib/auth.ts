import { cookies } from "next/headers";
import { randomUUID, createHash, timingSafeEqual } from "crypto";
import type { User, Invite } from "./types";
import { findUserById, findUserByEmail, findInviteByToken } from "./store";

// Session management
const sessions = new Map<string, { userId: string; expiresAt: number }>();
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
const SESSION_COOKIE_NAME = "kanban-session";

// Password hashing (simple implementation for MVP)
// IMPORTANT: In production, you should use a proper password hashing library
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = randomUUID().slice(0, 16);
  const hash = createHash("sha256")
    .update(password + salt)
    .digest("hex");
  return { hash, salt };
}

export function verifyPassword(
  password: string,
  hash: string,
  salt: string
): boolean {
  const testHash = createHash("sha256")
    .update(password + salt)
    .digest("hex");
  
  // Use timingSafeEqual to prevent timing attacks
  const hashBuffer = Buffer.from(hash, "hex");
  const testHashBuffer = Buffer.from(testHash, "hex");
  
  if (hashBuffer.length !== testHashBuffer.length) {
    return false;
  }
  
  return timingSafeEqual(hashBuffer, testHashBuffer);
}

export function createSession(userId: string): string {
  const token = randomUUID();
  const expiresAt = Date.now() + SESSION_DURATION;
  
  sessions.set(token, { userId, expiresAt });
  
  // Clean up expired sessions occasionally
  if (Math.random() < 0.01) {
    cleanupExpiredSessions();
  }
  
  return token;
}

export function getSession(token: string): string | null {
  const session = sessions.get(token);
  
  if (!session) {
    return null;
  }
  
  if (session.expiresAt < Date.now()) {
    sessions.delete(token);
    return null;
  }
  
  return session.userId;
}

export function deleteSession(token: string): void {
  sessions.delete(token);
}

export function cleanupExpiredSessions(): void {
  const now = Date.now();
  for (const [token, session] of sessions.entries()) {
    if (session.expiresAt < now) {
      sessions.delete(token);
    }
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  
  if (!token) {
    return null;
  }
  
  const userId = getSession(token);
  if (!userId) {
    return null;
  }
  
  return findUserById(userId) || null;
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION / 1000,
    path: "/",
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function authenticate(
  email: string,
  password: string
): Promise<string | null> {
  const user = findUserByEmail(email);
  
  if (!user) {
    return null;
  }
  
  // In our current store implementation, passwords are stored as plaintext
  // This is a temporary measure for MVP
  // TODO: Update store to store hash and salt, then use verifyPassword
  if (user.password !== password) {
    return null;
  }
  
  if (!user.emailVerified) {
    return null;
  }
  
  return createSession(user.id);
}

// Email verification tokens (stored in user record in production)
export function verifyEmailToken(token: string): boolean {
  // For MVP, we'll accept any non-empty token as valid
  // In production, you'd verify against stored token with expiry
  return typeof token === "string" && token.length > 0;
}

export function createInviteToken(): string {
  return randomUUID();
}

export function validateInviteToken(token: string): Invite | null {
  if (!token) {
    return null;
  }
  
  const invite = findInviteByToken(token);
  
  if (!invite) {
    return null;
  }
  
  if (invite.expiresAt < Date.now()) {
    return null;
  }
  
  if (invite.acceptedAt) {
    return null;
  }
  
  return invite;
}