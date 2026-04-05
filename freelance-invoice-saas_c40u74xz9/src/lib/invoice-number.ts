import { store } from './store';

/**
 * Get the next available invoice number for a user
 * Format: INV-0001, INV-0002, etc.
 */
export function getNextInvoiceNumber(userId: string): string {
  // Get all invoices for this user
  const userInvoices = store.invoices.filter(inv => inv.userId === userId);
  
  // Extract sequential numbers from existing invoice numbers
  const numbers = userInvoices
    .map(inv => getInvoiceSequentialNumber(inv.invoiceNumber))
    .filter(n => !isNaN(n) && n > 0);
  
  // Find the highest number
  const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
  
  // Return next number with 4-digit padding
  return formatInvoiceNumber(maxNumber + 1);
}

/**
 * Parse invoice number to extract sequential number
 * e.g., "INV-0001" → 1
 */
export function parseInvoiceNumber(invoiceNumber: string): number {
  const match = invoiceNumber.match(/^INV-(\d+)$/);
  if (!match) {
    return 0;
  }
  return parseInt(match[1], 10);
}

/**
 * Check if invoice number has valid format
 */
export function isValidInvoiceNumber(invoiceNumber: string): boolean {
  return /^INV-\d{4,}$/.test(invoiceNumber);
}

/**
 * Format a number as an invoice number with padding
 * e.g., 1 → "INV-0001"
 */
export function formatInvoiceNumber(number: number, padding: number = 4): string {
  if (number < 1) {
    throw new Error('Invoice number must be positive');
  }
  const padded = number.toString().padStart(padding, '0');
  return `INV-${padded}`;
}

/**
 * Generate a unique invoice number that doesn't exist for the user
 */
export function generateUniqueInvoiceNumber(userId: string): string {
  let attempts = 0;
  const maxAttempts = 1000;

  while (attempts < maxAttempts) {
    const nextNumber = getNextInvoiceNumber(userId);
    if (isInvoiceNumberAvailable(userId, nextNumber)) {
      return nextNumber;
    }
    // If collision, try next number
    const currentNum = parseInvoiceNumber(nextNumber);
    const nextTry = formatInvoiceNumber(currentNum + 1);
    if (isInvoiceNumberAvailable(userId, nextTry)) {
      return nextTry;
    }
    attempts++;
  }

  // Fallback: use timestamp
  const timestamp = Date.now().toString().slice(-6);
  return `INV-${timestamp}`;
}

/**
 * Check if an invoice number is available for a user
 */
export function isInvoiceNumberAvailable(userId: string, invoiceNumber: string): boolean {
  return !store.invoices.some(
    inv => inv.userId === userId && inv.invoiceNumber === invoiceNumber
  );
}

/**
 * Get the sequential number from invoice number
 */
export function getInvoiceSequentialNumber(invoiceNumber: string): number {
  return parseInvoiceNumber(invoiceNumber);
}

/**
 * Compare two invoice numbers for sorting
 * Returns negative if a < b, positive if a > b, 0 if equal
 */
export function compareInvoiceNumbers(a: string, b: string): number {
  const numA = parseInvoiceNumber(a);
  const numB = parseInvoiceNumber(b);
  return numA - numB;
}