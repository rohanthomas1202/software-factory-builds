"use client";

import { useState, useEffect } from "react";
import { Category, CreateCategoryRequest, UpdateCategoryRequest } from "@/lib/types";
import { isValidCategoryName, isValidColorHex, validateMonthlyLimit } from "@/lib/validation";

interface CategoryFormProps {
  category?: Category;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function CategoryForm({ category, onSuccess, onCancel }: CategoryFormProps) {
  const isEditMode = !!category;
  const [name, setName] = useState(category?.name || "");
  const [monthlyLimit, setMonthlyLimit] = useState(
    category ? (category.monthlyLimitCents / 100).toString() : ""
  );
  const [colorHex, setColorHex] = useState(category?.colorHex || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const presetColors = [
    "#3B82F6", // blue-500
    "#10B981", // emerald-500
    "#F59E0B", // amber-500
    "#EF4444", // red-500
    "#8B5CF6", // violet-500
    "#EC4899", // pink-500
    "#06B6D4", // cyan-500
    "#84CC16", // lime-500
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!isValidCategoryName(name)) {
      setError("Category name must be 1-50 characters");
      return;
    }

    let limitCents: number;
    try {
      limitCents = validateMonthlyLimit(monthlyLimit);
      if (limitCents < 0) {
        setError("Monthly limit must be non-negative");
        return;
      }
    } catch {
      setError("Invalid monthly limit format");
      return;
    }

    const colorValue = colorHex.trim() || null;
    if (colorValue && !isValidColorHex(colorValue)) {
      setError("Invalid color hex format (e.g., #3B82F6)");
      return;
    }

    setLoading(true);

    try {
      const url = isEditMode ? `/api/categories/${category.id}` : "/api/categories";
      const method = isEditMode ? "PATCH" : "POST";
      const body: CreateCategoryRequest | UpdateCategoryRequest = {
        name,
        monthlyLimitCents: limitCents,
        colorHex: colorValue,
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save category");
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        {isEditMode ? "Edit Category" : "Create New Category"}
      </h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Category Name *
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Groceries, Entertainment"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="monthlyLimit" className="block text-sm font-medium text-gray-700 mb-1">
              Monthly Limit (USD) *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500">$</span>
              </div>
              <input
                type="number"
                id="monthlyLimit"
                value={monthlyLimit}
                onChange={(e) => setMonthlyLimit(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
                min="0"
                step="0.01"
                required
                disabled={loading}
              />
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Enter amount in dollars (e.g., 500 for $500)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color Label (optional)
            </label>
            
            <div className="mb-3 flex flex-wrap gap-2">
              {presetColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setColorHex(color)}
                  className={`h-8 w-8 rounded-full border-2 ${colorHex === color ? "border-gray-900" : "border-gray-300"} transition-colors`}
                  style={{ backgroundColor: color }}
                  aria-label={`Select color ${color}`}
                />
              ))}
            </div>

            <div className="flex items-center space-x-3">
              <div
                className="h-10 w-10 rounded border border-gray-300 flex-shrink-0"
                style={{ backgroundColor: colorHex || "#FFFFFF" }}
              />
              <input
                type="text"
                value={colorHex}
                onChange={(e) => setColorHex(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder="#3B82F6 or leave empty"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setColorHex("")}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                disabled={loading}
              >
                Clear
              </button>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Hex color code (optional) for visual identification
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </span>
            ) : (
              <span>{isEditMode ? "Update Category" : "Create Category"}</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}