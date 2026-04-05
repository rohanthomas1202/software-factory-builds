export type TransactionType = 'INCOME' | 'EXPENSE'

export interface User {
  id: string
  email: string
  passwordHash: string
  timezone: string
  createdAt: Date
}

export interface Category {
  id: string
  userId: string
  name: string
  monthlyLimitCents: number
  colorHex: string | null
  createdAt: Date
}

export interface Transaction {
  id: string
  userId: string
  amountCents: number
  transactionDate: Date
  type: TransactionType
  categoryId: string | null
  note: string | null
  createdAt: Date
}

export interface DashboardSummary {
  totalIncomeCents: number
  totalExpensesCents: number
  netCents: number
  categorySpending: Array<{
    categoryId: string
    categoryName: string
    categoryColor: string | null
    spentCents: number
    monthlyLimitCents: number
    percentage: number
  }>
}

export interface RegisterRequest {
  email: string
  password: string
  timezone: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface CreateCategoryRequest {
  name: string
  monthlyLimitCents: number
  colorHex: string | null
}

export interface UpdateCategoryRequest {
  name?: string
  monthlyLimitCents?: number
  colorHex?: string | null
}

export interface CreateTransactionRequest {
  amount: string | number
  transactionDate: string
  type: TransactionType
  categoryId: string | null
  note: string | null
}

export interface UpdateTransactionRequest {
  amount?: string | number
  transactionDate?: string
  type?: TransactionType
  categoryId?: string | null
  note?: string | null
}

export interface Session {
  userId: string
  email: string
  timezone: string
}

export interface ApiResponse<T = any> {
  data?: T
  error?: string
}