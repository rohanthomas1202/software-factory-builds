// Invoice calculation utilities and helper functions
import { Invoice, InvoiceItem, InvoiceStatus, Client, User } from '@/types';
import { currencies } from './currencies';

export interface InvoiceCalculations {
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  isOverdue: boolean;
  daysOverdue: number;
}

export interface InvoiceSummary {
  totalInvoices: number;
  totalRevenue: number;
  pendingAmount: number;
  overdueAmount: number;
  paidAmount: number;
  draftAmount: number;
}

/**
 * Calculate invoice totals and financial metrics
 */
export function calculateInvoiceTotals(invoice: Invoice): InvoiceCalculations {
  // Calculate subtotal from line items
  const subtotal = invoice.items.reduce((sum, item) => {
    const quantity = item.quantity || 1;
    const unitPrice = item.unitPrice || 0;
    return sum + (quantity * unitPrice);
  }, 0);

  // Calculate tax amount
  const taxAmount = invoice.taxRate 
    ? subtotal * (invoice.taxRate / 100)
    : 0;

  // Calculate discount amount
  const discountAmount = invoice.discount 
    ? (invoice.discountType === 'percentage' 
      ? subtotal * (invoice.discount / 100)
      : invoice.discount)
    : 0;

  // Calculate total
  const total = subtotal + taxAmount - discountAmount;

  // Calculate amount paid
  const amountPaid = invoice.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;

  // Calculate amount due
  const amountDue = total - amountPaid;

  // Calculate overdue status
  let isOverdue = false;
  let daysOverdue = 0;

  if (invoice.status === 'sent' && invoice.dueDate) {
    const dueDate = new Date(invoice.dueDate);
    const today = new Date();
    
    if (dueDate < today) {
      isOverdue = true;
      daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    }
  }

  return {
    subtotal,
    taxAmount,
    discountAmount,
    total,
    amountPaid,
    amountDue,
    isOverdue,
    daysOverdue,
  };
}

/**
 * Generate invoice number based on pattern
 */
export function generateInvoiceNumber(
  pattern: string = 'INV-{year}{month}{seq}',
  sequence: number,
  date: Date = new Date()
): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const seq = String(sequence).padStart(4, '0');

  return pattern
    .replace('{year}', String(year))
    .replace('{month}', month)
    .replace('{day}', day)
    .replace('{seq}', seq);
}

/**
 * Calculate summary statistics for a list of invoices
 */
export function calculateInvoiceSummary(invoices: Invoice[]): InvoiceSummary {
  const summary: InvoiceSummary = {
    totalInvoices: invoices.length,
    totalRevenue: 0,
    pendingAmount: 0,
    overdueAmount: 0,
    paidAmount: 0,
    draftAmount: 0,
  };

  invoices.forEach(invoice => {
    const calculations = calculateInvoiceTotals(invoice);
    
    switch (invoice.status) {
      case 'draft':
        summary.draftAmount += calculations.total;
        break;
      case 'sent':
        if (calculations.isOverdue) {
          summary.overdueAmount += calculations.amountDue;
        } else {
          summary.pendingAmount += calculations.amountDue;
        }
        summary.totalRevenue += calculations.total;
        break;
      case 'paid':
        summary.paidAmount += calculations.total;
        summary.totalRevenue += calculations.total;
        break;
      case 'cancelled':
        // Don't add to revenue
        break;
    }
  });

  return summary;
}

/**
 * Format invoice items for display
 */
export function formatInvoiceItems(items: InvoiceItem[], currency: string = 'USD'): string {
  if (items.length === 0) return 'No items';
  
  const currencyInfo = currencies.find(c => c.code === currency) || currencies[0];
  
  return items.map(item => {
    const quantity = item.quantity || 1;
    const unitPrice = item.unitPrice || 0;
    const total = quantity * unitPrice;
    
    return `${item.description} (${quantity} × ${currencyInfo.symbol}${unitPrice.toFixed(2)})`;
  }).join(', ');
}

/**
 * Calculate payment schedule
 */
export function calculatePaymentSchedule(
  total: number,
  paymentTerms: string,
  issueDate: Date
): { dueDate: Date; isOverdue: boolean; daysUntilDue: number } {
  const dueDate = new Date(issueDate);
  
  // Parse payment terms (e.g., "net30", "net15", "due_on_receipt")
  const match = paymentTerms.match(/net(\d+)/i);
  const days = match ? parseInt(match[1], 10) : 30; // Default to net30
  
  dueDate.setDate(dueDate.getDate() + days);
  
  const today = new Date();
  const isOverdue = dueDate < today;
  const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  return { dueDate, isOverdue, daysUntilDue };
}

/**
 * Validate invoice data before saving
 */
