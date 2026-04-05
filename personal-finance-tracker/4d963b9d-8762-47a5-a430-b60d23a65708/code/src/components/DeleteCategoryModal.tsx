"use client";

import { useState, useEffect } from "react";
import { Category } from "@/lib/types";

interface DeleteCategoryModalProps {
  category: Category;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeleteCategoryModal({
  category,
  onClose,
  onSuccess,
}: DeleteCategoryModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionCount, setTransactionCount] = useState<number | null>(null);
  const [reassignCategoryId, setReassignCategoryId] = useState<string>("");
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    // Fetch transaction count and other categories
    fetch(`/api/categories/${category.id}/transaction-count`)
      .then(res => res.json())
      .then(data => setTransactionCount(data.count || 0))
      .catch(() => setTransactionCount(0));

    fetch("/api/categories")
      .then(res => res.json())
      .then(data => {
        const otherCategories = (data.data || []).filter(
          (c: Category) => c.id !== category.id
        );
        setCategories(otherCategories);
        if (otherCategories.length > 0) {
          setReassignCategoryId(otherCategories[0].id);
        }
      })
      .catch(() => {});
  }, [category.id]);

  const handleDelete = async () => {
    setLoading(true);
    setError(null);

    try {
      const url = `/api/categories/${category.id}`;
      const body: any = {};

      if (transactionCount && transactionCount > 0) {
        if (!reassignCategoryId) {
          throw new Error("Please select a category to reassign transactions to");
        }
        body.reassignToCategoryId = reassignCategoryId;
      }

      const response = await fetch(url, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete category");
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-25 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Delete Category
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <div className="p-4 bg-red-50 border border-red-100 rounded-lg mb-4">
                <div className="flex items-center text-red-800">
                  <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Warning: This action cannot be undone</span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-600">Category:</span>
                  <div className="flex items-center mt-1">
                    {category.colorHex && (
                      <div
                        className="h-4 w-4 rounded-full mr-2"
                        style={{ backgroundColor: category.colorHex }}
                      />
                    )}
                    <span className="font-medium text-gray-900">{category.name}</span>
                  </div>
                </div>
                
                <div>
                  <span className="text-sm text-gray-600">Monthly Limit:</span>
                  <p className="font-medium text-gray-900">{formatCurrency(category.monthlyLimitCents)}</p>
                </div>

                {transactionCount !== null && transactionCount > 0 && (
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-700 mb-3">
                      This category has <span className="font-semibold">{transactionCount}</span>{" "}
                      transaction{transactionCount === 1 ? "" : "s"}. To delete it, you must reassign these
                      transactions to another category.
                    </p>

                    <div>
                      <label htmlFor="reassignCategory" className="block text-sm font-medium text-gray-700 mb-1">
                        Reassign transactions to:
                      </label>
                      <select
                        id="reassignCategory"
                        value={reassignCategoryId}
                        onChange={(e) => setReassignCategoryId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={loading || categories.length === 0}
                      >
                        {categories.length === 0 ? (
                          <option value="">No other categories available</option>
                        ) : (
                          categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))
                        )}
                      </select>
                      {categories.length === 0 && (
                        <p className="mt-1 text-sm text-red-600">
                          Cannot delete: Create another category first to reassign transactions.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {transactionCount === 0 && (
                  <p className="text-sm text-gray-700">
                    This category has no transactions. It can be safely deleted.
                  </p>
                )}
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                disabled={loading || (transactionCount && transactionCount > 0 && categories.length === 0)}
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Deleting...
                  </span>
                ) : (
                  "Delete Category"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}