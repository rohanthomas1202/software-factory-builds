import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { RecipeFilters, RecipeSortOption } from '@/types';

/**
 * Merge class names with Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date string to a readable format
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) {
    return 'just now';
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: diffDays < 365 ? undefined : 'numeric',
    });
  }
}

/**
 * Format time in minutes to a readable string
 */
export function formatTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  } else {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) {
      return `${hours} hr${hours !== 1 ? 's' : ''}`;
    }
    return `${hours} hr${hours !== 1 ? 's' : ''} ${mins} min`;
  }
}

/**
 * Calculate average rating from ratings array
 */
export function calculateAverageRating(ratings: { rating: number }[]): number {
  if (ratings.length === 0) return 0;
  const sum = ratings.reduce((acc, curr) => acc + curr.rating, 0);
  return Math.round((sum / ratings.length) * 10) / 10;
}

/**
 * Generate a color based on difficulty level
 */
export function getDifficultyColor(difficulty: 'easy' | 'medium' | 'hard'): string {
  switch (difficulty) {
    case 'easy':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
    case 'medium':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
    case 'hard':
      return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  }
}

/**
 * Generate initials from a name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Truncate text to a specified length
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

/**
 * Generate a random color for avatars
 */
export function getRandomColor(): string {
  const colors = [
    'bg-blue-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-red-500',
    'bg-orange-500',
    'bg-yellow-500',
    'bg-green-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-indigo-500',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate username format (alphanumeric, underscores, hyphens)
 */
export function isValidUsername(username: string): boolean {
  const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
  return usernameRegex.test(username);
}

/**
 * Validate password strength
 */
export function isStrongPassword(password: string): boolean {
  // At least 8 characters, contains uppercase, lowercase, number, and special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
}

/**
 * Debounce function for limiting rapid function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function for limiting function calls to once per specified interval
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Convert recipe filters to query string
 */
export function filtersToQueryString(filters: RecipeFilters, sort?: RecipeSortOption, page?: number, pageSize?: number): string {
  const params = new URLSearchParams();
  
  if (filters.search) params.set('search', filters.search);
  if (filters.category) params.set('category', filters.category);
  if (filters.tags && filters.tags.length > 0) params.set('tags', filters.tags.join(','));
  if (filters.difficulty && filters.difficulty.length > 0) params.set('difficulty', filters.difficulty.join(','));
  if (filters.prepTime) params.set('prepTime', filters.prepTime.toString());
  if (filters.cookTime) params.set('cookTime', filters.cookTime.toString());
  if (filters.dietary && filters.dietary.length > 0) params.set('dietary', filters.dietary.join(','));
  if (filters.rating) params.set('rating', filters.rating.toString());
  if (filters.authorId) params.set('authorId', filters.authorId);
  if (filters.isFeatured !== undefined) params.set('isFeatured', filters.isFeatured.toString());
  if (filters.isPublished !== undefined) params.set('isPublished', filters.isPublished.toString());
  
  if (sort) params.set('sort', sort);
  if (page) params.set('page', page.toString());
  if (pageSize) params.set('pageSize', pageSize.toString());
  
  return params.toString();
}

/**
 * Parse query string to recipe filters
 */
export function queryStringToFilters(queryString: string): {
  filters: RecipeFilters;
  sort?: RecipeSortOption;
  page?: number;
  pageSize?: number;
} {
  const params = new URLSearchParams(queryString);
  const filters: RecipeFilters = {};
  
  const search = params.get('search');
  if (search) filters.search = search;
  
  const category = params.get('category');
  if (category) filters.category = category;
  
  const tags = params.get('tags');
  if (tags) filters.tags = tags.split(',');
  
  const difficulty = params.get('difficulty');
  if (difficulty) filters.difficulty = difficulty.split(',') as ('easy' | 'medium' | 'hard')[];
  
  const prepTime = params.get('prepTime');
  if (prepTime) filters.prepTime = parseInt(prepTime);
  
  const cookTime = params.get('cookTime');
  if (cookTime) filters.cookTime = parseInt(cookTime);
  
  const dietary = params.get('dietary');
  if (dietary) filters.dietary = dietary.split(',') as (keyof DietaryInfo)[];
  
  const rating = params.get('rating');
  if (rating) filters.rating = parseFloat(rating);
  
  const authorId = params.get('authorId');
  if (authorId) filters.authorId = authorId;
  
  const isFeatured = params.get('isFeatured');
  if (isFeatured) filters.isFeatured = isFeatured === 'true';
  
  const isPublished = params.get('isPublished');
  if (isPublished) filters.isPublished = isPublished === 'true';
  
  const sort = params.get('sort') as RecipeSortOption | null;
  const page = params.get('page');
  const pageSize = params.get('pageSize');
  
  return {
    filters,
    sort: sort || undefined,
    page: page ? parseInt(page) : undefined,
    pageSize: pageSize ? parseInt(pageSize) : undefined,
  };
}

/**
 * Capitalize first letter of each word
 */
export function capitalizeWords(str: string): string {
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Generate a gradient background based on category
 */
export function getCategoryGradient(category: string): string {
  const gradients: Record<string, string> = {
    'italian': 'from-red-500 to-orange-500',
    'desserts': 'from-pink-500 to-purple-500',
    'salads': 'from-green-500 to-emerald-500',
    'breakfast': 'from-yellow-500 to-amber-500',
    'soups': 'from-blue-500 to-cyan-500',
    'seafood': 'from-indigo-500 to-blue-500',
    'vegetarian': 'from-emerald-500 to-green-500',
    'vegan': 'from-lime-500 to-green-500',
    'gluten-free': 'from-amber-500 to-orange-500',
    'keto': 'from-purple-500 to-pink-500',
    'paleo': 'from-rose-500 to-red-500',
    'low-carb': 'from-teal-500 to-cyan-500',
    'asian': 'from-red-500 to-pink-500',
    'mexican': 'from-green-500 to-lime-500',
    'mediterranean': 'from-blue-500 to-teal-500',
    'american': 'from-red-500 to-blue-500',
    'french': 'from-blue-500 to-indigo-500',
    'indian': 'from-orange-500 to-yellow-500',
    'thai': 'from-purple-500 to-pink-500',
    'chinese': 'from-red-500 to-yellow-500',
  };
  
  return gradients[category.toLowerCase()] || 'from-gray-500 to-gray-700';
}

/**
 * Format number with commas
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

/**
 * Sleep function for async operations
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if object is empty
 */
export function isEmpty(obj: Record<string, any>): boolean {
  return Object.keys(obj).length === 0;
}

/**
 * Remove undefined/null values from object
 */
export function cleanObject<T extends Record<string, any>>(obj: T): Partial<T> {
  const cleaned: Partial<T> = {};
  for (const key in obj) {
    if (obj[key] !== undefined && obj[key] !== null) {
      cleaned[key] = obj[key];
    }
  }
  return cleaned;
}