export function validateInvoice(invoice: Partial<Invoice>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!invoice.invoiceNumber?.trim()) {
    errors.push('Invoice number is required');
  }

  if (!invoice.clientId) {
    errors.push('Client is required');
  }

  if (!invoice.issueDate) {
    errors.push('Issue date is required');
  }

  if (!invoice.dueDate) {
    errors.push('Due date is required');
  }

  if (invoice.items.length === 0) {
    errors.push('At least one line item is required');
  }

  // Validate line items
  invoice.items.forEach((item, index) => {
    if (!item.description?.trim()) {
      errors.push(`Item ${index + 1}: Description is required`);
    }
    if (!item.quantity || item.quantity <= 0) {
      errors.push(`Item ${index + 1}: Quantity must be greater than 0`);
    }
    if (!item.unitPrice || item.unitPrice < 0) {
      errors.push(`Item ${index + 1}: Unit price must be 0 or greater`);
    }
  });

  // Validate dates
  if (invoice.issueDate && invoice.dueDate) {
    const issueDate = new Date(invoice.issueDate);
    const dueDate = new Date(invoice.dueDate);
    
    if (dueDate < issueDate) {
      errors.push('Due date cannot be before issue date');
    }
  }

  // Validate tax rate
  if (invoice.taxRate && (invoice.taxRate < 0 || invoice.taxRate > 100)) {
    errors.push('Tax rate must be between 0 and 100');
  }

  // Validate discount
  if (invoice.discount && invoice.discount < 0) {
    errors.push('Discount cannot be negative');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate aging report for invoices
 */
export function calculateAgingReport(invoices: Invoice[]): {
  current: number;
  overdue30: number;
  overdue60: number;
  overdue90: number;
  overdue90Plus: number;
} {
  const today = new Date();
  const aging = {
    current: 0,
    overdue30: 0,
    overdue60: 0,
    overdue90: 0,
    overdue90Plus: 0,
  };

  invoices.forEach(invoice => {
    if (invoice.status !== 'sent' || !invoice.dueDate) return;

    const dueDate = new Date(invoice.dueDate);
    const calculations = calculateInvoiceTotals(invoice);
    const amountDue = calculations.amountDue;

    if (amountDue <= 0) return;

    const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysOverdue <= 0) {
      aging.current += amountDue;
    } else if (daysOverdue <= 30) {
      aging.overdue30 += amountDue;
    } else if (daysOverdue <= 60) {
      aging.overdue60 += amountDue;
    } else if (daysOverdue <= 90) {
      aging.overdue90 += amountDue;
    } else {
      aging.overdue90Plus += amountDue;
    }
  });

  return aging;
}

/**
 * Get invoice status color and icon configuration
 */
export function getInvoiceStatusConfig(status: InvoiceStatus) {
  switch (status) {
    case 'draft':
      return {
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
        iconColor: 'text-gray-500',
        label: 'Draft',
      };
    case 'sent':
      return {
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        iconColor: 'text-blue-500',
        label: 'Sent',
      };
    case 'paid':
      return {
        color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        iconColor: 'text-green-500',
        label: 'Paid',
      };
    case 'cancelled':
      return {
        color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        iconColor: 'text-red-500',
        label: 'Cancelled',
      };
    default:
      return {
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
        iconColor: 'text-gray-500',
        label: 'Unknown',
      };
  }
}

/**
 * Calculate invoice metrics for dashboard
 */
export function calculateInvoiceMetrics(invoices: Invoice[]) {
  const summary = calculateInvoiceSummary(invoices);
  const aging = calculateAgingReport(invoices);
  
  return {
    ...summary,
    aging,
    averageInvoiceValue: summary.totalRevenue / (invoices.filter(i => i.status === 'paid').length || 1),
    collectionRate: summary.totalRevenue > 0 
      ? (summary.paidAmount / summary.totalRevenue) * 100 
      : 0,
    averageDaysToPay: calculateAverageDaysToPay(invoices),
  };
}

/**
 * Calculate average days to pay for paid invoices
 */
function calculateAverageDaysToPay(invoices: Invoice[]): number {
  const paidInvoices = invoices.filter(invoice => 
    invoice.status === 'paid' && 
    invoice.issueDate && 
    invoice.payments && 
    invoice.payments.length > 0
  );

  if (paidInvoices.length === 0) return 0;

  const totalDays = paidInvoices.reduce((sum, invoice) => {
    const issueDate = new Date(invoice.issueDate);
    const paymentDate = new Date(
      Math.max(...invoice.payments!.map(p => new Date(p.date).getTime()))
    );
    
    const days = Math.ceil((paymentDate.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24));
    return sum + Math.max(0, days);
  }, 0);

  return Math.round(totalDays / paidInvoices.length);
}

/**
 * Export invoice data to CSV format
 */
export function exportInvoicesToCSV(invoices: Invoice[], clients: Client[]): string {
  const headers = [
    'Invoice Number',
    'Client',
    'Issue Date',
    'Due Date',
    'Status',
    'Subtotal',
    'Tax',
    'Discount',
    'Total',
    'Amount Paid',
    'Amount Due',
    'Days Overdue',
  ];

  const rows = invoices.map(invoice => {
    const client = clients.find(c => c.id === invoice.clientId);
    const calculations = calculateInvoiceTotals(invoice);
    
    return [
      invoice.invoiceNumber,
      client?.name || 'Unknown',
      new Date(invoice.issueDate).toISOString().split('T')[0],
      invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : '',
      invoice.status,
      calculations.subtotal.toFixed(2),
      calculations.taxAmount.toFixed(2),
      calculations.discountAmount.toFixed(2),
      calculations.total.toFixed(2),
      calculations.amountPaid.toFixed(2),
      calculations.amountDue.toFixed(2),
      calculations.daysOverdue.toString(),
    ];
  });

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}