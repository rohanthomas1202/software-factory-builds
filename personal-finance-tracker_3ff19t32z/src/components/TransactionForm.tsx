'use client';

import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { Category, Transaction, ApiError } from '@/lib/types';
import { checkBudgetWarning } from '@/lib/budgetUtils';

interface TransactionFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultCategoryId?: string;
  initialValues?: Partial<Transaction>;
}

interface CategoryOption extends Category {
  label: string;
  value: string;
}

export default function TransactionForm({ 
  onSuccess, 
  onCancel,
  defaultCategoryId,
  initialValues 
}: TransactionFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [budgetWarning, setBudgetWarning] = useState<string>('');
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  
  // Form state
  const [formData, setFormData] = useState({
    amountCents: initialValues?.amountCents || 0,
    date: initialValues?.date || new Date().toISOString().split('T')[0],
    categoryId: defaultCategoryId || initialValues?.categoryId || '',
    type: initialValues?.type || 'EXPENSE' as 'INCOME' | 'EXPENSE',
    notes: initialValues?.notes || '',
  });

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Check budget warning when relevant fields change
  useEffect(() => {
    const checkWarning = async () => {
      if (!formData.categoryId || !formData.amountCents || formData.amountCents <= 0) {
        setBudgetWarning('');
        return;
      }

      try {
        // Extract year-month from date
        const month = formData.date.substring(0, 7); // YYYY-MM
        const warning = checkBudgetWarning(
          '', // userId will be determined on server
          formData.categoryId,
          month,
          formData.amountCents
        );
        setBudgetWarning(warning || '');
      } catch (err) {
        setBudgetWarning('');
      }
    };

    checkWarning();
  }, [formData.categoryId, formData.amountCents, formData.date]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      const result = await response.json();
      if (result.error) {
        throw new Error(result.error);
      }
      
      const categoryOptions: CategoryOption[] = result.data.map((cat: Category) => ({
        ...cat,
        label: cat.name,
        value: cat.id,
      }));
      
      setCategories(categoryOptions);
      
      // Set default category if not already set
      if (!formData.categoryId && categoryOptions.length > 0) {
        setFormData(prev => ({ ...prev, categoryId: defaultCategoryId || categoryOptions[0].id }));
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories. Please try again.');
    }
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    if (name === 'amountCents') {
      // Convert dollars to cents (allow decimal input)
      const dollars = parseFloat(value) || 0;
      const cents = Math.round(dollars * 100);
      setFormData(prev => ({ ...prev, [name]: cents }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    // Validation
    if (!formData.amountCents || formData.amountCents <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (!formData.categoryId) {
      setError('Please select a category');
      return;
    }
    if (!formData.date) {
      setError('Please select a date');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountCents: formData.amountCents,
          date: formData.date,
          categoryId: formData.categoryId,
          type: formData.type,
          notes: formData.notes,
        }),
      });

      if (!response.ok) {
        const result: ApiError = await response.json();
        throw new Error(result.error || 'Failed to create transaction');
      }

      // Reset form
      setFormData({
        amountCents: 0,
        date: new Date().toISOString().split('T')[0],
        categoryId: defaultCategoryId || categories[0]?.id || '',
        type: 'EXPENSE',
        notes: '',
      });

      // Notify parent
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Convert cents to dollars for display
  const amountInDollars = (formData.amountCents / 100).toFixed(2);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {initialValues ? 'Edit Transaction' : 'New Transaction'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount ($)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            name="amount"
            value={formData.amountCents ? (formData.amountCents / 100).toFixed(2) : ''}
            onChange={(e) => {
              const dollars = parseFloat(e.target.value) || 0;
              const cents = Math.round(dollars * 100);
              setFormData(prev => ({ ...prev, amountCents: cents }));
            }}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            placeholder="0.00"
            required
            disabled={isLoading}
          />
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date
          </label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            required
            disabled={isLoading}
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <select
            name="categoryId"
            value={formData.categoryId}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            required
            disabled={isLoading || categories.length === 0}
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          {categories.length === 0 && (
            <p className="mt-1 text-sm text-amber-600">
              No categories found. Create categories first.
            </p>
          )}
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="type"
                value="EXPENSE"
                checked={formData.type === 'EXPENSE'}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                disabled={isLoading}
              />
              <span className="ml-2 text-gray-700">Expense</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="type"
                value="INCOME"
                checked={formData.type === 'INCOME'}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                disabled={isLoading}
              />
              <span className="ml-2 text-gray-700">Income</span>
            </label>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes (optional)
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            maxLength={500}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            placeholder="Add any notes about this transaction"
            disabled={isLoading}
          />
          <p className="mt-1 text-sm text-gray-500">
            {formData.notes.length}/500 characters
          </p>
        </div>

        {/* Budget Warning */}
        {budgetWarning && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-amber-800">Budget Warning</h3>
                <div className="mt-2 text-sm text-amber-700">
                  <p>{budgetWarning}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="w-full sm:w-auto px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading || categories.length === 0}
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              initialValues ? 'Update Transaction' : 'Add Transaction'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}