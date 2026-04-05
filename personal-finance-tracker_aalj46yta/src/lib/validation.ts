/**
 * Validation utilities for the finance tracker
 * Note: All functions are pure and synchronous for simplicity
 */

/**
 * Parse a decimal string or number into integer cents using round-half-up
 * @example parseCents("12.34") → 1234
 * @example parseCents("12.345") → 1235 (rounds up)
 * @example parseCents(12.34) → 1234
 */
export function parseCents(input: string | number): number {
  if (typeof input === 'number') {
    return Math.round(input * 100);
  }
  
  // Remove any non-numeric characters except decimal point and minus
  const cleaned = input.replace(/[^\d.-]/g, '');
  
  if (!cleaned || cleaned === '-' || cleaned === '.') {
    throw new Error('Invalid number format');
  }
  
  const num = parseFloat(cleaned);
  if (isNaN(num)) {
    throw new Error('Invalid number format');
  }
  
  return Math.round(num * 100);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

/**
 * Validate password requirements
 * - At least 8 characters
 * - At least one letter and one number
 */
export function isValidPassword(password: string): boolean {
  if (password.length < 8) return false;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  return hasLetter && hasNumber;
}

/**
 * Validate timezone format (basic check)
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate category name
 * - 1-50 characters
 * - No leading/trailing whitespace
 */
export function isValidCategoryName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length >= 1 && trimmed.length <= 50;
}

/**
 * Validate color hex format (6-digit hex, optional #)
 */
export function isValidColorHex(colorHex: string | null | undefined): boolean {
  if (colorHex === null || colorHex === undefined || colorHex === '') {
    return true; // Optional field
  }
  const hexRegex = /^#?([0-9A-Fa-f]{6})$/;
  return hexRegex.test(colorHex);
}

/**
 * Validate monthly limit in cents
 * - Must be integer ≥ 0
 */
export function validateMonthlyLimit(limit: number | string): number {
  const num = typeof limit === 'string' ? parseInt(limit, 10) : limit;
  
  if (isNaN(num) || !Number.isInteger(num) || num < 0) {
    throw new Error('Monthly limit must be a non-negative integer');
  }
  
  return num;
}

/**
 * Validate transaction amount (returns cents)
 */
export function validateTransactionAmount(amount: string | number): number {
  try {
    const cents = parseCents(amount);
    if (cents <= 0) {
      throw new Error('Amount must be greater than 0');
    }
    return cents;
  } catch {
    throw new Error('Invalid amount format');
  }
}

/**
 * Validate category ID (basic UUID check)
 */
export function isValidCategoryId(id: string | null | undefined): boolean {
  if (id === null || id === undefined) {
    return true; // INCOME transactions can have null category
  }
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Validate note (optional, max 500 chars)
 */
export function isValidNote(note: string | null | undefined): boolean {
  if (note === null || note === undefined || note === '') {
    return true;
  }
  return note.length <= 500;
}