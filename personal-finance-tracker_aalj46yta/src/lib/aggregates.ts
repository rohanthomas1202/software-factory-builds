/**
 * Pure functions for computing dashboard aggregates and charts
 */

import { Transaction, Category, DashboardSummary, TransactionType } from './types';

/**
 * Get the start and end dates for a given month in a specific timezone
 */
export function getMonthRange(year: number, month: number, timezone: string): { start: Date; end: Date } {
  // Create date in the target timezone
  const start = new Date(Date.UTC(year, month - 1, 1));
  const startInTimezone = new Date(start.toLocaleString('en-US', { timeZone: timezone }));
  startInTimezone.setHours(0, 0, 0, 0);
  
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  const endInTimezone = new Date(end.toLocaleString('en-US', { timeZone: timezone }));
  endInTimezone.setHours(23, 59, 59, 999);
  
  return { start: startInTimezone, end: endInTimezone };
}

/**
 * Get current year and month (1-indexed) in the given timezone
 */
export function getCurrentMonthInTimezone(timezone: string): { year: number; month: number } {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'numeric',
  });
  
  const parts = formatter.formatToParts(now);
  const year = parseInt(parts.find(p => p.type === 'year')?.value || '0');
  const month = parseInt(parts.find(p => p.type === 'month')?.value || '0');
  
  return { year, month };
}

/**
 * Filter transactions for a specific month based on timezone
 */
export function getTransactionsForMonth(
  transactions: Transaction[],
  year: number,
  month: number,
  timezone: string
): Transaction[] {
  const { start, end } = getMonthRange(year, month, timezone);
  
  return transactions.filter(transaction => {
    const transactionDate = new Date(transaction.transactionDate);
    return transactionDate >= start && transactionDate <= end;
  });
}

/**
 * Data structure for pie chart segments (expenses only)
 */
export interface PieChartData {
  categoryId: string;
  categoryName: string;
  categoryColor: string | null;
  amountCents: number;
  percentage: number;
}

/**
 * Complete dashboard aggregates including summary and chart data
 */
export interface DashboardAggregates {
  summary: DashboardSummary;
  pieChartData: PieChartData[];
}

/**
 * Compute all dashboard aggregates for given transactions and categories
 */
export function computeDashboardAggregates(
  transactions: Transaction[],
  categories: Category[]
): DashboardAggregates {
  // Initialize totals
  let totalIncomeCents = 0;
  let totalExpensesCents = 0;
  
  // Map category ID to spent amount
  const categorySpentMap = new Map<string, number>();
  const categoryMap = new Map<string, Category>();
  
  // Initialize category spent amounts to 0
  categories.forEach(category => {
    categorySpentMap.set(category.id, 0);
    categoryMap.set(category.id, category);
  });
  
  // Process transactions
  transactions.forEach(transaction => {
    const amount = transaction.amountCents;
    
    if (transaction.type === 'INCOME') {
      totalIncomeCents += amount;
    } else if (transaction.type === 'EXPENSE') {
      totalExpensesCents += amount;
      
      // Only track expenses with categories
      if (transaction.categoryId) {
        const current = categorySpentMap.get(transaction.categoryId) || 0;
        categorySpentMap.set(transaction.categoryId, current + amount);
      }
    }
  });
  
  // Calculate net
  const netCents = totalIncomeCents - totalExpensesCents;
  
  // Build category spending array
  const categorySpending = Array.from(categorySpentMap.entries()).map(([categoryId, spentCents]) => {
    const category = categoryMap.get(categoryId);
    const monthlyLimitCents = category?.monthlyLimitCents || 0;
    const percentage = monthlyLimitCents > 0 ? Math.min((spentCents / monthlyLimitCents) * 100, 100) : 0;
    
    return {
      categoryId,
      categoryName: category?.name || 'Uncategorized',
      categoryColor: category?.colorHex || null,
      spentCents,
      monthlyLimitCents,
      percentage: Math.round(percentage * 100) / 100, // Round to 2 decimal places
    };
  });
  
  // Build pie chart data (expenses only, exclude categories with 0 spent)
  const totalExpenses = totalExpensesCents > 0 ? totalExpensesCents : 1; // Avoid division by zero
  const pieChartData = categorySpending
    .filter(item => item.spentCents > 0)
    .map(item => ({
      categoryId: item.categoryId,
      categoryName: item.categoryName,
      categoryColor: item.categoryColor,
      amountCents: item.spentCents,
      percentage: Math.round((item.spentCents / totalExpenses) * 100 * 100) / 100,
    }))
    .sort((a, b) => b.amountCents - a.amountCents); // Sort by amount descending
  
  // Build summary
  const summary: DashboardSummary = {
    totalIncomeCents,
    totalExpensesCents,
    netCents,
    categorySpending,
  };
  
  return {
    summary,
    pieChartData,
  };
}