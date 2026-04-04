'use client';

import React, { useState } from 'react';
import { Check, ShoppingCart, Plus, Minus, ChefHat } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface Ingredient {
  id: string;
  name: string;
  amount: string;
  unit?: string;
  notes?: string;
}

interface IngredientListProps {
  ingredients: Ingredient[];
  servings?: number;
  onServingsChange?: (servings: number) => void;
  showCheckboxes?: boolean;
  showShoppingList?: boolean;
  className?: string;
}

export function IngredientList({
  ingredients,
  servings = 4,
  onServingsChange,
  showCheckboxes = false,
  showShoppingList = false,
  className,
}: IngredientListProps) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [shoppingList, setShoppingList] = useState<Set<string>>(new Set());

  const handleCheck = (id: string) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(id)) {
      newChecked.delete(id);
    } else {
      newChecked.add(id);
    }
    setCheckedItems(newChecked);
  };

  const handleShoppingListToggle = (id: string) => {
    const newShoppingList = new Set(shoppingList);
    if (newShoppingList.has(id)) {
      newShoppingList.delete(id);
    } else {
      newShoppingList.add(id);
    }
    setShoppingList(newShoppingList);
  };

  const handleServingsChange = (newServings: number) => {
    if (newServings < 1) return;
    onServingsChange?.(newServings);
  };

  const calculateAdjustedAmount = (amount: string, unit?: string): string => {
    if (!amount || servings === 4) return amount;
    
    try {
      const match = amount.match(/(\d+(?:\.\d+)?)\s*([\w\/]*)/);
      if (!match) return amount;
      
      const [, numStr, unitStr] = match;
      const num = parseFloat(numStr);
      const adjusted = (num * servings) / 4;
      
      // Format nicely
      if (adjusted % 1 === 0) {
        return `${adjusted}${unitStr ? ' ' + unitStr : ''}`;
      } else {
        return `${adjusted.toFixed(1)}${unitStr ? ' ' + unitStr : ''}`;
      }
    } catch {
      return amount;
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Servings Control */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-xl">
        <div className="flex items-center gap-2">
          <ChefHat className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <span className="font-medium text-gray-900 dark:text-white">Servings</span>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleServingsChange(servings - 1)}
            disabled={servings <= 1}
            className="p-1"
          >
            <Minus className="w-4 h-4" />
          </Button>
          <span className="font-bold text-lg text-gray-900 dark:text-white min-w-[2rem] text-center">
            {servings}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleServingsChange(servings + 1)}
            className="p-1"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Ingredients List */}
      <div className="space-y-2">
        {ingredients.map((ingredient) => (
          <div
            key={ingredient.id}
            className={cn(
              'flex items-start gap-3 p-3 rounded-lg transition-colors',
              checkedItems.has(ingredient.id)
                ? 'bg-green-50 dark:bg-green-900/20'
                : 'bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800'
            )}
          >
            {showCheckboxes && (
              <button
                onClick={() => handleCheck(ingredient.id)}
                className={cn(
                  'flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors mt-0.5',
                  checkedItems.has(ingredient.id)
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-gray-300 dark:border-gray-600 hover:border-primary-500'
                )}
              >
                {checkedItems.has(ingredient.id) && (
                  <Check className="w-3 h-3" />
                )}
              </button>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={cn(
                  'font-medium text-gray-900 dark:text-white',
                  checkedItems.has(ingredient.id) && 'line-through text-gray-500 dark:text-gray-400'
                )}>
                  {ingredient.name}
                </span>
                {ingredient.notes && (
                  <Badge variant="secondary" size="sm" className="text-xs">
                    {ingredient.notes}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                {calculateAdjustedAmount(ingredient.amount, ingredient.unit)}
                {ingredient.unit && ` ${ingredient.unit}`}
              </p>
            </div>

            {showShoppingList && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleShoppingListToggle(ingredient.id)}
                className={cn(
                  'flex-shrink-0 p-1',
                  shoppingList.has(ingredient.id) && 'text-primary-600 dark:text-primary-400'
                )}
              >
                <ShoppingCart className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Shopping List Summary */}
      {showShoppingList && shoppingList.size > 0 && (
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingCart className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h4 className="font-medium text-gray-900 dark:text-white">
              Shopping List ({shoppingList.size} items)
            </h4>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Added to your shopping list. You can export this list or share it with others.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => {
              const list = ingredients
                .filter(ing => shoppingList.has(ing.id))
                .map(ing => `${ing.name}: ${ing.amount}${ing.unit ? ' ' + ing.unit : ''}`)
                .join('\n');
              navigator.clipboard.writeText(list);
            }}
          >
            Copy List
          </Button>
        </div>
      )}
    </div>
  );
}