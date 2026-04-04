import { Suspense } from 'react';
import { Metadata } from 'next';
import { RecipeGrid } from '@/components/recipe/RecipeGrid';
import { RecipeFilters } from '@/components/recipe/RecipeFilters';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { ChefHat, Filter, Search, TrendingUp, Clock, Star, Flame, Users, Plus, Grid, List } from 'lucide-react';
import { RecipeStore } from '@/lib/store';
import { RecipeFilters as RecipeFiltersType, RecipeSortOption } from '@/types';
import { getCurrentUser } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Browse Recipes - RecipeShare',
  description: 'Browse thousands of recipes from our community. Filter by category, dietary preferences, cooking time, and more.',
};

interface SearchParams {
  search?: string;
  category?: string;
  difficulty?: string;
  time?: string;
  sort?: RecipeSortOption;
  page?: string;
}

async function getRecipes(searchParams: SearchParams) {
  const store = RecipeStore.getInstance();
  
  const filters: RecipeFiltersType = {
    search: searchParams.search || '',
    category: searchParams.category || undefined,
    difficulty: searchParams.difficulty as any || undefined,
    maxTime: searchParams.time ? parseInt(searchParams.time) : undefined,
  };
  
  const sort = searchParams.sort || 'trending';
  const page = searchParams.page ? parseInt(searchParams.page) : 1;
  
  const recipes = store.getRecipes(filters, sort, page, 12);
  const totalRecipes = store.getRecipeCount(filters);
  
  return {
    recipes,
    totalRecipes,
    page,
    totalPages: Math.ceil(totalRecipes / 12),
  };
}

