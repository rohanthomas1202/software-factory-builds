import { v4 as uuidv4 } from 'uuid'
import {
  User,
  Client,
  TaxRate,
  Invoice,
  InvoiceItem,
  Payment,
  Session,
  ClientRequest,
  InvoiceRequest,
  InvoiceItemRequest
} from './types'

// Base store class with common CRUD operations
class MemoryStore<T extends { id: string }> {
  private items = new Map<string, T>()

  create(item: Omit<T, 'id'> & { id?: string }): T {
    const id = item.id || uuidv4()
    const newItem = { ...item, id } as T
    this.items.set(id, newItem)
    return newItem
  }

  findById(id: string): T | null {
    return this.items.get(id) || null
  }

  update(id: string, updates: Partial<T>): T | null {
    const item = this.items.get(id)
    if (!item) return null
    const updatedItem = { ...item, ...updates }
    this.items.set(id, updatedItem)
    return updatedItem
  }

  delete(id: string): boolean {
    return this.items.delete(id)
  }

  getAll(): T[] {
    return Array.from(this.items.values())
  }

  findByUserId(userId: string): T[] {
    return this.getAll().filter((item: any) => item.userId === userId)
  }
}

// Specialized stores
class UserStore extends MemoryStore<User> {
  findByEmail(email: string): User | null {
    return this.getAll().find(user => user.email === email) || null
  }

  incrementInvoiceCounter(userId: string): number {
    const user = this.findById(userId)
    if (!user) return 0
    const newCounter = user.invoiceNumberCounter + 1
    this.update(userId, { invoiceNumberCounter: newCounter })
    return newCounter
  }
}

class ClientStore extends MemoryStore<Client> {
  findByUserId(userId: string): Client[] {
    return this.getAll().filter(client => client.userId === userId && !client.deletedAt)
  }

  delete(id: string): boolean {
    // Soft delete
    const client = this.findById(id)
    if (!client) return false
    this.update(id, { deletedAt: Date.now() })
    return true
  }
}

class InvoiceStore extends MemoryStore<Invoice> {
  findByUserId(userId: string): Invoice[] {
    return this.getAll().filter(invoice => invoice.userId === userId)
  }

  findByClientId(clientId: string): Invoice[] {
    return this.getAll().filter(invoice => invoice.clientId === clientId)
  }

  findByStatus(userId: string, status: Invoice['status']): Invoice[] {
    return this.getAll().filter(invoice => invoice.userId === userId && invoice.status === status)
  }
}

class InvoiceItemStore extends MemoryStore<InvoiceItem> {
  findByInvoiceId(invoiceId: string): InvoiceItem[] {
    return this.getAll().filter(item => item.invoiceId === invoiceId)
  }

  deleteByInvoiceId(invoiceId: string): void {
    this.getAll()
      .filter(item => item.invoiceId === invoiceId)
      .forEach(item => this.delete(item.id))
  }
}

// Create store instances
export const userStore = new UserStore()
export const clientStore = new ClientStore()
export const taxRateStore = new MemoryStore<TaxRate>()
export const invoiceStore = new InvoiceStore()
export const invoiceItemStore = new InvoiceItemStore()
export const paymentStore = new MemoryStore<Payment>()
export const sessionStore = new MemoryStore<Session>()

// Helper functions
export function createInvoiceWithItems(
  userId: string,
  invoiceData: Omit<InvoiceRequest, 'items'>,
  items: InvoiceItemRequest[]
): Invoice {
  const user = userStore.findById(userId)
  if (!user) throw new Error('User not found')

  const counter = userStore.incrementInvoiceCounter(userId)
  const invoiceNumber = `${user.invoiceNumberPrefix}${counter.toString().padStart(4, '0')}`

  // Calculate totals (simplified - actual calculation would be in invoice-utils)
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0)
  const taxAmount = 0 // Will be calculated properly in invoice-utils
  const total = subtotal + taxAmount

  const invoice = invoiceStore.create({
    ...invoiceData,
    userId,
    invoiceNumber,
    subtotal,
    taxAmount,
    total,
    token: uuidv4(),
    sentAt: null,
    paidAt: null,
    viewedAt: null,
    createdAt: Date.now(),
    updatedAt: Date.now()
  })

  items.forEach((item, index) => {
    invoiceItemStore.create({
      ...item,
      invoiceId: invoice.id,
      sortOrder: index,
      createdAt: Date.now()
    })
  })

  return invoice
}

export function getInvoiceWithItems(invoiceId: string): (Invoice & { items: InvoiceItem[] }) | null {
  const invoice = invoiceStore.findById(invoiceId)
  if (!invoice) return null

  const items = invoiceItemStore.findByInvoiceId(invoiceId)
  return { ...invoice, items }
}

export function getInvoicesByUser(userId: string): (Invoice & { items: InvoiceItem[] })[] {
  const invoices = invoiceStore.findByUserId(userId)
  return invoices.map(invoice => {
    const items = invoiceItemStore.findByInvoiceId(invoice.id)
    return { ...invoice, items }
  })
}

export function canDeleteClient(clientId: string): { canDelete: boolean; blockingInvoiceIds: string[] } {
  const invoices = invoiceStore.findByClientId(clientId)
  const blockingInvoices = invoices.filter(invoice => 
    invoice.status !== 'paid' && invoice.status !== 'void'
  )
  
  return {
    canDelete: blockingInvoices.length === 0,
    blockingInvoiceIds: blockingInvoices.map(inv => inv.id)
  }
}