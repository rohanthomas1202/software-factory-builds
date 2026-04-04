'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Recipe } from '@/types';
import { RecipeCard } from './RecipeCard';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Search, ChefHat, Filter, RefreshCw } from 'lucide-react';

interface RecipeGridProps {
  recipes: Recipe[];
  isLoading?: boolean;
  loadingMessage?: string;
  emptyMessage?: string;
  emptyAction?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'default' | 'compact' | 'featured';
  columns?: 1 | 2 | 3 | 4;
  className?: string;
  showAuthor?: boolean;
  showActions?: boolean;
  showStats?: boolean;
  onRecipeSaveToggle?: (recipeId: string, saved: boolean) => void;
}

export function RecipeGrid({
  recipes,
  isLoading = false,
  loadingMessage = 'Loading recipes...',
  emptyMessage = 'No recipes found',
  emptyAction,
  variant = 'default',
  columns = 3,
  className,
  showAuthor = true,
  showActions = true,
  showStats = true,
  onRecipeSaveToggle,
}: RecipeGridProps) {
  const getGridColumns = () => {
    switch (columns) {
      case 1: return 'grid-cols-1';
      case 2: return 'grid-cols-1 sm:grid-cols-2';
      case 3: return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
      case 4: return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
      default: return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
    }
  };

  const getGap = () => {
    switch (variant) {
      case 'compact': return 'gap-3';
      case 'featured': return 'gap-6';
      default: return 'gap-6';
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Spinner size="lg" variant="primary" />
        <p className="mt-4 text-gray-600 dark:text-gray-400">{loadingMessage}</p>
      </div>
    );
  }

  if (recipes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-6">
          <ChefHat className="w-12 h-12 text-gray-400 dark:text-gray-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {emptyMessage}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
          Try adjusting your filters or be the first to share a recipe!
        </p>
        {emptyAction && (
          <Button
            variant="primary"
            onClick={emptyAction.onClick}
            leftIcon={<ChefHat className="w-4 h-4" />}
          >
            {emptyAction.label}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)}>
      <div className={cn('grid', getGridColumns(), getGap())}>
        {recipes.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            variant={variant}
            showAuthor={showAuthor}
            showActions={showActions}
            showStats={showStats}
            onSaveToggle={onRecipeSaveToggle}
          />
        ))}
      </div>
    </div>
  );
}