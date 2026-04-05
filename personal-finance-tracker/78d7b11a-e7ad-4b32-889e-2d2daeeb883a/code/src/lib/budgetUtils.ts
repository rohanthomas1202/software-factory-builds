import { getTransactionsByUser, getMonthlyBudgetByUserAndCategory, getCategoryById, getMonthlyBudgetsByUser } from './store';
import type { MonthlyBudget, MonthlyBudgetSummary } from './types';

/**
 * Calculate total spent cents for a specific category in a given month
 */
export function calculateSpentCents(
  userId: string,
  categoryId: string,
  month: string
): number {
  const transactions = getTransactionsByUser(userId, { 
    categoryId, 
    month 
  });
  
  return transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amountCents, 0);
}

/**
 * Get monthly budget for a user, category, and month
 */
export function getMonthlyBudget(
  userId: string,
  categoryId: string,
  month: string
): MonthlyBudget | undefined {
  return getMonthlyBudgetByUserAndCategory(userId, categoryId, month);
}

/**
 * Check if adding an amount would trigger a budget warning (≥90% of limit)
 * Returns warning message if threshold is crossed, null otherwise
 */
export function checkBudgetWarning(
  userId: string,
  categoryId: string,
  month: string,
  additionalAmountCents: number
): string | null {
  const budget = getMonthlyBudget(userId, categoryId, month);
  if (!budget || budget.limitCents <= 0) return null;
  
  const spentCents = calculateSpentCents(userId, categoryId, month);
  const newTotal = spentCents + additionalAmountCents;
  const percentage = (newTotal / budget.limitCents) * 100;
  
  if (percentage >= 90) {
    return `This transaction would bring you to ${Math.round(percentage)}% of your budget limit for this category.`;
  }
  
  return null;
}

/**
 * Calculate budget summaries for all categories in a given month
 */
export function calculateBudgetSummaries(
  userId: string,
  month: string
): MonthlyBudgetSummary[] {
  const budgets = getMonthlyBudgetsByUser(userId, month);
  
  return budgets.map(budget => {
    const spentCents = calculateSpentCents(userId, budget.categoryId, month);
    const category = getCategoryById(budget.categoryId);
    const remainingCents = Math.max(0, budget.limitCents - spentCents);
    const percentageUsed = budget.limitCents > 0 
      ? (spentCents / budget.limitCents) * 100 
      : 0;
    
    return {
      categoryId: budget.categoryId,
      categoryName: category?.name || 'Unknown Category',
      categoryColor: category?.color || '#9CA3AF',
      spentCents,
      limitCents: budget.limitCents,
      remainingCents,
      percentageUsed
    };
  });
}

/**
 * Update budget summary after transaction changes
 * This is a no-op in the in-memory store since summaries are calculated on demand
 */
export function updateBudgetSummary(
  userId: string,
  categoryId: string,
  date: string
): void {
  // No-op: summaries are calculated on demand from transactions
  // This function exists for API compatibility
}