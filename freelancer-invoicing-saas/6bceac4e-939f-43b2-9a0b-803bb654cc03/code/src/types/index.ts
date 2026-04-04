// Core TypeScript interfaces for the invoicing application

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  businessName: string;
  avatarUrl?: string;
  address?: Address;
  phone?: string;
  website?: string;
  taxId?: string;
  currency: string;
  timezone: string;
  language: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Client {
  id: string;
  userId: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  address?: Address;
  taxId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discount?: number;
}

export type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled';

export interface Invoice {
  id: string;
  userId: string;
  clientId: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  issueDate: Date;
  dueDate: Date;
  items: InvoiceItem[];
  taxRate: number;
  discount?: number;
  notes?: string;
  terms?: string;
  sentAt?: Date;
  viewedAt?: Date;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type ExpenseCategory = 'office' | 'travel' | 'software' | 'hardware' | 'marketing' | 'professional' | 'other';

export interface Expense {
  id: string;
  userId: string;
  description: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  date: Date;
  receiptUrl?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  email: string;
  expiresAt: Date;
  createdAt: Date;
}

// Request/Response types
export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  businessName?: string;
}

export interface UpdateUserRequest {
  name?: string;
  businessName?: string;
  avatarUrl?: string;
  address?: Address;
  phone?: string;
  website?: string;
  taxId?: string;
  currency?: string;
  timezone?: string;
  language?: string;
}

export interface CreateClientRequest {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  address?: Address;
  taxId?: string;
  notes?: string;
}

export interface UpdateClientRequest {
  name?: string;
  email?: string;
  company?: string;
  phone?: string;
  address?: Address;
  taxId?: string;
  notes?: string;
}

export interface CreateInvoiceRequest {
  clientId: string;
  invoiceNumber: string;
  issueDate: Date;
  dueDate: Date;
  items: InvoiceItem[];
  taxRate: number;
  discount?: number;
  notes?: string;
  terms?: string;
}

export interface UpdateInvoiceRequest {
  clientId?: string;
  invoiceNumber?: string;
  issueDate?: Date;
  dueDate?: Date;
  items?: InvoiceItem[];
  taxRate?: number;
  discount?: number;
  notes?: string;
  terms?: string;
  status?: InvoiceStatus;
}

export interface CreateExpenseRequest {
  description: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  date: Date;
  receiptUrl?: string;
  notes?: string;
}

export interface UpdateExpenseRequest {
  description?: string;
  amount?: number;
  currency?: string;
  category?: ExpenseCategory;
  date?: Date;
  receiptUrl?: string;
  notes?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  session: Session;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface DashboardStats {
  totalRevenue: number;
  pendingInvoices: number;
  overdueInvoices: number;
  totalClients: number;
  recentInvoices: Invoice[];
  revenueTrend: Array<{
    month: string;
    revenue: number;
  }>;
}

export interface ReportData {
  period: string;
  startDate: Date;
  endDate: Date;
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  invoices: Invoice[];
  expenses: Expense[];
  byCategory: Record<ExpenseCategory, number>;
  byStatus: Record<InvoiceStatus, number>;
}