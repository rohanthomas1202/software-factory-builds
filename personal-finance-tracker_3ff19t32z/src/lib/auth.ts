import { createHash, randomBytes } from 'crypto';
import { User } from './types';
import { getUserByEmail, createUser as storeCreateUser } from './store';

// In MVP, we use plaintext passwords with a simple salt
export function hashPassword(password: string): string {
  // Create a simple salt and hash for MVP (not production secure)
  const salt = randomBytes(16).toString('hex');
  const hash = createHash('sha256')
    .update(password + salt)
    .digest('hex');
  return `${salt}:${hash}`;
}

export function validatePassword(password: string, hash: string): boolean {
  const [salt, originalHash] = hash.split(':');
  const newHash = createHash('sha256')
    .update(password + salt)
    .digest('hex');
  return newHash === originalHash;
}

export function createUser(email: string, password: string): Omit<User, 'createdAt'> {
  const existingUser = getUserByEmail(email);
  if (existingUser) {
    throw new Error('User already exists');
  }
  
  const passwordHash = hashPassword(password);
  const user = storeCreateUser({
    id: randomBytes(16).toString('hex'),
    email,
    passwordHash
  });
  
  return {
    id: user.id,
    email: user.email,
    passwordHash: user.passwordHash
  };
}

export function findUserByEmail(email: string): User | undefined {
  return getUserByEmail(email);
}

export function authenticateUser(email: string, password: string): User | null {
  const user = findUserByEmail(email);
  if (!user) {
    return null;
  }
  
  if (validatePassword(password, user.passwordHash)) {
    return user;
  }
  
  return null;
}

export function validateUserSession(token: string): string | null {
  const { verifySession } = require('./session');
  return verifySession(token);
}