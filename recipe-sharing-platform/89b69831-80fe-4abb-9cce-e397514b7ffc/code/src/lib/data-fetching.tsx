import { Recipe, User, RecipeFilters, RecipeSortOption, Comment } from '@/types';
import { RecipeStore } from './store';

// Simulate network delay for realistic loading states
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Cache for API responses to prevent duplicate calls during the same request
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5000; // 5 seconds

/**
 * Fetch recipes with optional filtering, sorting, and pagination
 */
export async function fetchRecipes(
  filters?: RecipeFilters,
  sort?: RecipeSortOption,
  page = 1,
  pageSize = 12
): Promise<{ recipes: Recipe[]; total: number }> {
  const cacheKey = `recipes:${JSON.stringify(filters)}:${sort}:${page}:${pageSize}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  await delay(300); // Simulate network delay
  
  const store = RecipeStore.getInstance();
  const result = store.getRecipes(filters, sort, page, pageSize);
  
  cache.set(cacheKey, { data: result, timestamp: Date.now() });
  return result;
}

/**
 * Fetch a single recipe by ID
 */
export async function fetchRecipeById(id: string): Promise<Recipe | null> {
  const cacheKey = `recipe:${id}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  await delay(200);
  
  const store = RecipeStore.getInstance();
  const recipe = store.getRecipeById(id);
  
  if (recipe) {
    cache.set(cacheKey, { data: recipe, timestamp: Date.now() });
  }
  
  return recipe;
}

/**
 * Fetch user profile by username
 */
export async function fetchUserByUsername(username: string): Promise<User | null> {
  const cacheKey = `user:${username}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  await delay(200);
  
  const store = RecipeStore.getInstance();
  const user = store.getUserByUsername(username);
  
  if (user) {
    cache.set(cacheKey, { data: user, timestamp: Date.now() });
  }
  
  return user;
}

/**
 * Fetch recipes by a specific user
 */
export async function fetchUserRecipes(
  username: string,
  filters?: RecipeFilters,
  sort?: RecipeSortOption,
  page = 1,
  pageSize = 12
): Promise<{ recipes: Recipe[]; total: number }> {
  const cacheKey = `user-recipes:${username}:${JSON.stringify(filters)}:${sort}:${page}:${pageSize}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  await delay(300);
  
  const store = RecipeStore.getInstance();
  const result = store.getRecipesByUser(username, filters, sort, page, pageSize);
  
  cache.set(cacheKey, { data: result, timestamp: Date.now() });
  return result;
}

/**
 * Fetch comments for a recipe
 */
export async function fetchRecipeComments(recipeId: string): Promise<Comment[]> {
  const cacheKey = `comments:${recipeId}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  await delay(200);
  
  const store = RecipeStore.getInstance();
  const comments = store.getCommentsByRecipeId(recipeId);
  
  cache.set(cacheKey, { data: comments, timestamp: Date.now() });
  return comments;
}

/**
 * Fetch personalized feed for the current user
 */
export async function fetchUserFeed(
  userId: string,
  page = 1,
  pageSize = 12
): Promise<{ recipes: Recipe[]; total: number }> {
  const cacheKey = `feed:${userId}:${page}:${pageSize}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  await delay(400);
  
  const store = RecipeStore.getInstance();
  const result = store.getUserFeed(userId, page, pageSize);
  
  cache.set(cacheKey, { data: result, timestamp: Date.now() });
  return result;
}

/**
 * Fetch saved recipes for the current user
 */
export async function fetchSavedRecipes(
  userId: string,
  page = 1,
  pageSize = 12
): Promise<{ recipes: Recipe[]; total: number }> {
  const cacheKey = `saved:${userId}:${page}:${pageSize}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  await delay(300);
  
  const store = RecipeStore.getInstance();
  const result = store.getSavedRecipes(userId, page, pageSize);
  
  cache.set(cacheKey, { data: result, timestamp: Date.now() });
  return result;
}

/**
 * Fetch trending recipes
 */
export async function fetchTrendingRecipes(limit = 8): Promise<Recipe[]> {
  const cacheKey = `trending:${limit}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  await delay(300);
  
  const store = RecipeStore.getInstance();
  const recipes = store.getTrendingRecipes(limit);
  
  cache.set(cacheKey, { data: recipes, timestamp: Date.now() });
  return recipes;
}

/**
 * Fetch trending chefs
 */
export async function fetchTrendingChefs(limit = 6): Promise<User[]> {
  const cacheKey = `trending-chefs:${limit}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  await delay(300);
  
  const store = RecipeStore.getInstance();
  const chefs = store.getTrendingChefs(limit);
  
  cache.set(cacheKey, { data: chefs, timestamp: Date.now() });
  return chefs;
}

/**
 * Clear cache for a specific key or all cache
 */
export function clearCache(key?: string) {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}

/**
 * Prefetch data for a route
 */
export async function prefetchData(keys: string[]) {
  const promises = keys.map(key => {
    if (key.startsWith('recipe:')) {
      const id = key.split(':')[1];
      return fetchRecipeById(id);
    } else if (key.startsWith('user:')) {
      const username = key.split(':')[1];
      return fetchUserByUsername(username);
    }
    return Promise.resolve(null);
  });
  
  await Promise.all(promises);
}