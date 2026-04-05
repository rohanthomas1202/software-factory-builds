"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SummaryCards from "@/components/SummaryCards";
import ProgressBar from "@/components/ProgressBar";
import PieChart from "@/components/PieChart";
import { DashboardSummary, TransactionType } from "@/lib/types";
import { PieChartData } from "@/lib/aggregates";

interface DashboardResponse {
  data: {
    summary: DashboardSummary;
    pieChartData: PieChartData[];
  };
  error?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [pieChartData, setPieChartData] = useState<PieChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        const response = await fetch("/api/dashboard/summary");

        if (!response.ok) {
          throw new Error(`Failed to load dashboard data: ${response.status}`);
        }

        const result: DashboardResponse = await response.json();

        if (result.error) {
          throw new Error(result.error);
        }

        setSummary(result.data.summary);
        setPieChartData(result.data.pieChartData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const handlePieSegmentClick = (categoryId: string) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // 1-indexed month
    
    router.push(`/transactions?category=${categoryId}&year=${year}&month=${month}`);
  };

  const handleAddTransaction = () => {
    router.push("/transactions?action=add");
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="flex flex-col md:flex-row gap-8">
            <div className="h-64 bg-gray-200 rounded md:w-1/2"></div>
            <div className="h-64 bg-gray-200 rounded md:w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Dashboard</h2>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-700 mb-4">Welcome to Your Finance Dashboard</h1>
          <p className="text-gray-600 mb-8">
            Start by adding categories and transactions to see your financial overview
          </p>
          <div className="space-x-4">
            <button
              onClick={() => router.push("/categories")}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Add Categories
            </button>
            <button
              onClick={handleAddTransaction}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
            >
              Add Transaction
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Financial Dashboard</h1>
        <p className="text-gray-600 mt-2">Overview of your monthly spending and budget</p>
      </div>

      <div className="mb-8">
        <SummaryCards summary={summary} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Pie Chart Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Spending by Category</h2>
            <span className="text-sm text-gray-500">Click segment to view transactions</span>
          </div>
          <div className="flex justify-center">
            <PieChart
              data={pieChartData}
              onSegmentClick={handlePieSegmentClick}
              size={300}
              className="mx-auto"
            />
          </div>
          {pieChartData.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No expense data available. Add expense transactions to see the breakdown.
            </div>
          )}
        </div>

        {/* Budget Progress Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Budget Progress</h2>
            <span className="text-sm text-gray-500">
              {summary.categorySpending.length} {summary.categorySpending.length === 1 ? "category" : "categories"}
            </span>
          </div>
          <div className="space-y-6">
            {summary.categorySpending.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No categories with budget limits. Add budget limits to track spending.
              </div>
            ) : (
              summary.categorySpending.map((category) => {
                const percentage = (category.spentCents / category.monthlyLimitCents) * 100;
                const isOverBudget = category.spentCents > category.monthlyLimitCents;
                const isNearBudget = percentage >= 80 && !isOverBudget;

                return (
                  <div key={category.categoryId} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {category.categoryColor && (
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: category.categoryColor }}
                          />
                        )}
                        <span className="font-medium text-gray-800">{category.categoryName}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">
                          ${(category.spentCents / 100).toFixed(2)}
                          <span className="text-gray-500 text-sm font-normal">
                            {" "}/ ${(category.monthlyLimitCents / 100).toFixed(2)}
                          </span>
                        </div>
                        <div className={`text-sm ${isOverBudget ? "text-red-600" : "text-gray-500"}`}>
                          {percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    <ProgressBar
                      spentCents={category.spentCents}
                      limitCents={category.monthlyLimitCents}
                      showLabels={false}
                      className={isOverBudget ? "border-red-200" : isNearBudget ? "border-yellow-200" : ""}
                    />
                    {isOverBudget && (
                      <div className="text-sm text-red-600 font-medium">
                        Over budget by ${((category.spentCents - category.monthlyLimitCents) / 100).toFixed(2)}
                      </div>
                    )}
                    {isNearBudget && !isOverBudget && (
                      <div className="text-sm text-yellow-600 font-medium">Approaching budget limit</div>
                    )}
                  </div>
                );
              })
            )}
          </div>
          <div className="mt-8 pt-6 border-t border-gray-100">
            <button
              onClick={() => router.push("/categories")}
              className="w-full py-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition font-medium border border-blue-200"
            >
              Manage Budget Categories
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={handleAddTransaction}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
          >
            Add Transaction
          </button>
          <button
            onClick={() => router.push("/transactions")}
            className="px-6 py-3 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium border border-gray-300"
          >
            View All Transactions
          </button>
          <button
            onClick={() => router.push("/categories")}
            className="px-6 py-3 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium border border-gray-300"
          >
            Manage Categories
          </button>
        </div>
      </div>
    </div>
  );
}