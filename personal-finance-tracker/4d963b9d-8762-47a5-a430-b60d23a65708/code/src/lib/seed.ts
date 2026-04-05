import { createUser } from './store'
import { createCategory } from './store'
import { createTransaction } from './store'
import { hashPassword } from './utils/password'

export async function seedDatabase(): Promise<void> {
  // Clear existing data
  require('./store').clearStore()

  // Create demo users
  const user1 = createUser({
    email: 'alice@example.com',
    passwordHash: await hashPassword('password123'),
    timezone: 'America/New_York',
  })

  const user2 = createUser({
    email: 'bob@example.com',
    passwordHash: await hashPassword('password456'),
    timezone: 'Europe/London',
  })

  // Categories for Alice
  const groceries = createCategory({
    userId: user1.id,
    name: 'Groceries',
    monthlyLimitCents: 60000, // $600
    colorHex: '#4CAF50',
  })

  const dining = createCategory({
    userId: user1.id,
    name: 'Dining',
    monthlyLimitCents: 30000, // $300
    colorHex: '#FF9800',
  })

  const entertainment = createCategory({
    userId: user1.id,
    name: 'Entertainment',
    monthlyLimitCents: 20000, // $200
    colorHex: '#9C27B0',
  })

  const transportation = createCategory({
    userId: user1.id,
    name: 'Transportation',
    monthlyLimitCents: 15000, // $150
    colorHex: '#2196F3',
  })

  // Categories for Bob
  const rent = createCategory({
    userId: user2.id,
    name: 'Rent',
    monthlyLimitCents: 120000, // $1200
    colorHex: '#F44336',
  })

  const utilities = createCategory({
    userId: user2.id,
    name: 'Utilities',
    monthlyLimitCents: 30000, // $300
    colorHex: '#00BCD4',
  })

  // Transactions for Alice (current month)
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  // Alice's income
  createTransaction({
    userId: user1.id,
    amountCents: 450000, // $4500
    transactionDate: new Date(currentYear, currentMonth, 1),
    type: 'INCOME',
    categoryId: null,
    note: 'Monthly salary',
  })

  // Alice's expenses
  createTransaction({
    userId: user1.id,
    amountCents: 12500, // $125
    transactionDate: new Date(currentYear, currentMonth, 2),
    type: 'EXPENSE',
    categoryId: groceries.id,
    note: 'Weekly groceries',
  })

  createTransaction({
    userId: user1.id,
    amountCents: 8500, // $85
    transactionDate: new Date(currentYear, currentMonth, 5),
    type: 'EXPENSE',
    categoryId: dining.id,
    note: 'Dinner with friends',
  })

  createTransaction({
    userId: user1.id,
    amountCents: 7500, // $75
    transactionDate: new Date(currentYear, currentMonth, 10),
    type: 'EXPENSE',
    categoryId: groceries.id,
    note: 'Supermarket run',
  })

  createTransaction({
    userId: user1.id,
    amountCents: 4500, // $45
    transactionDate: new Date(currentYear, currentMonth, 12),
    type: 'EXPENSE',
    categoryId: entertainment.id,
    note: 'Movie tickets',
  })

  createTransaction({
    userId: user1.id,
    amountCents: 6500, // $65
    transactionDate: new Date(currentYear, currentMonth, 15),
    type: 'EXPENSE',
    categoryId: transportation.id,
    note: 'Gas refill',
  })

  createTransaction({
    userId: user1.id,
    amountCents: 3500, // $35
    transactionDate: new Date(currentYear, currentMonth, 18),
    type: 'EXPENSE',
    categoryId: dining.id,
    note: 'Lunch delivery',
  })

  // Bob's income
  createTransaction({
    userId: user2.id,
    amountCents: 380000, // $3800
    transactionDate: new Date(currentYear, currentMonth, 1),
    type: 'INCOME',
    categoryId: null,
    note: 'Monthly salary',
  })

  // Bob's expenses
  createTransaction({
    userId: user2.id,
    amountCents: 120000, // $1200
    transactionDate: new Date(currentYear, currentMonth, 3),
    type: 'EXPENSE',
    categoryId: rent.id,
    note: 'Monthly rent',
  })

  createTransaction({
    userId: user2.id,
    amountCents: 8500, // $85
    transactionDate: new Date(currentYear, currentMonth, 7),
    type: 'EXPENSE',
    categoryId: utilities.id,
    note: 'Electricity bill',
  })

  createTransaction({
    userId: user2.id,
    amountCents: 4500, // $45
    transactionDate: new Date(currentYear, currentMonth, 14),
    type: 'EXPENSE',
    categoryId: utilities.id,
    note: 'Internet bill',
  })

  console.log('Database seeded successfully')
  console.log(`Created 2 users, 6 categories, and 10 transactions`)
}