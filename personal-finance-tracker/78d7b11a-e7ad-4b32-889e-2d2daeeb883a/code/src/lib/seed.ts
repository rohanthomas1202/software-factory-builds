import { createUser } from './auth';
import { createCategory } from './store';
import { createTransaction } from './store';
import { createOrUpdateMonthlyBudget } from './store';
import { hashPassword } from './auth';

export function seedDatabase() {
  // Only seed if no users exist
  const users = (global as any).store?.users;
  if (users && users.size > 0) {
    return;
  }

  // Create demo user
  const demoUser = createUser('demo@example.com', 'demo123');
  
  // Create categories
  const categories = [
    { name: 'Groceries', color: '#3B82F6' },
    { name: 'Dining Out', color: '#10B981' },
    { name: 'Transportation', color: '#F59E0B' },
    { name: 'Entertainment', color: '#8B5CF6' },
    { name: 'Shopping', color: '#EC4899' },
    { name: 'Utilities', color: '#6366F1' },
    { name: 'Rent', color: '#14B8A6' },
    { name: 'Salary', color: '#84CC16' },
  ].map((cat, index) => 
    createCategory({
      userId: demoUser.id,
      name: cat.name,
      color: cat.color,
    })
  );

  const currentDate = new Date();
  const currentMonth = currentDate.toISOString().slice(0, 7); // YYYY-MM
  
  // Set monthly budgets
  const budgets = [
    { categoryId: categories[0].id, limitCents: 50000 }, // $500 for groceries
    { categoryId: categories[1].id, limitCents: 20000 }, // $200 for dining
    { categoryId: categories[2].id, limitCents: 15000 }, // $150 for transportation
    { categoryId: categories[3].id, limitCents: 10000 }, // $100 for entertainment
    { categoryId: categories[4].id, limitCents: 30000 }, // $300 for shopping
    { categoryId: categories[5].id, limitCents: 25000 }, // $250 for utilities
    { categoryId: categories[6].id, limitCents: 120000 }, // $1200 for rent
    { categoryId: categories[7].id, limitCents: 0 }, // Income category, no limit
  ];

  budgets.forEach(budget => {
    createOrUpdateMonthlyBudget({
      userId: demoUser.id,
      categoryId: budget.categoryId,
      month: currentMonth,
      limitCents: budget.limitCents,
    });
  });

  // Create some sample transactions for the current month
  const transactions = [
    { amountCents: 12599, type: 'EXPENSE' as const, categoryId: categories[0].id, notes: 'Weekly grocery run' },
    { amountCents: 4567, type: 'EXPENSE' as const, categoryId: categories[1].id, notes: 'Dinner with friends' },
    { amountCents: 3200, type: 'EXPENSE' as const, categoryId: categories[2].id, notes: 'Gas refill' },
    { amountCents: 2999, type: 'EXPENSE' as const, categoryId: categories[3].id, notes: 'Movie tickets' },
    { amountCents: 8999, type: 'EXPENSE' as const, categoryId: categories[4].id, notes: 'New shoes' },
    { amountCents: 12000, type: 'EXPENSE' as const, categoryId: categories[5].id, notes: 'Electric bill' },
    { amountCents: 120000, type: 'EXPENSE' as const, categoryId: categories[6].id, notes: 'Monthly rent' },
    { amountCents: 350000, type: 'INCOME' as const, categoryId: categories[7].id, notes: 'Monthly salary' },
  ];

  transactions.forEach((tx, index) => {
    const date = new Date();
    date.setDate(date.getDate() - index * 3); // Spread transactions over past few weeks
    
    createTransaction({
      userId: demoUser.id,
      amountCents: tx.amountCents,
      date: date.toISOString().split('T')[0],
      categoryId: tx.categoryId,
      type: tx.type,
      notes: tx.notes,
    });
  });

  console.log('Database seeded with demo data');
}