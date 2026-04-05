import { v4 as uuidv4 } from 'uuid'
import type { User, Category, Transaction, Session } from './types'

// In-memory storage
const users = new Map<string, User>()
const categories = new Map<string, Category>()
const transactions = new Map<string, Transaction>()
const sessions = new Map<string, Session>()

export function createUser(user: Omit<User, 'id' | 'createdAt'> & { id?: string }): User {
  const id = user.id || uuidv4()
  const newUser: User = {
    ...user,
    id,
    createdAt: new Date(),
  }
  users.set(id, newUser)
  return newUser
}

export function getUserById(id: string): User | undefined {
  return users.get(id)
}

export function getUserByEmail(email: string): User | undefined {
  return Array.from(users.values()).find((user) => user.email === email)
}

export function createCategory(category: Omit<Category, 'id' | 'createdAt'> & { id?: string }): Category {
  const id = category.id || uuidv4()
  const newCategory: Category = {
    ...category,
    id,
    createdAt: new Date(),
  }
  categories.set(id, newCategory)
  return newCategory
}

export function getCategoryById(id: string): Category | undefined {
  return categories.get(id)
}

export function getCategoriesByUserId(userId: string): Category[] {
  return Array.from(categories.values()).filter((category) => category.userId === userId)
}

export function updateCategory(id: string, updates: Partial<Category>): Category | undefined {
  const category = categories.get(id)
  if (!category) return undefined

  const updatedCategory = { ...category, ...updates }
  categories.set(id, updatedCategory)
  return updatedCategory
}

export function deleteCategory(id: string): boolean {
  return categories.delete(id)
}

export function getTransactionsByCategoryId(categoryId: string): Transaction[] {
  return Array.from(transactions.values()).filter(
    (transaction) => transaction.categoryId === categoryId
  )
}

export function createTransaction(transaction: Omit<Transaction, 'id' | 'createdAt'> & { id?: string }): Transaction {
  const id = transaction.id || uuidv4()
  const newTransaction: Transaction = {
    ...transaction,
    id,
    createdAt: new Date(),
  }
  transactions.set(id, newTransaction)
  return newTransaction
}

export function getTransactionById(id: string): Transaction | undefined {
  return transactions.get(id)
}

export function getTransactionsByUserId(
  userId: string,
  filters?: {
    startDate?: Date
    endDate?: Date
    categoryId?: string
    type?: Transaction['type']
  }
): Transaction[] {
  let result = Array.from(transactions.values()).filter(
    (transaction) => transaction.userId === userId
  )

  if (filters?.startDate) {
    result = result.filter((t) => t.transactionDate >= filters.startDate!)
  }

  if (filters?.endDate) {
    result = result.filter((t) => t.transactionDate <= filters.endDate!)
  }

  if (filters?.categoryId !== undefined) {
    if (filters.categoryId === null) {
      result = result.filter((t) => t.categoryId === null)
    } else {
      result = result.filter((t) => t.categoryId === filters.categoryId)
    }
  }

  if (filters?.type) {
    result = result.filter((t) => t.type === filters.type)
  }

  return result
}

export function updateTransaction(id: string, updates: Partial<Transaction>): Transaction | undefined {
  const transaction = transactions.get(id)
  if (!transaction) return undefined

  const updatedTransaction = { ...transaction, ...updates }
  transactions.set(id, updatedTransaction)
  return updatedTransaction
}

export function deleteTransaction(id: string): boolean {
  return transactions.delete(id)
}

export function createSession(userId: string, email: string, timezone: string): string {
  const sessionId = uuidv4()
  sessions.set(sessionId, { userId, email, timezone })
  return sessionId
}

export function getSession(sessionId: string): Session | undefined {
  return sessions.get(sessionId)
}

export function deleteSession(sessionId: string): boolean {
  return sessions.delete(sessionId)
}

export function clearStore(): void {
  users.clear()
  categories.clear()
  transactions.clear()
  sessions.clear()
}