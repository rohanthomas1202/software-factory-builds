import { Suspense } from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { RecipeStore } from '@/lib/store';
import { getCurrentUser } from '@/lib/auth';
import { RecipeGrid } from '@/components/recipe/RecipeGrid';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import {
  Bookmark,
  BookmarkCheck,
  ChefHat,
  Folder,
  Grid,
  List,
  Plus,
  Search,
  Star,
  Tag,
  Trash2,
  Users,
  Filter,
  Clock,
  Flame,
  TrendingUp,
  FolderPlus,
  BookOpen,
  Heart
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Saved Recipes - RecipeShare',
  description: 'Your collection of saved recipes and cooking inspiration',
};

async function SavedContent() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-100 to-primary-300 dark:from-primary-900/30 dark:to-primary-700/30 flex items-center justify-center mb-6">
          <Bookmark className="w-12 h-12 text-primary-600 dark:text-primary-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          Sign in to save recipes
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mb-8">
          Save your favorite recipes to collections and access them anytime.
        </p>
        <div className="flex gap-4">
          <Button asChild variant="primary">
            <Link href="/login">Sign In</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/recipes">Browse Recipes</Link>
          </Button>
        </div>
      </div>
    );
  }

  const store = RecipeStore.getInstance();
  
  // Get saved recipes
  const savedRecipeIds = currentUser.savedRecipes;
  const savedRecipes = savedRecipeIds.map(id => store.getRecipe(id)).filter(Boolean);
  
  // Get recently saved recipes (last 30 days)
  const recentlySavedRecipes = savedRecipes.filter(recipe => {
    const saveDate = new Date(recipe.createdAt);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return saveDate > thirtyDaysAgo;
  });
  
  // Get highly rated saved recipes
  const highlyRatedRecipes = savedRecipes.filter(recipe => recipe.averageRating >= 4);
  
  // Get quick recipes (under 30 minutes)
  const quickRecipes = savedRecipes.filter(recipe => recipe.prepTime + recipe.cookTime <= 30);

  // Mock collections (in a real app, this would come from the database)
  const collections = [
    { id: '1', name: 'Weeknight Dinners', count: 8, color: 'from-blue-500 to-cyan-500', icon: <ChefHat className="w-5 h-5" /> },
    { id: '2', name: 'Desserts', count: 12, color: 'from-pink-500 to-rose-500', icon: <Star className="w-5 h-5" /> },
    { id: '3', name: 'Meal Prep', count: 6, color: 'from-green-500 to-emerald-500', icon: <Clock className="w-5 h-5" /> },
    { id: '4', name: 'Party Food', count: 5, color: 'from-purple-500 to-violet-500', icon: <Users className="w-5 h-5" /> },
    { id: '5', name: 'Healthy Choices', count: 7, color: 'from-teal-500 to-cyan-500', icon: <Flame className="w-5 h-5" /> },
  ];

  const tabs = [
    { id: 'all', label: 'All Saved', icon: <Bookmark className="w-4 h-4" />, count: savedRecipes.length },
    { id: 'recent', label: 'Recently Saved', icon: <Clock className="w-4 h-4" />, count: recentlySavedRecipes.length },
    { id: 'top-rated', label: 'Top Rated', icon: <Star className="w-4 h-4" />, count: highlyRatedRecipes.length },
    { id: 'quick', label: 'Quick Meals', icon: <Flame className="w-4 h-4" />, count: quickRecipes.length },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Saved Recipes
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Your personal collection of cooking inspiration
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link href="/recipes">
                <Search className="w-4 h-4 mr-2" />
                Find More Recipes
              </Link>
            </Button>
            <Button variant="primary" size="sm" asChild>
              <Link href="/recipes/create">
                <Plus className="w-4 h-4 mr-2" />
                Create Recipe
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-xl p-6 border border-primary-100 dark:border-primary-800/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Saved</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{savedRecipes.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <Bookmark className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-6 border border-blue-100 dark:border-blue-800/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Collections</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{collections.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Folder className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-xl p-6 border border-amber-100 dark:border-amber-800/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Top Rated</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{highlyRatedRecipes.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Star className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-xl p-6 border border-emerald-100 dark:border-emerald-800/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Quick Meals</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{quickRecipes.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Flame className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Collections */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Your Collections
            </h2>
            <Button variant="ghost" size="sm">
              <FolderPlus className="w-4 h-4 mr-2" />
              New Collection
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {collections.map(collection => (
              <Link
                key={collection.id}
                href="#"
                className="group relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 hover:shadow-lg transition-all hover:border-primary-300 dark:hover:border-primary-500"
              >
                <div className="absolute top-0 right-0 w-16 h-16 opacity-10">
                  <div className={`bg-gradient-to-br ${collection.color} w-full h-full`} />
                </div>
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${collection.color} flex items-center justify-center mb-4`}>
                  <div className="text-white">
                    {collection.icon}
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400">
                  {collection.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {collection.count} recipes
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Saved Recipes Content */}
      {savedRecipes.length > 0 ? (
        <>
          {/* Tabs */}
          <div className="mb-8">
            <Tabs
              items={tabs}
              activeTab="all"
              onTabChange={() => {}}
              variant="underline"
              className="border-b border-gray-200 dark:border-gray-700"
            />
          </div>

          {/* Recipes Grid */}
          <div className="mb-8">
            <RecipeGrid
              recipes={savedRecipes}
              showFilters={true}
              showSort={true}
              emptyState={
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    No recipes in this collection
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Try saving some recipes to see them here.
                  </p>
                  <Button variant="outline" asChild>
                    <Link href="/recipes">
                      <Search className="w-4 h-4 mr-2" />
                      Browse Recipes
                    </Link>
                  </Button>
                </div>
              }
            />
          </div>

          {/* Recently Saved */}
          {recentlySavedRecipes.length > 0 && (
            <div className="mt-12">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Recently Saved
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Recipes you&apos;ve saved in the last 30 days
                  </p>
                </div>
                <Badge variant="primary" size="lg">
                  <Clock className="w-3 h-3 mr-1" />
                  Recent
                </Badge>
              </div>
              <RecipeGrid
                recipes={recentlySavedRecipes.slice(0, 6)}
                gridCols="lg:grid-cols-3"
                showFilters={false}
                showSort={false}
              />
            </div>
          )}

          {/* Top Rated Saved Recipes */}
          {highlyRatedRecipes.length > 0 && (
            <div className="mt-12">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Your Top Rated
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Highly rated recipes in your collection
                  </p>
                </div>
                <Badge variant="warning" size="lg">
                  <Star className="w-3 h-3 mr-1" />
                  4+ Stars
                </Badge>
              </div>
              <RecipeGrid
                recipes={highlyRatedRecipes.slice(0, 6)}
                gridCols="lg:grid-cols-3"
                showFilters={false}
                showSort={false}
              />
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-100 to-primary-300 dark:from-primary-900/30 dark:to-primary-700/30 flex items-center justify-center mx-auto mb-6">
            <Bookmark className="w-12 h-12 text-primary-600 dark:text-primary-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Your saved recipes collection is empty
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-8">
            Save recipes you love to create your personal cookbook. You can organize them into collections and access them anytime.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="primary" asChild>
              <Link href="/recipes">
                <Search className="w-4 h-4 mr-2" />
                Browse Recipes
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/recipes/create">
                <ChefHat className="w-4 h-4 mr-2" />
                Create Your Own
              </Link>
            </Button>
          </div>
          
          {/* Tips */}
          <div className="mt-12 max-w-2xl mx-auto">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              How to get started:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-3">
                  <Search className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <h5 className="font-medium text-gray-900 dark:text-white mb-2">Browse Recipes</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Explore thousands of recipes from our community
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-3">
                  <Bookmark className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h5 className="font-medium text-gray-900 dark:text-white mb-2">Save Favorites</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Click the bookmark icon on any recipe to save it
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3">
                  <Folder className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <h5 className="font-medium text-gray-900 dark:text-white mb-2">Organize</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Create collections to organize your saved recipes
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SavedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <Spinner size="lg" className="mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading your saved recipes...</p>
          </div>
        </div>
      }
    >
      <SavedContent />
    </Suspense>
  );
}