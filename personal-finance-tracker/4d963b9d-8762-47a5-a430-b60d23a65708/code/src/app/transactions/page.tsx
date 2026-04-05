"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Transaction, Category, TransactionType } from "@/lib/types";
import TransactionRow from "@/components/TransactionRow";
import Link from "next/link";

interface TransactionResponse {
  data: Transaction[];
}

interface CategoriesResponse {
  data: Category[];
}

export default function TransactionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Filter states
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<TransactionType | "ALL">("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Initialize filters from URL
  useEffect(() => {
    const categoryParam = searchParams.get("categories");
    const typeParam = searchParams.get("type");
    const startParam = searchParams.get("start");
    const endParam = searchParams.get("end");
    const pageParam = searchParams.get("page");

    if (categoryParam) {
      setSelectedCategories(categoryParam.split(","));
    }
    if (typeParam && (typeParam === "INCOME" || typeParam === "EXPENSE" || typeParam === "ALL")) {
      setSelectedType(typeParam);
    }
    if (startParam) setStartDate(startParam);
    if (endParam) setEndDate(endParam);
    if (pageParam) setCurrentPage(parseInt(pageParam, 10) || 1);
  }, [searchParams]);

  // Update URL with filters
  const updateURL = useCallback(() => {
    const params = new URLSearchParams();
    if (selectedCategories.length > 0) {
      params.set("categories", selectedCategories.join(","));
    }
    if (selectedType !== "ALL") {
      params.set("type", selectedType);
    }
    if (startDate) {
      params.set("start", startDate);
    }
    if (endDate) {
      params.set("end", endDate);
    }
    if (currentPage > 1) {
      params.set("page", currentPage.toString());
    }
    const queryString = params.toString();
    router.push(`/transactions${queryString ? `?${queryString}` : ""}`, { scroll: false });
  }, [selectedCategories, selectedType, startDate, endDate, currentPage, router]);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [transactionsRes, categoriesRes] = await Promise.all([
          fetch("/api/transactions"),
          fetch("/api/categories"),
        ]);

        if (!transactionsRes.ok) {
          throw new Error("Failed to fetch transactions");
        }
        if (!categoriesRes.ok) {
          throw new Error("Failed to fetch categories");
        }

        const transactionsData: TransactionResponse = await transactionsRes.json();
        const categoriesData: CategoriesResponse = await categoriesRes.json();

        setTransactions(transactionsData.data);
        setCategories(categoriesData.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Apply filters when they change
  useEffect(() => {
    updateURL();
    setCurrentPage(1);
  }, [selectedCategories, selectedType, startDate, endDate, updateURL]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      // Category filter
      if (selectedCategories.length > 0) {
        if (!transaction.categoryId || !selectedCategories.includes(transaction.categoryId)) {
          return false;
        }
      }

      // Type filter
      if (selectedType !== "ALL" && transaction.type !== selectedType) {
        return false;
      }

      // Date filter
      const transactionDate = new Date(transaction.transactionDate);
      if (startDate) {
        const start = new Date(startDate);
        if (transactionDate < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (transactionDate > end) return false;
      }

      return true;
    });
  }, [transactions, selectedCategories, selectedType, startDate, endDate]);

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTransactions, currentPage]);

  const handleUpdateTransaction = useCallback(async (id: string, updates: Partial<Transaction>) => {
    try {
      setIsUpdating(true);
      const response = await fetch(`/api/transactions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update transaction");
      }

      const { data }: { data: Transaction } = await response.json();
      setTransactions((prev) => prev.map((t) => (t.id === id ? data : t)));
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const handleDeleteTransaction = useCallback(async (id: string) => {
    if (!confirm("Are you sure you want to delete this transaction?")) return;

    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete transaction");
      }

      setTransactions((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }, []);

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedType("ALL");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading transactions...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
        <Link
          href="/transactions/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Add Transaction
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-700">
          <p className="font-medium">Error: {error}</p>
        </div>
      )}

      {/* Filter Controls */}
      <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Filters</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Category Multi-select */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Categories
            </label>
            <div className="space-y-2">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`cat-${category.id}`}
                    checked={selectedCategories.includes(category.id)}
                    onChange={() => handleCategoryChange(category.id)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor={`cat-${category.id}`}
                    className="ml-2 flex items-center text-sm text-gray-700"
                  >
                    <div
                      className="mr-2 h-3 w-3 rounded-full"
                      style={{ backgroundColor: category.colorHex || "#6b7280" }}
                    />
                    {category.name}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Transaction Type */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as TransactionType | "ALL")}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">All Types</option>
              <option value="INCOME">Income</option>
              <option value="EXPENSE">Expense</option>
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={clearFilters}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Transaction List */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
        {paginatedTransactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No transactions found. {filteredTransactions.length === 0 ? "Try adjusting your filters." : ""}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {paginatedTransactions.map((transaction) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                categories={categories}
                onUpdate={handleUpdateTransaction}
                onDelete={handleDeleteTransaction}
                isUpdating={isUpdating && editingId === transaction.id}
                onEditStart={() => setEditingId(transaction.id)}
                onEditCancel={() => setEditingId(null)}
                isEditing={editingId === transaction.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
            <span className="font-medium">
              {Math.min(currentPage * itemsPerPage, filteredTransactions.length)}
            </span>{" "}
            of <span className="font-medium">{filteredTransactions.length}</span> transactions
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="flex items-center px-3 py-2 text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}