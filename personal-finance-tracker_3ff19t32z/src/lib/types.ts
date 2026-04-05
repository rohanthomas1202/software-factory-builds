export interface User {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  color: string;
  createdAt: Date;
}

export interface Transaction {
  id: string;
  userId: string;
  amountCents: number;
  date: string; // ISO 8601
  categoryId: string;
  type: 'INCOME' | 'EXPENSE';
  notes: string;
  createdAt: Date;
}

export interface MonthlyBudget {
  id: string;
  userId: string;
  categoryId: string;
  month: string; // YYYY-MM
  limitCents: number;
  createdAt: Date;
}

export interface MonthlyBudgetSummary {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  spentCents: number;
  limitCents: number;
  remainingCents: number;
  percentageUsed: number;
}

export interface PieChartDataPoint {
  name: string;
  value: number;
  color: string;
}

export interface BarChartDataPoint {
  month: string; // YYYY-MM
  income: number;
  expenses: number;
}

export interface ApiSuccess<T> {
  data: T;
}

export interface ApiError {
  error: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// Helper type guard
export function isApiError(response: any): response is ApiError {
  return response && typeof response === 'object' && 'error' in response;
}