import { userStore, clientStore, taxRateStore, invoiceStore, invoiceItemStore } from './store'
import { hashUserPassword } from './auth'
import { v4 as uuidv4 } from 'uuid'

export async function seedDemoData(): Promise<void> {
  // Clear existing data
  ;[userStore, clientStore, taxRateStore, invoiceStore, invoiceItemStore].forEach(store => {
    const all = store.getAll()
    all.forEach(item => store.delete(item.id))
  })

  // Create demo user
  const demoUser = userStore.create({
    id: 'demo-user-1',
    email: 'demo@example.com',
    passwordHash: await hashUserPassword('demo123'),
    businessName: 'Demo Freelancer',
    businessAddress: '123 Business St, City, State 12345, USA',
    businessLogo: '',
    invoiceNumberPrefix: 'INV-',
    invoiceNumberCounter: 3,
    currency: 'USD',
    timezone: 'America/New_York',
    createdAt: Date.now(),
    updatedAt: Date.now()
  })

  // Create clients
  const client1 = clientStore.create({
    id: 'client-1',
    userId: demoUser.id,
    name: 'Acme Corporation',
    email: 'billing@acme.com',
    companyName: 'Acme Corporation',
    billingAddress: {
      street: '456 Corporate Ave',
      city: 'Metropolis',
      state: 'NY',
      postalCode: '10001',
      country: 'USA'
    },
    currency: 'USD',
    deletedAt: null,
    createdAt: Date.now(),
    updatedAt: Date.now()
  })

  const client2 = clientStore.create({
    id: 'client-2',
    userId: demoUser.id,
    name: 'Jane Smith',
    email: 'jane@example.com',
    companyName: null,
    billingAddress: {
      street: '789 Personal Ln',
      city: 'Smalltown',
      state: 'CA',
      postalCode: '90210',
      country: 'USA'
    },
    currency: 'USD',
    deletedAt: null,
    createdAt: Date.now(),
    updatedAt: Date.now()
  })

  // Create tax rates
  const tax1 = taxRateStore.create({
    id: 'tax-1',
    userId: demoUser.id,
    name: 'Sales Tax',
    rate: 8.5,
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  })

  const tax2 = taxRateStore.create({
    id: 'tax-2',
    userId: demoUser.id,
    name: 'VAT',
    rate: 20,
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  })

  // Create invoices
  const invoice1 = invoiceStore.create({
    id: 'invoice-1',
    userId: demoUser.id,
    clientId: client1.id,
    invoiceNumber: 'INV-0001',
    status: 'sent',
    issueDate: Date.now() - 30 * 24 * 60 * 60 * 1000,
    dueDate: Date.now() - 15 * 24 * 60 * 60 * 1000,
    paymentTerms: 30,
    notes: 'Thank you for your business!',
    terms: 'Payment due within 30 days',
    currency: 'USD',
    subtotal: 1500,
    taxAmount: 127.5,
    total: 1627.5,
    sentAt: Date.now() - 29 * 24 * 60 * 60 * 1000,
    paidAt: null,
    viewedAt: Date.now() - 28 * 24 * 60 * 60 * 1000,
    token: uuidv4(),
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 29 * 24 * 60 * 60 * 1000
  })

  const invoice2 = invoiceStore.create({
    id: 'invoice-2',
    userId: demoUser.id,
    clientId: client1.id,
    invoiceNumber: 'INV-0002',
    status: 'paid',
    issueDate: Date.now() - 15 * 24 * 60 * 60 * 1000,
    dueDate: Date.now() - 5 * 24 * 60 * 60 * 1000,
    paymentTerms: 15,
    notes: 'Project completion',
    terms: 'Payment due within 15 days',
    currency: 'USD',
    subtotal: 2500,
    taxAmount: 212.5,
    total: 2712.5,
    sentAt: Date.now() - 14 * 24 * 60 * 60 * 1000,
    paidAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
    viewedAt: Date.now() - 13 * 24 * 60 * 60 * 1000,
    token: uuidv4(),
    createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 7 * 24 * 60 * 60 * 1000
  })

  const invoice3 = invoiceStore.create({
    id: 'invoice-3',
    userId: demoUser.id,
    clientId: client2.id,
    invoiceNumber: 'INV-0003',
    status: 'draft',
    issueDate: Date.now(),
    dueDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
    paymentTerms: 30,
    notes: '',
    terms: 'Standard terms apply',
    currency: 'USD',
    subtotal: 1200,
    taxAmount: 102,
    total: 1302,
    sentAt: null,
    paidAt: null,
    viewedAt: null,
    token: uuidv4(),
    createdAt: Date.now(),
    updatedAt: Date.now()
  })

  // Create invoice items
  invoiceItemStore.create({
    id: 'item-1',
    invoiceId: invoice1.id,
    description: 'Website Design',
    quantity: 10,
    rate: 100,
    taxRateId: tax1.id,
    sortOrder: 0,
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000
  })

  invoiceItemStore.create({
    id: 'item-2',
    invoiceId: invoice1.id,
    description: 'Hosting Setup',
    quantity: 1,
    rate: 500,
    taxRateId: null,
    sortOrder: 1,
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000
  })

  invoiceItemStore.create({
    id: 'item-3',
    invoiceId: invoice2.id,
    description: 'E-commerce Development',
    quantity: 25,
    rate: 100,
    taxRateId: tax1.id,
    sortOrder: 0,
    createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000
  })

  invoiceItemStore.create({
    id: 'item-4',
    invoiceId: invoice3.id,
    description: 'Consulting Services',
    quantity: 8,
    rate: 150,
    taxRateId: tax2.id,
    sortOrder: 0,
    createdAt: Date.now()
  })
}