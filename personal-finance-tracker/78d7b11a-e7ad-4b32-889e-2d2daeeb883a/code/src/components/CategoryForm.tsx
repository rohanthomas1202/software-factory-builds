'use client';

import { useState } from 'react';
import { Category } from '@/lib/types';
import LoadingSpinner from './LoadingSpinner';

interface CategoryFormProps {
  category?: Category | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface FormData {
  name: string;
  color: string;
}

export default function CategoryForm({ category, onSuccess, onCancel }: CategoryFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: category?.name || '',
    color: category?.color || '#3b82f6' // Default blue
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isEditing = !!category;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Validation
      if (!formData.name.trim()) {
        throw new Error('Category name is required');
      }

      if (!formData.color) {
        throw new Error('Color is required');
      }

      const url = isEditing 
        ? `/api/categories/${category.id}`
        : '/api/categories';
      
      const method = isEditing ? 'PATCH' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          color: formData.color
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save category');
      }

      const result = await response.json();
      
      setSuccessMessage(isEditing ? 'Category updated successfully!' : 'Category created successfully!');
      setFormData({
        name: '',
        color: '#3b82f6'
      });

      if (onSuccess) {
        onSuccess();
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">
        {isEditing ? 'Edit Category' : 'Create New Category'}
      </h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Category Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            maxLength={100}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Groceries, Rent, Salary"
            disabled={isLoading}
          />
          <p className="mt-1 text-sm text-gray-500">
            Give your category a descriptive name
          </p>
        </div>

        <div>
          <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">
            Color *
          </label>
          <div className="flex items-center space-x-4">
            <input
              type="color"
              id="color"
              name="color"
              value={formData.color}
              onChange={handleChange}
              required
              className="w-12 h-12 cursor-pointer rounded-md border border-gray-300"
              disabled={isLoading}
            />
            <div className="flex-1">
              <input
                type="text"
                value={formData.color}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                placeholder="#3b82f6"
                disabled={isLoading}
              />
              <p className="mt-1 text-sm text-gray-500">
                Hex color code (e.g., #3b82f6 for blue)
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
            >
              Cancel
            </button>
          )}
          
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex items-center"
          >
            {isLoading && <LoadingSpinner size="sm" className="mr-2" />}
            {isEditing ? 'Update Category' : 'Create Category'}
          </button>
        </div>
      </form>
    </div>
  );
}