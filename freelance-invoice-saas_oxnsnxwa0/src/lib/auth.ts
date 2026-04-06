"use server";

import { cookies } from "next/headers";
import { createHash, randomBytes } from "crypto";
import { Session, User } from "./types";
import { sessionStore, userStore } from "./store";

const SESSION_COOKIE_NAME = "invoice_session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function hashUserPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = createHash("sha256")
    .update(password + salt)
    .digest("hex");
  return `${salt}:${hash}`;
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  const [salt, storedHash] = hashedPassword.split(":");
  if (!salt || !storedHash) return false;

  const hash = createHash("sha256")
    .update(password + salt)
    .digest("hex");

  return hash === storedHash;
}

export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const session: Session = {
    id: token,
    userId,
    token,
    expiresAt: Date.now() + SESSION_DURATION_MS,
    createdAt: Date.now(),
  };
  sessionStore.create(session);
  return token;
}

export function getSession(token: string): Session | null {
  const session = sessionStore.findById(token);
  if (!session || session.expiresAt < Date.now()) {
    if (session) sessionStore.delete(token);
    return null;
  }
  return session;
}

export function deleteSession(token: string): void {
  sessionStore.delete(token);
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION_MS / 1000,
    path: "/",
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value || null;
}

export async function getCurrentUser(): Promise<User | null> {
  const token = await getSessionToken();
  if (!token) return null;

  const session = getSession(token);
  if (!session) return null;

  return userStore.findById(session.userId);
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Not authenticated");
  }
  return user;
}