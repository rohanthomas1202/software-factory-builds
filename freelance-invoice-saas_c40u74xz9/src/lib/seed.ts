import { store } from './store';
import type { User, Client, Invoice, TaxRate, LineItem } from './types';

// Mock data for development
const mockUsers: Omit<User, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    email: 'demo@example.com',
    name: 'Demo User',
    companyName: 'Demo Co.',
    address: '123 Main St, City, Country',
    phone: '+1 (555) 123-4567',
    website: 'https://demo.example.com',
    passwordHash: '$2b$10$3euPcmQFCiblsZeEu5s7p.9OVHgeHWFCkO.Nc8q9zJzNtLx.FQkFm', // "password123"
  },
];

const mockClients: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    userId: '', // Will be set with actual user ID
    name: 'Acme Corporation',
    email: 'billing@acme.com',
    billingAddress: '456 Business Ave, Metropolis, USA',
    phone: '+1 (555) 987-6543',
    companyName: 'Acme Corporation',
    isArchived: false,
  },
  {
    userId: '', // Will be set with actual user ID
    name: 'Jane Smith',
    email: 'jane@smithdesigns.com',
    billingAddress: '789 Creative Blvd, Art City, USA',
    phone: '+1 (555) 456-7890',
    companyName: 'Smith Designs LLC',
    isArchived: false,
  },
  {
    userId: '', // Will be set with actual user ID
    name: 'Global Tech Solutions',
    email: 'accounts@globaltech.com',
    billingAddress: '321 Innovation Dr, Tech Park, USA',
    phone: '+1 (555) 321-0987',
    companyName: 'Global Tech Solutions Inc.',
    isArchived: false,
  },
];

const mockTaxRates: Omit<TaxRate, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    userId: '', // Will be set with actual user ID
    name: 'Standard VAT',
    rate: 20,
    isDefault: true,
    isArchived: false,
  },
  {
    userId: '', // Will be set with actual user ID
    name: 'Reduced VAT',
    rate: 10,
    isDefault: false,
    isArchived: false,
  },
  {
    userId: '', // Will be set with actual user ID
    name: 'No Tax',
    rate: 0,
    isDefault: false,
    isArchived: false,
  },
];

export function seedDatabase(): void {
  console.log('Seeding database...');
  
  // Clear existing data
  store.users.clear();
  store.clients.clear();
  store.invoices.clear();
  store.taxRates.clear();
  store.sessions.clear();
  store.emailLogs.clear();
  
  // Create users
  const users: User[] = [];
  mockUsers.forEach(userData => {
    const id = store.generateId();
    const now = new Date();
    const user: User = {
      ...userData,
      id,
      createdAt: now,
      updatedAt: now,
    };
    store.users.set(id, user);
    users.push(user);
  });
  
  // Create tax rates for each user
  users.forEach(user => {
    mockTaxRates.forEach(taxRateData => {
      const id = store.generateId();
      const now = new Date();
      const taxRate: TaxRate = {
        ...taxRateData,
        id,
        userId: user.id,
        createdAt: now,
        updatedAt: now,
      };
      store.taxRates.set(id, taxRate);
    });
  });
  
  // Create clients for each user
  users.forEach(user => {
    mockClients.forEach(clientData => {
      const id = store.generateId();
      const now = new Date();
      const client: Client = {
        ...clientData,
        id,
        userId: user.id,
        createdAt: now,
        updatedAt: now,
      };
      store.clients.set(id, client);
    });
  });
  
  // Create sample invoices for first user
  const firstUser = users[0];
  if (firstUser) {
    const userClients = Array.from(store.clients.values())
      .filter(client => client.userId === firstUser.id);
    const userTaxRates = Array.from(store.taxRates.values())
      .filter(taxRate => taxRate.userId === firstUser.id);
    
    const sampleInvoices = [
      {
        clientId: userClients[0]?.id || '',
        invoiceNumber: store.generateInvoiceNumber(firstUser.id),
        status: 'draft' as const,
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        currency: 'USD',
        notes: 'Thank you for your business!',
        terms: 'Payment due within 30 days',
        subtotalCents: 750000, // $7,500.00
        discountAmountCents: 50000, // $500.00
        taxAmountCents: 140000, // $1,400.00
        totalCents: 840000, // $8,400.00
        discount: { type: 'fixed' as const, value: 50000 },
        taxRate: userTaxRates.find(t => t.isDefault) || userTaxRates[0],
      },
      {
        clientId: userClients[1]?.id || '',
        invoiceNumber: store.generateInvoiceNumber(firstUser.id),
        status: 'sent' as const,
        issueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        dueDate: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000), // 23 days from now
        currency: 'USD',
        notes: 'Design services completed',
        terms: 'Payment due within 14 days',
        subtotalCents: 250000, // $2,500.00
        discountAmountCents: 0,
        taxAmountCents: 50000, // $500.00
        totalCents: 300000, // $3,000.00
        discount: { type: 'percentage' as const, value: 0 },
        taxRate: userTaxRates.find(t => t.isDefault) || userTaxRates[0],
        sentAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      },
      {
        clientId: userClients[2]?.id || '',
        invoiceNumber: store.generateInvoiceNumber(firstUser.id),
        status: 'paid' as const,
        issueDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        dueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        currency: 'USD',
        notes: 'Consulting services',
        terms: 'Net 15',
        subtotalCents: 1000000, // $10,000.00
        discountAmountCents: 100000, // $1,000.00 (10% discount)
        taxAmountCents: 180000, // $1,800.00
        totalCents: 1080000, // $10,800.00
        discount: { type: 'percentage' as const, value: 10 },
        taxRate: userTaxRates.find(t => t.isDefault) || userTaxRates[0],
        sentAt: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000),
        paidAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      },
    ];
    
    sampleInvoices.forEach(invoiceData => {
      const id = store.generateId();
      const now = new Date();
      const invoice: Invoice = {
        ...invoiceData,
        id,
        userId: firstUser.id,
        createdAt: now,
        updatedAt: now,
        taxRate: invoiceData.taxRate, // This will be replaced with just the ID in a real implementation
      } as Invoice; // Type assertion because taxRate is currently the full object
      
      store.invoices.set(id, invoice);
    });
  }
  
  console.log('Database seeded successfully!');
  console.log('Store stats:', store.getStoreStats());
}