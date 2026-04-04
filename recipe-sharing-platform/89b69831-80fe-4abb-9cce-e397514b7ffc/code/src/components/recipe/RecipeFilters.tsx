'use client';

import React, { useState } from 'react';
import { Filter, X, ChefHat, Clock, Flame, Star, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { RecipeFilters as RecipeFiltersType, RecipeSortOption } from '@/types';

interface RecipeFiltersProps {
  filters: RecipeFiltersType;
  sort: RecipeSortOption;
  onFiltersChange: (filters: RecipeFiltersType) => void;
  onSortChange: (sort: RecipeSortOption) => void;
  className?: string;
}

const cuisineOptions = [
  { value: '', label: 'All Cuisines' },
  { value: 'italian', label: 'Italian' },
  { value: 'mexican', label: 'Mexican' },
  { value: 'asian', label: 'Asian' },
  { value: 'indian', label: 'Indian' },
  { value: 'american', label: 'American' },
  { value: 'mediterranean', label: 'Mediterranean' },
  { value: 'french', label: 'French' },
  { value: 'japanese', label: 'Japanese' },
  { value: 'thai', label: 'Thai' },
];

const difficultyOptions = [
  { value: '', label: 'All Levels' },
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

const mealTypeOptions = [
  { value: '', label: 'All Meals' },
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'dessert', label: 'Dessert' },
  { value: 'snack', label: 'Snack' },
];

const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'cookTime', label: 'Quickest to Make' },
  { value: 'trending', label: 'Trending Now' },
];

const dietaryOptions = [
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'glutenFree', label: 'Gluten Free' },
  { value: 'dairyFree', label: 'Dairy Free' },
  { value: 'keto', label: 'Keto' },
  { value: 'lowCarb', label: 'Low Carb' },
];

export function RecipeFilters({
  filters,
  sort,
  onFiltersChange,
  onSortChange,
  className,
}: RecipeFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key: keyof RecipeFiltersType, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleDietaryToggle = (dietary: string) => {
    const currentDietary = filters.dietary || [];
    const newDietary = currentDietary.includes(dietary)
      ? currentDietary.filter(d => d !== dietary)
      : [...currentDietary, dietary];
    onFiltersChange({ ...filters, dietary: newDietary });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      cuisine: '',
      difficulty: '',
      mealType: '',
      dietary: [],
      minRating: 0,
      maxTime: 0,
    });
  };

  const hasActiveFilters = 
    filters.search ||
    filters.cuisine ||
    filters.difficulty ||
    filters.mealType ||
    (filters.dietary && filters.dietary.length > 0) ||
    filters.minRating > 0 ||
    filters.maxTime > 0;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Search and Sort Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 w-full">
          <div className="relative">
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search recipes by name, ingredients, or chef..."
              className="w-full px-4 py-3 pl-12 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
            />
            <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as RecipeSortOption)}
            options={sortOptions}
            className="min-w-[180px]"
          />
          <Button
            variant={isExpanded ? 'primary' : 'outline'}
            onClick={() => setIsExpanded(!isExpanded)}
            leftIcon={<Filter className="w-4 h-4" />}
          >
            Filters
            {hasActiveFilters && (
              <Badge variant="primary" size="sm" className="ml-2">
                {[
                  filters.cuisine,
                  filters.difficulty,
                  filters.mealType,
                  ...(filters.dietary || []),
                ].filter(Boolean).length}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Filter Recipes
            </h3>
            <div className="flex items-center gap-3">
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  leftIcon={<X className="w-4 h-4" />}
                >
                  Clear All
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
              >
                Close
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Cuisine Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cuisine
              </label>
              <Select
                value={filters.cuisine || ''}
                onChange={(e) => handleFilterChange('cuisine', e.target.value || undefined)}
                options={cuisineOptions}
              />
            </div>

            {/* Difficulty Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Difficulty
              </label>
              <Select
                value={filters.difficulty || ''}
                onChange={(e) => handleFilterChange('difficulty', e.target.value || undefined)}
                options={difficultyOptions}
              />
            </div>

            {/* Meal Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Meal Type
              </label>
              <Select
                value={filters.mealType || ''}
                onChange={(e) => handleFilterChange('mealType', e.target.value || undefined)}
                options={mealTypeOptions}
              />
            </div>

            {/* Max Time Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Max Cook Time (minutes)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="300"
                  value={filters.maxTime || ''}
                  onChange={(e) => handleFilterChange('maxTime', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                  placeholder="No limit"
                />
                <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              </div>
            </div>
          </div>

          {/* Dietary Restrictions */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Dietary Restrictions
            </label>
            <div className="flex flex-wrap gap-2">
              {dietaryOptions.map((option) => {
                const isActive = filters.dietary?.includes(option.value);
                return (
                  <Button
                    key={option.value}
                    variant={isActive ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => handleDietaryToggle(option.value)}
                    className={cn(
                      'transition-all',
                      isActive && 'ring-2 ring-primary-200 dark:ring-primary-800'
                    )}
                  >
                    {option.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Min Rating Filter */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Minimum Rating
            </label>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleFilterChange('minRating', star)}
                    className={cn(
                      'p-1 rounded transition-colors',
                      (filters.minRating || 0) >= star
                        ? 'text-yellow-400'
                        : 'text-gray-300 dark:text-gray-600 hover:text-yellow-300'
                    )}
                  >
                    <Star className="w-6 h-6 fill-current" />
                  </button>
                ))}
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {filters.minRating ? `${filters.minRating}+ stars` : 'Any rating'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Active filters:</span>
          {filters.search && (
            <Badge variant="secondary" removable onRemove={() => handleFilterChange('search', '')}>
              Search: "{filters.search}"
            </Badge>
          )}
          {filters.cuisine && (
            <Badge variant="secondary" removable onRemove={() => handleFilterChange('cuisine', '')}>
              Cuisine: {cuisineOptions.find(c => c.value === filters.cuisine)?.label}
            </Badge>
          )}
          {filters.difficulty && (
            <Badge variant="secondary" removable onRemove={() => handleFilterChange('difficulty', '')}>
              Difficulty: {difficultyOptions.find(d => d.value === filters.difficulty)?.label}
            </Badge>
          )}
          {filters.mealType && (
            <Badge variant="secondary" removable onRemove={() => handleFilterChange('mealType', '')}>
              Meal: {mealTypeOptions.find(m => m.value === filters.mealType)?.label}
            </Badge>
          )}
          {filters.dietary?.map((dietary) => (
            <Badge
              key={dietary}
              variant="secondary"
              removable
              onRemove={() => handleDietaryToggle(dietary)}
            >
              {dietaryOptions.find(d => d.value === dietary)?.label}
            </Badge>
          ))}
          {filters.minRating > 0 && (
            <Badge variant="secondary" removable onRemove={() => handleFilterChange('minRating', 0)}>
              Min Rating: {filters.minRating}+ stars
            </Badge>
          )}
          {filters.maxTime > 0 && (
            <Badge variant="secondary" removable onRemove={() => handleFilterChange('maxTime', 0)}>
              Max Time: {filters.maxTime} min
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}