export default async function RecipesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const { recipes, totalRecipes, page, totalPages } = await getRecipes(params);
  const currentUser = await getCurrentUser();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-700 dark:to-primary-800">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl">
            <div className="flex items-center gap-2 mb-4">
              <ChefHat className="w-6 h-6 text-white" />
              <span className="text-sm font-semibold text-white/90 uppercase tracking-wider">
                Recipe Collection
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Discover Amazing Recipes
            </h1>
            <p className="text-lg text-white/90 mb-8">
              Browse {totalRecipes.toLocaleString()}+ recipes shared by our community of food enthusiasts. 
              Filter by your preferences and find your next favorite meal.
            </p>
            
            {/* Quick Stats */}
            <div className="flex flex-wrap gap-6 mb-8">
              <div className="flex items-center gap-2 text-white/80">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">Trending recipes updated daily</span>
              </div>
              <div className="flex items-center gap-2 text-white/80">
                <Star className="w-4 h-4" />
                <span className="text-sm">Community-rated recipes</span>
              </div>
              <div className="flex items-center gap-2 text-white/80">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Filter by cooking time</span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                className="bg-white text-primary-700 hover:bg-gray-100"
                asChild
              >
                <Link href="/recipes/create">
                  <Plus className="w-4 h-4 mr-2" />
                  Share Your Recipe
                </Link>
              </Button>
              {currentUser && (
                <Button
                  variant="outline"
                  className="border-white text-white hover:bg-white/10"
                  asChild
                >
                  <Link href="/saved">
                    <ChefHat className="w-4 h-4 mr-2" />
                    View Saved Recipes
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="lg:w-1/4">
            <div className="sticky top-24">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
                <div className="flex items-center gap-2 mb-6">
                  <Filter className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Filters
                  </h2>
                </div>
                
                <Suspense fallback={
                  <div className="flex justify-center py-8">
                    <Spinner />
                  </div>
                }>
                  <RecipeFilters initialFilters={params} />
                </Suspense>
              </div>
              
              {/* Quick Links */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                  Quick Links
                </h3>
                <div className="space-y-3">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                    asChild
                  >
                    <Link href="/recipes?sort=trending">
                      <TrendingUp className="w-4 h-4 mr-3" />
                      Trending Recipes
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                    asChild
                  >
                    <Link href="/recipes?time=30">
                      <Clock className="w-4 h-4 mr-3" />
                      Quick Meals (30min)
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                    asChild
                  >
                    <Link href="/recipes?difficulty=easy">
                      <Flame className="w-4 h-4 mr-3" />
                      Easy Recipes
                    </Link>
                  </Button>
                  {currentUser && (
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                      asChild
                    >
                      <Link href="/feed">
                        <Users className="w-4 h-4 mr-3" />
                        Following Feed
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </aside>

          {/* Recipe Grid */}
          <main className="lg:w-3/4">
            {/* Results Header */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {params.search ? `Search: "${params.search}"` : 'All Recipes'}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Showing {recipes.length} of {totalRecipes.toLocaleString()} recipes
                    {params.category && ` in ${params.category}`}
                  </p>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Sort by:</span>
                    <select 
                      defaultValue={params.sort || 'trending'}
                      className="bg-gray-100 dark:bg-gray-700 border-0 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
                      onChange={(e) => {
                        const url = new URL(window.location.href);
                        url.searchParams.set('sort', e.target.value);
                        window.location.href = url.toString();
                      }}
                    >
                      <option value="trending">Trending</option>
                      <option value="newest">Newest</option>
                      <option value="rating">Highest Rated</option>
                      <option value="time">Quickest</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Active Filters */}
              {(params.search || params.category || params.difficulty || params.time) && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-3">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Active Filters:
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {params.search && (
                      <div className="inline-flex items-center gap-1 bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 px-3 py-1 rounded-full text-sm">
                        Search: {params.search}
                        <button
                          onClick={() => {
                            const url = new URL(window.location.href);
                            url.searchParams.delete('search');
                            window.location.href = url.toString();
                          }}
                          className="ml-1 hover:text-primary-600"
                        >
                          ×
                        </button>
                      </div>
                    )}
                    {params.category && (
                      <div className="inline-flex items-center gap-1 bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 px-3 py-1 rounded-full text-sm">
                        Category: {params.category}
                        <button
                          onClick={() => {
                            const url = new URL(window.location.href);
                            url.searchParams.delete('category');
                            window.location.href = url.toString();
                          }}
                          className="ml-1 hover:text-primary-600"
                        >
                          ×
                        </button>
                      </div>
                    )}
                    {params.difficulty && (
                      <div className="inline-flex items-center gap-1 bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 px-3 py-1 rounded-full text-sm">
                        Difficulty: {params.difficulty}
                        <button
                          onClick={() => {
                            const url = new URL(window.location.href);
                            url.searchParams.delete('difficulty');
                            window.location.href = url.toString();
                          }}
                          className="ml-1 hover:text-primary-600"
                        >
                          ×
                        </button>
                      </div>
                    )}
                    {params.time && (
                      <div className="inline-flex items-center gap-1 bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 px-3 py-1 rounded-full text-sm">
                        Max Time: {params.time}min
                        <button
                          onClick={() => {
                            const url = new URL(window.location.href);
                            url.searchParams.delete('time');
                            window.location.href = url.toString();
                          }}
                          className="ml-1 hover:text-primary-600"
                        >
                          ×
                        </button>
                      </div>
                    )}
                    {(params.search || params.category || params.difficulty || params.time) && (
                      <button
                        onClick={() => {
                          window.location.href = '/recipes';
                        }}
                        className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Recipe Grid */}
            <Suspense fallback={
              <div className="flex justify-center py-20">
                <Spinner size="lg" />
              </div>
            }>
              <RecipeGrid 
                recipes={recipes}
                isLoading={false}
                loadingMore={false}
                onLoadMore={() => {}}
                showLoadMore={page < totalPages}
                emptyMessage={
                  <div className="text-center py-16">
                    <ChefHat className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      No recipes found
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                      {params.search 
                        ? `No recipes found for "${params.search}". Try a different search term or browse all recipes.`
                        : 'No recipes match your current filters. Try adjusting your criteria.'}
                    </p>
                    <Button asChild>
                      <Link href="/recipes">
                        <Filter className="w-4 h-4 mr-2" />
                        Clear Filters
                      </Link>
                    </Button>
                  </div>
                }
              />
            </Suspense>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex justify-center">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    disabled={page <= 1}
                    onClick={() => {
                      const url = new URL(window.location.href);
                      url.searchParams.set('page', (page - 1).toString());
                      window.location.href = url.toString();
                    }}
                  >
                    Previous
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum = i + 1;
                      if (totalPages > 5) {
                        if (page > 3) {
                          pageNum = page - 2 + i;
                          if (pageNum > totalPages) return null;
                        }
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={pageNum === page ? 'primary' : 'outline'}
                          size="sm"
                          onClick={() => {
                            const url = new URL(window.location.href);
                            url.searchParams.set('page', pageNum.toString());
                            window.location.href = url.toString();
                          }}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    disabled={page >= totalPages}
                    onClick={() => {
                      const url = new URL(window.location.href);
                      url.searchParams.set('page', (page + 1).toString());
                      window.location.href = url.toString();
                    }}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

// Client component for Link
import Link from 'next/link';