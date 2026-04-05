import { v4 as uuidv4 } from 'uuid';
import { User, Category, Transaction, MonthlyBudget } from './types';

// In-memory data stores
const users = new Map<string, User>();
const categories = new Map<string, Category>();
const transactions = new Map<string, Transaction>();
const monthlyBudgets = new Map<string, MonthlyBudget>();

// Helper functions for data isolation
export function getUserById(userId: string): User | undefined {
  return users.get(userId);
}

export function getUserByEmail(email: string): User | undefined {
  return Array.from(users.values()).find(user => user.email === email);
}

export function createUser(user: Omit<User, 'createdAt'>): User {
  const newUser: User = {
    ...user,
    createdAt: new Date(),
  };
  users.set(newUser.id, newUser);
  return newUser;
}

export function getCategoriesByUser(userId: string): Category[] {
  return Array.from(categories.values())
    .filter(category => category.userId === userId)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

export function getCategoryById(id: string): Category | undefined {
  return categories.get(id);
}

export function createCategory(category: Omit<Category, 'id' | 'createdAt'>): Category {
  const newCategory: Category = {
    ...category,
    id: uuidv4(),
    createdAt: new Date(),
  };
  categories.set(newCategory.id, newCategory);
  return newCategory;
}

export function updateCategory(id: string, updates: Partial<Omit<Category, 'id' | 'userId' | 'createdAt'>>): Category | undefined {
  const category = categories.get(id);
  if (!category) return undefined;

  const updatedCategory: Category = {
    ...category,
    ...updates,
  };
  categories.set(id, updatedCategory);
  return updatedCategory;
}

export function deleteCategory(id: string): boolean {
  return categories.delete(id);
}

export function getTransactionsByUser(userId: string, filters?: { categoryId?: string; month?: string }): Transaction[] {
  let userTransactions = Array.from(transactions.values())
    .filter(transaction => transaction.userId === userId);

  if (filters?.categoryId) {
    userTransactions = userTransactions.filter(t => t.categoryId === filters.categoryId);
  }

  if (filters?.month) {
    userTransactions = userTransactions.filter(t => t.date.startsWith(filters.month!));
  }

  return userTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getTransactionById(id: string): Transaction | undefined {
  return transactions.get(id);
}

export function createTransaction(transaction: Omit<Transaction, 'id' | 'createdAt'>): Transaction {
  const newTransaction: Transaction = {
    ...transaction,
    id: uuidv4(),
    createdAt: new Date(),
  };
  transactions.set(newTransaction.id, newTransaction);
  return newTransaction;
}

export function updateTransaction(id: string, updates: Partial<Omit<Transaction, 'id' | 'userId' | 'createdAt'>>): Transaction | undefined {
  const transaction = transactions.get(id);
  if (!transaction) return undefined;

  const updatedTransaction: Transaction = {
    ...transaction,
    ...updates,
  };
  transactions.set(id, updatedTransaction);
  return updatedTransaction;
}

export function deleteTransaction(id: string): boolean {
  return transactions.delete(id);
}

export function getMonthlyBudgetByUserAndCategory(userId: string, categoryId: string, month: string): MonthlyBudget | undefined {
  return Array.from(monthlyBudgets.values())
    .find(budget => 
      budget.userId === userId && 
      budget.categoryId === categoryId && 
      budget.month === month
    );
}

export function getMonthlyBudgetsByUser(userId: string, month?: string): MonthlyBudget[] {
  return Array.from(monthlyBudgets.values())
    .filter(budget => {
      if (budget.userId !== userId) return false;
      if (month && budget.month !== month) return false;
      return true;
    });
}

export function createOrUpdateMonthlyBudget(budget: Omit<MonthlyBudget, 'id' | 'createdAt'>): MonthlyBudget {
  // Check if budget already exists
  const existing = Array.from(monthlyBudgets.values())
    .find(b => 
      b.userId === budget.userId && 
      b.categoryId === budget.categoryId && 
      b.month === budget.month
    );

  if (existing) {
    const updatedBudget: MonthlyBudget = {
      ...existing,
      limitCents: budget.limitCents,
    };
    monthlyBudgets.set(existing.id, updatedBudget);
    return updatedBudget;
  }

  const newBudget: MonthlyBudget = {
    ...budget,
    id: uuidv4(),
    createdAt: new Date(),
  };
  monthlyBudgets.set(newBudget.id, newBudget);
  return newBudget;
}

export function deleteMonthlyBudget(id: string): boolean {
  return monthlyBudgets.delete(id);
}

// Utility function to clear all data (for testing/reset)
export function clearStore(): void {
  users.clear();
  categories.clear();
  transactions.clear();
  monthlyBudgets.clear();
}

// Export the store object for direct access if needed (though prefer using the helper functions)
export const store = {
  users,
  categories,
  transactions,
  monthlyBudgets,
};