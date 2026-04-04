// Seed data for development and demonstration
import { store } from './store';
import { ExpenseCategory } from '@/types';

export async function seedDatabase() {
  console.log('Seeding database...');

  // Create a demo user
  const user = await store.createUser(
    'demo@example.com',
    'password123',
    'John Doe',
    'John Doe Consulting'
  );

  // Update user with additional details
  await store.updateUser(user.id, {
    phone: '+1 (555) 123-4567',
    website: 'https://johndoeconsulting.com',
    taxId: '12-3456789',
    address: {
      street: '123 Business Ave',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'United States',
    },
  });

  // Create sample clients
  const clients = [
    {
      name: 'Acme Corporation',
      email: 'billing@acme.com',
      company: 'Acme Corporation',
      phone: '+1 (555) 987-6543',
      address: {
        street: '456 Corporate Blvd',
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94107',
        country: 'United States',
      },
      taxId: '98-7654321',
      notes: 'Enterprise client, net 30 terms',
    },
    {
      name: 'Jane Smith',
      email: 'jane@startup.io',
      company: 'Startup.io',
      phone: '+1 (555) 456-7890',
      address: {
        street: '789 Innovation St',
        city: 'Austin',
        state: 'TX',
        postalCode: '73301',
        country: 'United States',
      },
      notes: 'Monthly retainer client',
    },
    {
      name: 'Global Solutions Ltd',
      email: 'accounts@globalsolutions.com',
      company: 'Global Solutions Ltd',
      phone: '+44 20 1234 5678',
      address: {
        street: '101 International Way',
        city: 'London',
        state: '',
        postalCode: 'EC1A 1BB',
        country: 'United Kingdom',
      },
      taxId: 'GB123456789',
      notes: 'International client, net 60 terms',
    },
  ];

  const createdClients = [];
  for (const clientData of clients) {
    const client = await store.createClient(user.id, clientData);
    createdClients.push(client);
  }

  // Create sample invoices
  const invoiceData = [
    {
      clientId: createdClients[0].id,
      invoiceNumber: 'INV-2024-1001',
      issueDate: new Date('2024-01-15'),
      dueDate: new Date('2024-02-14'),
      items: [
        {
          id: 'item_1',
          description: 'Website Redesign - Phase 1',
          quantity: 40,
          unitPrice: 125,
          taxRate: 8.5,
        },
        {
          id: 'item_2',
          description: 'Custom CMS Development',
          quantity: 60,
          unitPrice: 150,
          taxRate: 8.5,
        },
      ],
      taxRate: 8.5,
      notes: 'Please make payment within 30 days',
      terms: 'Net 30. Late payments subject to 1.5% monthly interest.',
    },
    {
      clientId: createdClients[1].id,
      invoiceNumber: 'INV-2024-1002',
      issueDate: new Date('2024-01-20'),
      dueDate: new Date('2024-02-19'),
      items: [
        {
          id: 'item_3',
          description: 'Monthly Retainer - January 2024',
          quantity: 1,
          unitPrice: 5000,
          taxRate: 0,
        },
        {
          id: 'item_4',
          description: 'Additional Consulting Hours',
          quantity: 10,
          unitPrice: 200,
          taxRate: 0,
        },
      ],
      taxRate: 0,
      discount: 500,
      notes: 'Thank you for your business!',
    },
    {
      clientId: createdClients[2].id,
      invoiceNumber: 'INV-2024-1003',
      issueDate: new Date('2024-02-01'),
      dueDate: new Date('2024-04-01'),
      items: [
        {
          id: 'item_5',
          description: 'International Consulting Services',
          quantity: 80,
          unitPrice: 175,
          taxRate: 0,
        },
      ],
      taxRate: 0,
      notes: 'Payment due in 60 days as per agreement',
    },
  ];

  const createdInvoices = [];
  for (const data of invoiceData) {
    const invoice = await store.createInvoice(user.id, data);
    createdInvoices.push(invoice);
  }

  // Update invoice statuses
  await store.updateInvoiceStatus(createdInvoices[0].id, 'paid');
  await store.updateInvoice(createdInvoices[0].id, { paidAt: new Date('2024-02-10') });
  
  await store.updateInvoiceStatus(createdInvoices[1].id, 'sent');
  await store.updateInvoice(createdInvoices[1].id, { sentAt: new Date('2024-01-21') });
  
  await store.updateInvoiceStatus(createdInvoices[2].id, 'draft');

  // Create sample expenses
  const expenseData = [
    {
      description: 'Adobe Creative Cloud Subscription',
      amount: 52.99,
      currency: 'USD',
      category: 'software' as ExpenseCategory,
      date: new Date('2024-01-05'),
      notes: 'Monthly subscription',
    },
    {
      description: 'Co-working Space - January',
      amount: 350,
      currency: 'USD',
      category: 'office' as ExpenseCategory,
      date: new Date('2024-01-10'),
    },
    {
      description: 'Client Meeting - Travel Expenses',
      amount: 245.50,
      currency: 'USD',
      category: 'travel' as ExpenseCategory,
      date: new Date('2024-01-18'),
      notes: 'Flight and hotel for client presentation',
    },
    {
      description: 'New Laptop for Development',
      amount: 1899.99,
      currency: 'USD',
      category: 'hardware' as ExpenseCategory,
      date: new Date('2024-01-25'),
      notes: 'MacBook Pro 16" for development work',
    },
    {
      description: 'Professional Liability Insurance',
      amount: 1200,
      currency: 'USD',
      category: 'professional' as ExpenseCategory,
      date: new Date('2024-01-30'),
      notes: 'Annual premium',
    },
  ];

  for (const data of expenseData) {
    await store.createExpense(user.id, data);
  }

  console.log('Database seeded successfully!');
  console.log(`Created: 1 user, ${clients.length} clients, ${invoiceData.length} invoices, ${expenseData.length} expenses`);

  return {
    user,
    clients: createdClients,
    invoices: createdInvoices,
  };
}

// Function to check if database needs seeding
export async function checkAndSeedDatabase() {
  const demoUser = await store.getUserByEmail('demo@example.com');
  if (!demoUser) {
    await seedDatabase();
  }
}