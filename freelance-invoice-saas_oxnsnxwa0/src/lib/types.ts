export interface User {
  id: string
  email: string
  passwordHash: string
  businessName: string
  businessAddress: string
  businessLogo: string
  invoiceNumberPrefix: string
  invoiceNumberCounter: number
  currency: string
  timezone: string
  createdAt: number
  updatedAt: number
}

export interface Client {
  id: string
  userId: string
  name: string
  email: string
  companyName: string | null
  billingAddress: {
    street: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  currency: string
  deletedAt: number | null
  createdAt: number
  updatedAt: number
}

export interface TaxRate {
  id: string
  userId: string
  name: string
  rate: number
  isActive: boolean
  createdAt: number
  updatedAt: number
}

export interface InvoiceItem {
  id: string
  invoiceId: string
  description: string
  quantity: number
  rate: number
  taxRateId: string | null
  sortOrder: number
  createdAt: number
}

export interface Invoice {
  id: string
  userId: string
  clientId: string
  invoiceNumber: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'void'
  issueDate: number
  dueDate: number
  paymentTerms: number
  notes: string
  terms: string
  currency: string
  subtotal: number
  taxAmount: number
  total: number
  sentAt: number | null
  paidAt: number | null
  viewedAt: number | null
  token: string
  createdAt: number
  updatedAt: number
}

export interface Payment {
  id: string
  invoiceId: string
  amount: number
  currency: string
  method: string
  reference: string
  paidAt: number
  createdAt: number
}

export interface Session {
  id: string
  userId: string
  token: string
  expiresAt: number
  createdAt: number
}

export type LoginRequest = {
  email: string
  password: string
}

export type RegisterRequest = {
  email: string
  password: string
  businessName: string
  businessAddress: string
  businessLogo: string
  invoiceNumberPrefix: string
  currency: string
  timezone: string
}

export type ClientRequest = Omit<Client, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'deletedAt'>

export type InvoiceRequest = Omit<Invoice, 'id' | 'userId' | 'invoiceNumber' | 'subtotal' | 'taxAmount' | 'total' | 'sentAt' | 'paidAt' | 'viewedAt' | 'token' | 'createdAt' | 'updatedAt'> & {
  items: InvoiceItemRequest[]
}

export type InvoiceItemRequest = Omit<InvoiceItem, 'id' | 'invoiceId' | 'createdAt'>

export type SendInvoiceRequest = {
  email: string
  subject: string
  message: string
}