import type {
  User,
  Client,
  Invoice,
  TaxRate,
  Session,
  EmailLog,
  InvoiceStatus,
} from './types';

// In-memory data stores
const users = new Map<string, User>();
const clients = new Map<string, Client>();
const invoices = new Map<string, Invoice>();
const taxRates = new Map<string, TaxRate>();
const sessions = new Map<string, Session>();
const emailLogs = new Map<string, EmailLog>();

// Helper to generate unique IDs (using crypto.randomUUID for simplicity)
export function generateId(): string {
  return crypto.randomUUID();
}

// Helper to generate invoice number per user
const userInvoiceCounters = new Map<string, number>();

export function generateInvoiceNumber(userId: string): string {
  const currentCount = userInvoiceCounters.get(userId) || 0;
  const nextCount = currentCount + 1;
  userInvoiceCounters.set(userId, nextCount);
  return `INV-${nextCount.toString().padStart(4, '0')}`;
}

// Store statistics (for debugging/admin)
export function getStoreStats() {
  return {
    users: users.size,
    clients: clients.size,
    invoices: invoices.size,
    taxRates: taxRates.size,
    sessions: sessions.size,
    emailLogs: emailLogs.size,
  };
}

// User-specific queries
export function getUserClients(userId: string): Client[] {
  return Array.from(clients.values())
    .filter(client => client.userId === userId && !client.isArchived)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function getUserInvoices(userId: string, status?: InvoiceStatus): Invoice[] {
  return Array.from(invoices.values())
    .filter(invoice => {
      if (invoice.userId !== userId) return false;
      if (status && invoice.status !== status) return false;
      return true;
    })
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function getUserTaxRates(userId: string): TaxRate[] {
  return Array.from(taxRates.values())
    .filter(taxRate => taxRate.userId === userId && !taxRate.isArchived)
    .sort((a, b) => {
      if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
}

// Get invoice with related data (client, line items, etc.)
export function getInvoiceWithRelations(invoiceId: string) {
  // This is a placeholder - actual implementation would join data
  // For now, we return the invoice and let API routes fetch related data separately
  return invoices.get(invoiceId);
}

// Session management
export function getSessionByToken(token: string): Session | undefined {
  const session = sessions.get(token);
  if (!session) return undefined;
  if (session.expiresAt < new Date()) {
    sessions.delete(token);
    return undefined;
  }
  return session;
}

export function deleteSession(token: string): boolean {
  return sessions.delete(token);
}

export function createSession(userId: string, expiresInHours = 24): Session {
  const token = generateId();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + expiresInHours);
  
  const session: Session = {
    token,
    userId,
    expiresAt,
    createdAt: new Date(),
  };
  
  sessions.set(token, session);
  return session;
}

export function cleanupExpiredSessions(): number {
  let deleted = 0;
  const now = new Date();
  
  for (const [token, session] of sessions.entries()) {
    if (session.expiresAt < now) {
      sessions.delete(token);
      deleted++;
    }
  }
  
  return deleted;
}

// Export the stores and functions
export {
  users,
  clients,
  invoices,
  taxRates,
  sessions,
  emailLogs,
};

// Combined store object for convenience
export const store = {
  users,
  clients,
  invoices,
  taxRates,
  sessions,
  emailLogs,
  generateId,
  generateInvoiceNumber,
  getStoreStats,
  getUserClients,
  getUserInvoices,
  getUserTaxRates,
  getInvoiceWithRelations,
  getSessionByToken,
  deleteSession,
  createSession,
  cleanupExpiredSessions,
};