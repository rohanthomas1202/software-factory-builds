import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { store } from './store'
import type { User } from './types'

const SESSION_TOKEN_NAME = 'session_token'
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10)
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash)
}

export async function createSession(userId: string): Promise<string> {
  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  const now = Date.now()
  
  store.sessions.create({
    token,
    userId,
    createdAt: now,
    expiresAt: now + SESSION_DURATION
  })

  return token
}

export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_TOKEN_NAME)?.value
  if (!token) return null

  const session = store.sessions.findWhere(s => s.token === token && s.expiresAt > Date.now())[0]
  if (!session) return null

  return token
}

export async function getSession(): Promise<{ token: string; userId: string } | null> {
  const token = await getSessionToken()
  if (!token) return null

  const session = store.sessions.findWhere(s => s.token === token && s.expiresAt > Date.now())[0]
  if (!session) return null

  return { token, userId: session.userId }
}

export async function deleteSession(): Promise<void> {
  const token = await getSessionToken()
  if (!token) return

  store.sessions.deleteWhere(session => session.token === token)
  
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_TOKEN_NAME)
}

export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession()
  if (!session) return null

  return store.users.findById(session.userId)
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set({
    name: SESSION_TOKEN_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/'
  })
}