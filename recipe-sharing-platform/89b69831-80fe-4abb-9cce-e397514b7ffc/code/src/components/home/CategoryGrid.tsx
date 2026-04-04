'use client';

import Link from 'next/link';
import { ChefHat, Pizza, Cake, Salad, Coffee, Soup, IceCream, Utensils } from 'lucide-react';
import { cn } from '@/lib/utils';

const categories = [
  {
    name: 'Italian',
    icon: Pizza,
    color: 'from-red-500 to-orange-500',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    count: 342,
  },
  {
    name: 'Desserts',
    icon: Cake,
    color: 'from-pink-500 to-rose-500',
    bgColor: 'bg-pink-50 dark:bg-pink-900/20',
    count: 421,
  },
  {
    name: 'Healthy',
    icon: Salad,
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    count: 387,
  },
  {
    name: 'Breakfast',
    icon: Coffee,
    color: 'from-amber-500 to-yellow-500',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    count: 289,
  },
  {
    name: 'Soups',
    icon: Soup,
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    count: 156,
  },
  {
    name: 'Asian',
    icon: Utensils,
    color: 'from-purple-500 to-indigo-500',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    count: 289,
  },
  {
    name: 'Vegan',
    icon: Salad,
    color: 'from-lime-500 to-green-500',
    bgColor: 'bg-lime-50 dark:bg-lime-900/20',
    count: 234,
  },
  {
    name: 'Baking',
    icon: Cake,
    color: 'from-orange-500 to-red-500',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    count: 198,
  },
];

export function CategoryGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
      {categories.map((category) => {
        const Icon = category.icon;
        return (
          <Link
            key={category.name}
            href={`/recipes?category=${category.name.toLowerCase()}`}
            className="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className={cn('p-6', category.bgColor)}>
              <div className="flex flex-col items-center text-center">
                <div className={`relative mb-4 p-4 rounded-2xl bg-gradient-to-br ${category.color}`}>
                  <Icon className="h-8 w-8 text-white" />
                  <div className="absolute inset-0 bg-white/10 rounded-2xl" />
                </div>
                
                <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">
                  {category.name}
                </h3>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {category.count} recipes
                </p>
                
                <div className="w-12 h-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent dark:via-gray-600 group-hover:via-primary-500 transition-colors" />
              </div>
            </div>
            
            {/* Hover effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-white/5 dark:to-gray-900/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </Link>
        );
      })}
    </div>
  );
}