import { LineItem, Discount, TaxRate, CalculationResult } from './types';

/**
 * Calculate the total for a single line item (quantity × unit price)
 * All amounts are in cents (minor currency units)
 */
export function calculateLineItemTotal(item: LineItem): number {
  return item.quantity * item.unitPrice;
}

/**
 * Validate line items for required fields and positive values
 * Returns array of error messages (empty if valid)
 */
export function validateLineItems(lineItems: LineItem[]): string[] {
  const errors: string[] = [];

  if (lineItems.length === 0) {
    errors.push('At least one line item is required');
  }

  lineItems.forEach((item, index) => {
    const itemNum = index + 1;

    if (!item.description?.trim()) {
      errors.push(`Line item ${itemNum}: Description is required`);
    }

    if (item.quantity <= 0) {
      errors.push(`Line item ${itemNum}: Quantity must be greater than 0`);
    }

    if (item.unitPrice < 0) {
      errors.push(`Line item ${itemNum}: Unit price cannot be negative`);
    }

    if (item.quantity > 1000000) {
      errors.push(`Line item ${itemNum}: Quantity is too large`);
    }

    if (item.unitPrice > 100000000) { // $1,000,000.00 in cents
      errors.push(`Line item ${itemNum}: Unit price is too large`);
    }
  });

  return errors;
}

/**
 * Parse a currency string (e.g., "$10.99", "10.99", "10") to cents
 * Handles commas, dollar signs, and decimal points
 */
export function parseCurrencyToCents(value: string): number {
  // Remove any currency symbols and commas
  const cleanValue = value.replace(/[$,]/g, '').trim();

  // Parse as float and convert to cents
  const dollars = parseFloat(cleanValue);

  if (isNaN(dollars)) {
    throw new Error(`Invalid currency value: "${value}"`);
  }

  // Round to nearest cent to avoid floating point issues
  return Math.round(dollars * 100);
}

/**
 * Format cents as currency string (e.g., 1099 → "$10.99")
 */
export function formatCurrency(cents: number): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(dollars);
}

/**
 * Calculate discount amount based on discount type
 * Returns amount in cents
 */
export function calculateDiscountAmount(subtotalCents: number, discount: Discount): number {
  if (discount.type === 'flat') {
    // Flat discount in cents
    return Math.min(discount.value, subtotalCents); // Cannot discount more than subtotal
  } else {
    // Percentage discount (value is percentage, e.g., 10 for 10%)
    const percentage = discount.value / 100;
    return Math.round(subtotalCents * percentage);
  }
}

/**
 * Calculate tax amount based on tax rate
 * Returns amount in cents
 */
export function calculateTaxAmount(taxableAmountCents: number, taxRate: TaxRate): number {
  const rate = taxRate.rate / 100; // Convert percentage to decimal
  return Math.round(taxableAmountCents * rate);
}

/**
 * Calculate all invoice totals server-side
 * All amounts returned in cents
 */
export function calculateInvoiceTotals(
  lineItems: LineItem[],
  discount: Discount,
  taxRate: TaxRate
): CalculationResult {
  // Calculate subtotal from line items
  const subtotalCents = lineItems.reduce((sum, item) => {
    return sum + calculateLineItemTotal(item);
  }, 0);

  // Calculate discount
  const discountAmountCents = calculateDiscountAmount(subtotalCents, discount);

  // Calculate taxable amount (after discount)
  const taxableAmountCents = Math.max(0, subtotalCents - discountAmountCents);

  // Calculate tax
  const taxAmountCents = calculateTaxAmount(taxableAmountCents, taxRate);

  // Calculate total
  const totalCents = taxableAmountCents + taxAmountCents;

  return {
    subtotalCents,
    discountAmountCents,
    taxAmountCents,
    totalCents,
    lineItemsValid: validateLineItems(lineItems).length === 0,
  };
}

/**
 * Validate that invoice calculations match the stored values
 * Used to ensure data integrity
 */
export function validateInvoiceCalculations(invoice: {
  subtotalCents: number;
  discountAmountCents: number;
  taxAmountCents: number;
  totalCents: number;
  lineItems: LineItem[];
  discount: Discount;
  taxRate: TaxRate;
}): boolean {
  const calculated = calculateInvoiceTotals(
    invoice.lineItems,
    invoice.discount,
    invoice.taxRate
  );

  return (
    invoice.subtotalCents === calculated.subtotalCents &&
    invoice.discountAmountCents === calculated.discountAmountCents &&
    invoice.taxAmountCents === calculated.taxAmountCents &&
    invoice.totalCents === calculated.totalCents
  );
}