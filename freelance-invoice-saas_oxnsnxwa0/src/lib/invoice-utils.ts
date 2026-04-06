import { InvoiceItem, TaxRate } from './types';

export interface InvoiceTotals {
  subtotal: number;
  taxAmount: number;
  total: number;
  taxBreakdown: Array<{
    taxRateId: string | null;
    name: string;
    rate: number;
    amount: number;
  }>;
}

/**
 * Calculate invoice totals from line items and tax rates
 */
export function calculateInvoiceTotals(
  items: InvoiceItem[],
  taxRates: TaxRate[]
): InvoiceTotals {
  const subtotal = items.reduce((sum, item) => {
    return sum + (item.quantity * item.rate);
  }, 0);

  // Group tax by tax rate
  const taxMap = new Map<string | null, number>();
  
  items.forEach(item => {
    const lineTotal = item.quantity * item.rate;
    if (item.taxRateId) {
      const taxRate = taxRates.find(tr => tr.id === item.taxRateId);
      if (taxRate && taxRate.isActive) {
        const current = taxMap.get(item.taxRateId) || 0;
        taxMap.set(item.taxRateId, current + (lineTotal * taxRate.rate / 100));
      }
    } else {
      // No tax
      const current = taxMap.get(null) || 0;
      taxMap.set(null, current);
    }
  });

  const taxBreakdown: InvoiceTotals['taxBreakdown'] = [];
  let taxAmount = 0;

  taxMap.forEach((amount, taxRateId) => {
    if (taxRateId) {
      const taxRate = taxRates.find(tr => tr.id === taxRateId);
      if (taxRate) {
        taxBreakdown.push({
          taxRateId,
          name: taxRate.name,
          rate: taxRate.rate,
          amount
        });
        taxAmount += amount;
      }
    }
  });

  const total = subtotal + taxAmount;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
    taxBreakdown
  };
}

/**
 * Format currency amount with proper symbol and formatting
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  return formatter.format(amount);
}

/**
 * Generate invoice number with prefix and padded counter
 */
export function generateInvoiceNumber(
  prefix: string,
  counter: number,
  padding: number = 4
): string {
  const paddedNumber = counter.toString().padStart(padding, '0');
  return `${prefix}${paddedNumber}`;
}

/**
 * Validate invoice items for required fields and positive values
 */
export function validateInvoiceItems(items: InvoiceItem[]): string | null {
  if (items.length === 0) {
    return 'At least one line item is required';
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    
    if (!item.description?.trim()) {
      return `Item ${i + 1}: Description is required`;
    }
    
    if (item.quantity <= 0) {
      return `Item ${i + 1}: Quantity must be greater than 0`;
    }
    
    if (item.rate < 0) {
      return `Item ${i + 1}: Rate cannot be negative`;
    }
    
    if (item.quantity > 99999 || item.rate > 9999999) {
      return `Item ${i + 1}: Values are too large`;
    }
  }
  
  return null;
}

/**
 * Calculate days until due date (negative if overdue)
 */
export function calculateDaysUntilDue(dueDate: number): number {
  const now = Date.now();
  const diffTime = dueDate - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Get Tailwind classes for payment status badge
 */
export function getPaymentStatusStyle(status: string): {
  bg: string;
  text: string;
  border: string;
} {
  switch (status) {
    case 'draft':
      return {
        bg: 'bg-gray-100 dark:bg-gray-800',
        text: 'text-gray-800 dark:text-gray-300',
        border: 'border-gray-300 dark:border-gray-700'
      };
    case 'sent':
      return {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        text: 'text-blue-800 dark:text-blue-300',
        border: 'border-blue-300 dark:border-blue-700'
      };
    case 'paid':
      return {
        bg: 'bg-green-100 dark:bg-green-900/30',
        text: 'text-green-800 dark:text-green-300',
        border: 'border-green-300 dark:border-green-700'
      };
    case 'overdue':
      return {
        bg: 'bg-red-100 dark:bg-red-900/30',
        text: 'text-red-800 dark:text-red-300',
        border: 'border-red-300 dark:border-red-700'
      };
    case 'void':
      return {
        bg: 'bg-gray-100 dark:bg-gray-800',
        text: 'text-gray-800 dark:text-gray-300',
        border: 'border-gray-300 dark:border-gray-700'
      };
    default:
      return {
        bg: 'bg-gray-100 dark:bg-gray-800',
        text: 'text-gray-800 dark:text-gray-300',
        border: 'border-gray-300 dark:border-gray-700'
      };
  }
}