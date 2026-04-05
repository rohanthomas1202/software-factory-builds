export type User = {
  id: string;
  email: string;
  name: string;
  companyName?: string;
  address?: string;
  phone?: string;
  website?: string;
  createdAt: Date;
  updatedAt: Date;
  passwordHash: string;
};

export type Client = {
  id: string;
  userId: string;
  name: string;
  email: string;
  billingAddress: string;
  phone?: string;
  companyName?: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export type LineItem = {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPriceCents: number; // in cents
  createdAt: Date;
  updatedAt: Date;
};

export type Invoice = {
  id: string;
  userId: string;
  clientId: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  issueDate: Date;
  dueDate: Date;
  currency: string;
  notes?: string;
  terms?: string;
  subtotalCents: number;
  discountAmountCents: number;
  taxAmountCents: number;
  totalCents: number;
  discount: Discount;
  taxRate: TaxRate;
  sentAt?: Date;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type TaxRate = {
  id: string;
  userId: string;
  name: string;
  rate: number; // percentage (e.g., 19 for 19%)
  isDefault: boolean;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type Session = {
  token: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
};

export type DashboardStats = {
  totalInvoices: number;
  totalClients: number;
  pendingAmountCents: number;
  overdueAmountCents: number;
  recentInvoices: Invoice[];
  recentClients: Client[];
};

export type Discount = {
  type: 'percentage' | 'fixed';
  value: number; // percentage (e.g., 10 for 10%) or fixed amount in cents
};

export type CalculationResult = {
  subtotalCents: number;
  discountAmountCents: number;
  taxAmountCents: number;
  totalCents: number;
};

export type PdfGenerationResult = {
  invoiceId: string;
  pdfBuffer: Buffer;
  generatedAt: Date;
};

export type EmailLog = {
  id: string;
  invoiceId: string;
  userId: string;
  recipient: string;
  status: 'sent' | 'failed';
  error?: string;
  publicToken?: string;
  sentAt: Date;
};

export type SignedToken = {
  token: string;
  expiresAt: Date;
};

export type TokenPayload = {
  invoiceId: string;
  userId: string;
  issuedAt: number;
  expiresAt: number;
};