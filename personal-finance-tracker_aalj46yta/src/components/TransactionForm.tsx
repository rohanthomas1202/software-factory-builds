"use client";

import { useState, useEffect } from "react";
import { Transaction, TransactionType, Category } from "@/lib/types";
import { validateTransactionAmount, isValidNote, isValidCategoryId } from "@/lib/validation";

interface TransactionFormProps {
  transaction?: Transaction | null;
  categories: Category[];
  userTimezone: string;
  onSuccess: () => void;
  onCancel: () => void;
  isModal?: boolean;
}

export default function TransactionForm({
  transaction,
  categories,
  userTimezone,
  onSuccess,
  onCancel,
  isModal = false,
}: TransactionFormProps) {
  const [type, setType] = useState<TransactionType>(transaction?.type || "EXPENSE");
  const [amount, setAmount] = useState<string>(transaction ? (transaction.amountCents / 100).toFixed(2) : "");
  const [transactionDate, setTransactionDate] = useState<string>(() => {
    if (transaction?.transactionDate) {
      const date = new Date(transaction.transactionDate);
      return date.toISOString().split("T")[0];
    }
    const now = new Date();
    const offset = new Date().toLocaleString("en-US", { timeZone: userTimezone });
    const localDate = new Date(offset);
    return localDate.toISOString().split("T")[0];
  });
  const [categoryId, setCategoryId] = useState<string>(transaction?.categoryId || "");
  const [note, setNote] = useState<string>(transaction?.note || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (type === "INCOME") {
      setCategoryId("");
    }
  }, [type]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!amount.trim()) {
      errors.amount = "Amount is required";
    } else {
      try {
        validateTransactionAmount(amount);
      } catch (err) {
        errors.amount = (err as Error).message;
      }
    }

    if (!transactionDate.trim()) {
      errors.transactionDate = "Date is required";
    }

    if (type === "EXPENSE" && !categoryId.trim()) {
      errors.categoryId = "Category is required for expenses";
    }

    if (categoryId && !isValidCategoryId(categoryId)) {
      errors.categoryId = "Invalid category selected";
    }

    if (note && !isValidNote(note)) {
      errors.note = "Note is too long (max 500 characters)";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const url = transaction
        ? `/api/transactions/${transaction.id}`
        : "/api/transactions";

      const method = transaction ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
          transactionDate,
          type,
          categoryId: categoryId || null,
          note: note || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save transaction");
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter(cat => {
    if (type === "EXPENSE") return true;
    return false;
  });

  const baseClasses = isModal
    ? "bg-white p-6 rounded-lg shadow-lg"
    : "bg-white p-6 rounded-lg shadow-md border border-gray-200";

  return (
    <form onSubmit={handleSubmit} className={baseClasses}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {transaction ? "Edit Transaction" : "Add Transaction"}
          </h2>
          {isModal && (
            <button
              type="button"
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-500"
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="type" className="block text-sm font-medium text-gray-700">
              Type *
            </label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as TransactionType)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              disabled={loading}
            >
              <option value="EXPENSE">Expense</option>
              <option value="INCOME">Income</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
              Amount *
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="text"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className={`block w-full rounded-md border-gray-300 pl-7 pr-12 focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                  fieldErrors.amount ? "border-red-300" : ""
                }`}
                disabled={loading}
              />
            </div>
            {fieldErrors.amount && (
              <p className="text-sm text-red-600">{fieldErrors.amount}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="transactionDate" className="block text-sm font-medium text-gray-700">
              Date *
            </label>
            <input
              type="date"
              id="transactionDate"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                fieldErrors.transactionDate ? "border-red-300" : ""
              }`}
              disabled={loading}
            />
            {fieldErrors.transactionDate && (
              <p className="text-sm text-red-600">{fieldErrors.transactionDate}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700">
              Category {type === "EXPENSE" ? "*" : ""}
            </label>
            <select
              id="categoryId"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                fieldErrors.categoryId ? "border-red-300" : ""
              }`}
              disabled={loading || type === "INCOME"}
            >
              <option value="">Select a category</option>
              {filteredCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {fieldErrors.categoryId && (
              <p className="text-sm text-red-600">{fieldErrors.categoryId}</p>
            )}
            {type === "INCOME" && (
              <p className="text-xs text-gray-500">Income transactions don't require a category</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="note" className="block text-sm font-medium text-gray-700">
            Note
          </label>
          <textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
              fieldErrors.note ? "border-red-300" : ""
            }`}
            placeholder="Optional note about this transaction"
            disabled={loading}
          />
          {fieldErrors.note && (
            <p className="text-sm text-red-600">{fieldErrors.note}</p>
          )}
          <p className="text-xs text-gray-500">Maximum 500 characters</p>
        </div>

        <div className="flex justify-end space-x-4 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <svg className="mr-2 h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </>
            ) : transaction ? (
              "Update Transaction"
            ) : (
              "Add Transaction"
            )}
          </button>
        </div>
      </div>
    </form>
  );
}