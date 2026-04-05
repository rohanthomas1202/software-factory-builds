"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MonthPicker from "@/components/MonthPicker";
import BudgetProgressBar from "@/components/BudgetProgressBar";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorDisplay from "@/components/ErrorDisplay";
import { MonthlyBudgetSummary } from "@/lib/types";
import { isApiError } from "@/lib/types";

export default function BudgetPage() {
  const router = useRouter();
  const [month, setMonth] = useState<string>(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  });
  const [summaries, setSummaries] = useState<MonthlyBudgetSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalLimit, setTotalLimit] = useState(0);

  useEffect(() => {
    const fetchBudgetSummary = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/budgets/summary?month=${month}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch budget summary");
        }
        const data = await response.json();
        if (isApiError(data)) {
          throw new Error(data.error);
        }
        setSummaries(data.data as MonthlyBudgetSummary[]);
        
        // Calculate totals
        const spent = data.data.reduce((sum: number, s: MonthlyBudgetSummary) => sum + s.spentCents, 0);
        const limit = data.data.reduce((sum: number, s: MonthlyBudgetSummary) => sum + s.limitCents, 0);
        setTotalSpent(spent);
        setTotalLimit(limit);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBudgetSummary();
  }, [month]);

  const handleRetry = () => {
    router.refresh();
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Budget Overview</h1>
          <p className="text-gray-600 mt-2">
            Track your spending against monthly budgets
          </p>
        </div>
        <MonthPicker
          value={month}
          onChange={setMonth}
          className="w-full md:w-auto"
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-700 mb-2">Total Budget</h3>
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(totalLimit)}</p>
          <p className="text-sm text-gray-500 mt-2">Total allocated for {new Date(month + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-700 mb-2">Total Spent</h3>
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(totalSpent)}</p>
          <p className="text-sm text-gray-500 mt-2">
            {totalLimit > 0 
              ? `${Math.round((totalSpent / totalLimit) * 100)}% of budget used`
              : "No budget set"}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-700 mb-2">Remaining</h3>
          <p className={`text-3xl font-bold ${totalLimit - totalSpent >= 0 ? "text-green-600" : "text-red-600"}`}>
            {formatCurrency(totalLimit - totalSpent)}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {totalLimit - totalSpent >= 0 ? "Available to spend" : "Over budget"}
          </p>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6">
          <ErrorDisplay
            title="Failed to load budget data"
            message={error}
            onRetry={handleRetry}
          />
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        /* Content */
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {summaries.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg
                  className="mx-auto h-12 w-12"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No budgets found</h3>
              <p className="text-gray-600 max-w-md mx-auto mb-6">
                Set up budgets for your categories to track spending against limits.
              </p>
              <button
                onClick={() => router.push("/categories")}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Manage Categories
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 text-sm font-medium text-gray-700">
                <div className="col-span-4">Category</div>
                <div className="col-span-3">Progress</div>
                <div className="col-span-2 text-right">Spent</div>
                <div className="col-span-2 text-right">Limit</div>
                <div className="col-span-1 text-right">Remaining</div>
              </div>
              {summaries.map((summary) => (
                <div key={summary.categoryId} className="p-6 hover:bg-gray-50 transition-colors">
                  <BudgetProgressBar
                    summary={summary}
                    showDetails={true}
                    className="col-span-12"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}