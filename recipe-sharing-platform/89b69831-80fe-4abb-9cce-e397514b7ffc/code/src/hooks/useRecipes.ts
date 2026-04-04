'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Recipe, RecipeFilters, RecipeSortOption, RecipeFormData } from '@/types';
import { useToast } from './useToast';
import { useAuth } from './useAuth';

interface UseRecipesOptions {
  initialFilters?: RecipeFilters;
  initialSort?: RecipeSortOption;
  pageSize?: number;
  autoFetch?: boolean;
}

interface UseRecipesReturn {
  // State
  recipes: Recipe[];
  isLoading: boolean;
  error: string | null;
  filters: RecipeFilters;
  sort: RecipeSortOption;
  totalPages: number;
  currentPage: number;
  totalRecipes: number;
  hasMore: boolean;
  
  // Actions
  setFilters: (filters: RecipeFilters) => void;
  setSort: (sort: RecipeSortOption) => void;
  setPage: (page: number) => void;
  fetchRecipes: (options?: { page?: number; filters?: RecipeFilters; sort?: RecipeSortOption }) => Promise<void>;
  refreshRecipes: () => Promise<void>;
  createRecipe: (recipeData: RecipeFormData) => Promise<Recipe | null>;
  updateRecipe: (id: string, recipeData: Partial<RecipeFormData>) => Promise<Recipe | null>;
  deleteRecipe: (id: string) => Promise<boolean>;
  saveRecipe: (id: string) => Promise<boolean>;
  unsaveRecipe: (id: string) => Promise<boolean>;
  rateRecipe: (id: string, rating: number) => Promise<boolean>;
  getRecipe: (id: string) => Promise<Recipe | null>;
  getUserRecipes: (username: string, options?: { page?: number }) => Promise<Recipe[]>;
  getSavedRecipes: (options?: { page?: number }) => Promise<Recipe[]>;
  getFeedRecipes: (options?: { page?: number }) => Promise<Recipe[]>;
  
