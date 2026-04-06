import { Invoice } from './types';
import { invoiceStore } from './store';

/**
 * Check if an invoice is overdue based on due date and status
 */
export function isInvoiceOverdue(invoice: Invoice): boolean {
  if (invoice.status === 'paid' || invoice.status === 'void') {
    return false;
  }
  
  const now = Date.now();
  return invoice.dueDate < now && invoice.status === 'sent';
}

/**
 * Get all overdue invoices for a specific user
 */
export function getOverdueInvoicesForUser(userId: string): Invoice[] {
  const allInvoices = invoiceStore.getAll();
  return allInvoices.filter(invoice => 
    invoice.userId === userId && 
    isInvoiceOverdue(invoice)
  );
}

/**
 * Calculate total overdue amount for a user
 */
export function calculateTotalOverdueAmount(userId: string): number {
  const overdueInvoices = getOverdueInvoicesForUser(userId);
  return overdueInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
}

/**
 * Get upcoming invoices (due within 7 days) for a user
 */
export function getUpcomingInvoices(userId: string): Invoice[] {
  const allInvoices = invoiceStore.getAll();
  const now = Date.now();
  const sevenDaysFromNow = now + (7 * 24 * 60 * 60 * 1000);
  
  return allInvoices.filter(invoice => 
    invoice.userId === userId &&
    invoice.status === 'sent' &&
    invoice.dueDate > now &&
    invoice.dueDate <= sevenDaysFromNow
  );
}

/**
 * Mark overdue invoices as overdue (update status from 'sent' to 'overdue')
 * Returns number of invoices marked overdue
 */
export function markOverdueInvoices(): number {
  const allInvoices = invoiceStore.getAll();
  let markedCount = 0;
  
  allInvoices.forEach(invoice => {
    if (isInvoiceOverdue(invoice) && invoice.status !== 'overdue') {
      invoiceStore.update(invoice.id, { status: 'overdue' });
      markedCount++;
    }
  });
  
  return markedCount;
}

/**
 * Schedule overdue detection (for demo purposes only - in production use a cron job)
 * Note: This uses setInterval and is meant for demo/development only
 */
export function scheduleOverdueDetection(intervalMs: number = 24 * 60 * 60 * 1000): NodeJS.Timeout {
  console.log('Scheduling overdue invoice detection...');
  
  return setInterval(() => {
    const marked = markOverdueInvoices();
    if (marked > 0) {
      console.log(`Marked ${marked} invoices as overdue`);
    }
  }, intervalMs);
}