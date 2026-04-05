'use client';

import { useState, useEffect, useCallback } from 'react';
import { Transaction } from '@/lib/types';
import { MonthlyBudgetSummary } from '@/lib/types';
import TransactionForm from '@/components/TransactionForm';
import BudgetProgressBar from '@/components/BudgetProgressBar';
import MonthPicker from '@/components/MonthPicker';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorDisplay from '@/components/ErrorDisplay';
import Link from 'next/link';

interface TransactionsResponse {
  data: Transaction[];
}

interface BudgetSummaryResponse {
  data: MonthlyBudgetSummary[];
}

interface ApiError {
  error: string;
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function DashboardPage() {
  const [currentMonth, setCurrentMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgetSummaries, setBudgetSummaries] = useState<MonthlyBudgetSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [transactionsRes, budgetRes] = await Promise.all([
        fetch(`/api/transactions?limit=10&month=${currentMonth}`),
        fetch(`/api/budgets/summary?month=${currentMonth}`),
      ]);

      if (!transactionsRes.ok) {
        const errorData: ApiError = await transactionsRes.json();
        throw new Error(errorData.error || 'Failed to fetch transactions');
      }

      if (!budgetRes.ok) {
        const errorData: ApiError = await budgetRes.json();
        throw new Error(errorData.error || 'Failed to fetch budget summary');
      }

      const transactionsData: TransactionsResponse = await transactionsRes.json();
      const budgetData: BudgetSummaryResponse = await budgetRes.json();

      setTransactions(transactionsData.data);
      setBudgetSummaries(budgetData.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    try {
      setDeletingId(id);
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        throw new Error(errorData.error || 'Failed to delete transaction');
      }

      // Refresh data
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete transaction');
    } finally {
      setDeletingId(null);
    }
  };

  const handleTransactionFormSuccess = async () => {
    setShowTransactionForm(false);
    await fetchData();
  };

  const handleTransactionFormCancel = () => {
    setShowTransactionForm(false);
  };

  const handleMonthChange = (month: string) => {
    setCurrentMonth(month);
  };

  const totalIncome = transactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amountCents, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amountCents, 0);

  const netBalance = totalIncome - totalExpenses;

  if (loading && transactions.length === 0 && budgetSummaries.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error && transactions.length === 0 && budgetSummaries.length === 0) {
    return (
      <ErrorDisplay
        title="Failed to load dashboard"
        message={error}
        onRetry={fetchData}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Track your finances and budget progress</p>
        </div>
        <button
          onClick={() => setShowTransactionForm(true)}
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Transaction
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Income</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {formatCurrency(totalIncome)}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {formatCurrency(totalExpenses)}
              </p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Net Balance</p>
              <p className={`text-2xl font-bold mt-1 ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(netBalance)}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${netBalance >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              <svg className={`w-6 h-6 ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Budget Summary Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-gray-900">Budget Progress</h2>
            <div className="flex items-center gap-4">
              <MonthPicker value={currentMonth} onChange={handleMonthChange} className="w-48" />
              <Link
                href="/budget"
                className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
              >
                Manage Budgets
              </Link>
            </div>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600">{error}</p>
              <button
                onClick={fetchData}
                className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                Try again
              </button>
            </div>
          ) : budgetSummaries.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No budgets set up for this month</p>
              <Link
                href="/budget"
                className="inline-block mt-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
              >
                Set up your first budget
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {budgetSummaries.map((summary) => (
                <BudgetProgressBar
                  key={summary.categoryId}
                  summary={summary}
                  showDetails={true}
                  className="p-4 bg-gray-50 rounded-lg"
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Recent Transactions</h2>
          <Link
            href="/transactions"
            className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
          >
            View all
          </Link>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600">{error}</p>
              <button
                onClick={fetchData}
                className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                Try again
              </button>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-12 h-12 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="mt-4 text-gray-500">No transactions yet</p>
              <button
                onClick={() => setShowTransactionForm(true)}
                className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
              >
                Add your first transaction
              </button>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(transaction.date)}
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <div className="text-sm text-gray-900 truncate">
                        {transaction.notes || 'No description'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: `${transaction.categoryId ? 'transparent' : '#f3f4f6'}`,
                          color: transaction.categoryId ? '#374151' : '#6b7280',
                        }}
                      >
                        {transaction.categoryId || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`text-sm font-medium ${
                          transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {transaction.type === 'INCOME' ? '+' : '-'}
                        {formatCurrency(transaction.amountCents)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleDeleteTransaction(transaction.id)}
                        disabled={deletingId === transaction.id}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deletingId === transaction.id ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Transaction Form Modal */}
      {showTransactionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Add Transaction</h3>
                <button
                  onClick={handleTransactionFormCancel}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <TransactionForm
                onSuccess={handleTransactionFormSuccess}
                onCancel={handleTransactionFormCancel}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}