  // Derived state
  isSaving: boolean;
  isRating: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

export function useRecipes(options: UseRecipesOptions = {}): UseRecipesReturn {
  const {
    initialFilters = {},
    initialSort = 'newest',
    pageSize = 12,
    autoFetch = true,
  } = options;

  const { toast } = useToast();
  const { user } = useAuth();
  
  // State
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<RecipeFilters>(initialFilters);
  const [sort, setSortState] = useState<RecipeSortOption>(initialSort);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecipes, setTotalRecipes] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  
  // Action states
  const [isSaving, setIsSaving] = useState(false);
  const [isRating, setIsRating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Build query string from filters and sort
  const buildQueryString = useCallback((filters: RecipeFilters, sort: RecipeSortOption, page: number) => {
    const params = new URLSearchParams();
    
    // Add filters
    if (filters.category) params.append('category', filters.category);
    if (filters.difficulty) params.append('difficulty', filters.difficulty);
    if (filters.cookingTime) params.append('cookingTime', filters.cookingTime);
    if (filters.servings) params.append('servings', filters.servings.toString());
    if (filters.cuisine) params.append('cuisine', filters.cuisine);
    if (filters.dietary) params.append('dietary', filters.dietary);
    if (filters.minRating) params.append('minRating', filters.minRating.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.userId) params.append('userId', filters.userId);
    
    // Add pagination
    params.append('page', page.toString());
    params.append('limit', pageSize.toString());
    
    // Add sort
    params.append('sort', sort);
    
    return params.toString();
  }, [pageSize]);

  // Fetch recipes from API
  const fetchRecipes = useCallback(async (options?: {
    page?: number;
    filters?: RecipeFilters;
    sort?: RecipeSortOption;
  }) => {
    const page = options?.page ?? currentPage;
    const filtersToUse = options?.filters ?? filters;
    const sortToUse = options?.sort ?? sort;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const queryString = buildQueryString(filtersToUse, sortToUse, page);
      const response = await fetch(`/api/recipes?${queryString}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch recipes: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (page === 1) {
        setRecipes(data.recipes);
      } else {
        setRecipes(prev => [...prev, ...data.recipes]);
      }
      
      setTotalPages(data.pagination.totalPages);
      setTotalRecipes(data.pagination.total);
      setHasMore(data.pagination.page < data.pagination.totalPages);
      
      // Update state if options were provided
      if (options?.filters) {
        setFiltersState(options.filters);
      }
      if (options?.sort) {
        setSortState(options.sort);
      }
      if (options?.page !== undefined) {
        setCurrentPage(options.page);
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch recipes';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filters, sort, buildQueryString, toast]);

  // Refresh recipes
  const refreshRecipes = useCallback(async () => {
    await fetchRecipes({ page: 1 });
  }, [fetchRecipes]);

  // Set filters and reset to page 1
  const setFilters = useCallback((newFilters: RecipeFilters) => {
    setFiltersState(newFilters);
    setCurrentPage(1);
    fetchRecipes({ page: 1, filters: newFilters });
  }, [fetchRecipes]);

  // Set sort and reset to page 1
  const setSort = useCallback((newSort: RecipeSortOption) => {
    setSortState(newSort);
    setCurrentPage(1);
    fetchRecipes({ page: 1, sort: newSort });
  }, [fetchRecipes]);

  // Set page
  const setPage = useCallback((page: number) => {
    setCurrentPage(page);
    fetchRecipes({ page });
  }, [fetchRecipes]);

  // Create a new recipe
  const createRecipe = useCallback(async (recipeData: RecipeFormData): Promise<Recipe | null> => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to create a recipe',
        type: 'error',
      });
      return null;
    }
    
    setIsCreating(true);
    
    try {
      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(recipeData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create recipe');
      }
      
      const newRecipe = await response.json();
      
      toast({
        title: 'Recipe created!',
        description: 'Your recipe has been successfully created.',
        type: 'success',
      });
      
      // Refresh recipes to include the new one
      await refreshRecipes();
      
      return newRecipe;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create recipe';
      toast({
        title: 'Error',
        description: errorMessage,
        type: 'error',
      });
      return null;
    } finally {
      setIsCreating(false);
    }
  }, [user, toast, refreshRecipes]);

  // Update an existing recipe
  const updateRecipe = useCallback(async (id: string, recipeData: Partial<RecipeFormData>): Promise<Recipe | null> => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to update a recipe',
        type: 'error',
      });
      return null;
    }
    
    setIsUpdating(true);
    
    try {
      const response = await fetch(`/api/recipes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(recipeData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update recipe');
      }
      
      const updatedRecipe = await response.json();
      
      toast({
        title: 'Recipe updated!',
        description: 'Your recipe has been successfully updated.',
        type: 'success',
      });
      
      // Update local state
      setRecipes(prev => prev.map(recipe => 
        recipe.id === id ? updatedRecipe : recipe
      ));
      
      return updatedRecipe;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update recipe';
      toast({
        title: 'Error',
        description: errorMessage,
        type: 'error',
      });
      return null;
    } finally {
      setIsUpdating(false);
    }
  }, [user, toast]);

  // Delete a recipe
  const deleteRecipe = useCallback(async (id: string): Promise<boolean> => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to delete a recipe',
        type: 'error',
      });
      return false;
    }
    
    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/recipes/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete recipe');
      }
      
      toast({
        title: 'Recipe deleted',
        description: 'Your recipe has been successfully deleted.',
        type: 'success',
      });
      
      // Remove from local state
      setRecipes(prev => prev.filter(recipe => recipe.id !== id));
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete recipe';
      toast({
        title: 'Error',
        description: errorMessage,
        type: 'error',
      });
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, [user, toast]);

  // Save a recipe
  const saveRecipe = useCallback(async (id: string): Promise<boolean> => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to save recipes',
        type: 'error',
      });
      return false;
    }
    
    setIsSaving(true);
    
    try {
      const response = await fetch(`/api/recipes/${id}/save`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save recipe');
      }
      
      toast({
        title: 'Recipe saved!',
        description: 'Recipe added to your saved collection.',
        type: 'success',
      });
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save recipe';
      toast({
        title: 'Error',
        description: errorMessage,
        type: 'error',
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [user, toast]);

  // Unsave a recipe
  const unsaveRecipe = useCallback(async (id: string): Promise<boolean> => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to manage saved recipes',
        type: 'error',
      });
      return false;
    }
    
    setIsSaving(true);
    
    try {
      const response = await fetch(`/api/recipes/${id}/save`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to unsave recipe');
      }
      
      toast({
        title: 'Recipe removed',
        description: 'Recipe removed from your saved collection.',
        type: 'success',
      });
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to unsave recipe';
      toast({
        title: 'Error',
        description: errorMessage,
        type: 'error',
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [user, toast]);

  // Rate a recipe
  const rateRecipe = useCallback(async (id: string, rating: number): Promise<boolean> => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to rate recipes',
        type: 'error',
      });
      return false;
    }
    
    if (rating < 1 || rating > 5) {
      toast({
        title: 'Invalid rating',
        description: 'Rating must be between 1 and 5 stars',
        type: 'error',
      });
      return false;
    }
    
    setIsRating(true);
    
    try {
      const response = await fetch(`/api/recipes/${id}/rating`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rating }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to rate recipe');
      }
      
      toast({
        title: 'Rating submitted!',
        description: 'Thank you for rating this recipe.',
        type: 'success',
      });
      
      // Update local state
      const updatedRecipeResponse = await fetch(`/api/recipes/${id}`);
      if (updatedRecipeResponse.ok) {
        const updatedRecipe = await updatedRecipeResponse.json();
        setRecipes(prev => prev.map(recipe => 
          recipe.id === id ? updatedRecipe : recipe
        ));
      }
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to rate recipe';
      toast({
        title: 'Error',
        description: errorMessage,
        type: 'error',
      });
      return false;
    } finally {
      setIsRating(false);
    }
  }, [user, toast]);

  // Get a single recipe by ID
  const getRecipe = useCallback(async (id: string): Promise<Recipe | null> => {
    try {
      const response = await fetch(`/api/recipes/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to fetch recipe: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch recipe';
      toast({
        title: 'Error',
        description: errorMessage,
        type: 'error',
      });
      return null;
    }
  }, [toast]);

  // Get recipes by a specific user
  const getUserRecipes = useCallback(async (username: string, options?: { page?: number }): Promise<Recipe[]> => {
    const page = options?.page ?? 1;
    
    try {
      const response = await fetch(`/api/users/${username}/recipes?page=${page}&limit=${pageSize}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch user recipes: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.recipes;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user recipes';
      toast({
        title: 'Error',
        description: errorMessage,
        type: 'error',
      });
      return [];
    }
  }, [pageSize, toast]);

  // Get saved recipes for current user
  const getSavedRecipes = useCallback(async (options?: { page?: number }): Promise<Recipe[]> => {
    if (!user) {
      return [];
    }
    
    const page = options?.page ?? 1;
    
    try {
      const response = await fetch(`/api/saved?page=${page}&limit=${pageSize}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch saved recipes: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.recipes;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch saved recipes';
      toast({
        title: 'Error',
        description: errorMessage,
        type: 'error',
      });
      return [];
    }
  }, [user, pageSize, toast]);

  // Get personalized feed recipes
  const getFeedRecipes = useCallback(async (options?: { page?: number }): Promise<Recipe[]> => {
    if (!user) {
      return [];
    }
    
    const page = options?.page ?? 1;
    
    try {
      const response = await fetch(`/api/feed?page=${page}&limit=${pageSize}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch feed recipes: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.recipes;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch feed recipes';
      toast({
        title: 'Error',
        description: errorMessage,
        type: 'error',
      });
      return [];
    }
  }, [user, pageSize, toast]);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      fetchRecipes();
    }
  }, [autoFetch, fetchRecipes]);

  // Memoized return value
  const returnValue = useMemo(() => ({
    // State
    recipes,
    isLoading,
    error,
    filters,
    sort,
    totalPages,
    currentPage,
    totalRecipes,
    hasMore,
    
    // Actions
    setFilters,
    setSort,
    setPage,
    fetchRecipes,
    refreshRecipes,
    createRecipe,
    updateRecipe,
    deleteRecipe,
    saveRecipe,
    unsaveRecipe,
    rateRecipe,
    getRecipe,
    getUserRecipes,
    getSavedRecipes,
    getFeedRecipes,
    
    // Derived state
    isSaving,
    isRating,
    isCreating,
    isUpdating,
    isDeleting,
  }), [
    recipes,
    isLoading,
    error,
    filters,
    sort,
    totalPages,
    currentPage,
    totalRecipes,
    hasMore,
    setFilters,
    setSort,
    setPage,
    fetchRecipes,
    refreshRecipes,
    createRecipe,
    updateRecipe,
    deleteRecipe,
    saveRecipe,
    unsaveRecipe,
    rateRecipe,
    getRecipe,
    getUserRecipes,
    getSavedRecipes,
    getFeedRecipes,
    isSaving,
    isRating,
    isCreating,
    isUpdating,
    isDeleting,
  ]);

  return returnValue;
}