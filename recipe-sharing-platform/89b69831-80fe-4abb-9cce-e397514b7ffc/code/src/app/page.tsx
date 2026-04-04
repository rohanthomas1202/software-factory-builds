import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { RecipeGrid } from '@/components/recipe/RecipeGrid';
import { HeroSearch } from '@/components/home/HeroSearch';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { FeaturedRecipes } from '@/components/home/FeaturedRecipes';
import { TrendingChefs } from '@/components/home/TrendingChefs';
import { Spinner } from '@/components/ui/Spinner';
import { ChefHat, TrendingUp, Star, Users, Flame, ArrowRight, Sparkles, Award, Heart } from 'lucide-react';
import { RecipeStore } from '@/lib/store';
import { getCurrentUser } from '@/lib/auth';
import { Recipe } from '@/types';

export const metadata = {
  title: 'RecipeShare - Discover & Share Amazing Recipes',
  description: 'Join our community of food enthusiasts. Discover, share, and rate thousands of delicious recipes from home cooks and professional chefs.',
};

async function getFeaturedRecipes(): Promise<Recipe[]> {
  const store = RecipeStore.getInstance();
  const recipes = store.getRecipes({}, 'trending', 1, 8);
  return recipes;
}

async function getTrendingChefs() {
  const store = RecipeStore.getInstance();
  const users = store.getAllUsers();
  
  // Sort by recipe count and followers
  return users
    .sort((a, b) => {
      const scoreA = a.recipeCount * 2 + a.followers.length;
      const scoreB = b.recipeCount * 2 + b.followers.length;
      return scoreB - scoreA;
    })
    .slice(0, 6);
}

export default async function HomePage() {
  const [featuredRecipes, trendingChefs] = await Promise.all([
    getFeaturedRecipes(),
    getTrendingChefs(),
  ]);
  
  const currentUser = await getCurrentUser();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 dark:from-primary-700 dark:via-primary-800 dark:to-primary-900">
        <div className="absolute inset-0 bg-grid-white/10 bg-grid-16" />
        <div className="relative container mx-auto px-4 py-24 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Sparkles className="w-4 h-4 text-white" />
              <span className="text-sm font-medium text-white">
                Join 10,000+ food enthusiasts
              </span>
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Discover & Share
              <span className="block bg-gradient-to-r from-amber-200 to-yellow-300 bg-clip-text text-transparent">
                Amazing Recipes
              </span>
            </h1>
            
            <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
              Join our vibrant community of home cooks and professional chefs. 
              Share your culinary creations, discover new favorites, and connect with food lovers worldwide.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button
                size="lg"
                className="bg-white text-primary-700 hover:bg-gray-100 px-8 py-3 rounded-full font-semibold shadow-lg"
                asChild
              >
                <Link href="/recipes">
                  <ChefHat className="w-5 h-5 mr-2" />
                  Explore Recipes
                </Link>
              </Button>
              {!currentUser ? (
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white/10 px-8 py-3 rounded-full font-semibold"
                  asChild
                >
                  <Link href="/register">
                    Join Community
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
              ) : (
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white/10 px-8 py-3 rounded-full font-semibold"
                  asChild
                >
                  <Link href="/recipes/create">
                    <Sparkles className="w-5 h-5 mr-2" />
                    Share Recipe
                  </Link>
                </Button>
              )}
            </div>
            
            {/* Hero Search */}
            <div className="max-w-2xl mx-auto">
              <HeroSearch />
            </div>
          </div>
        </div>
        
        {/* Stats */}
        <div className="relative bg-white/10 backdrop-blur-sm border-t border-white/20">
          <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">10K+</div>
                <div className="text-white/80 text-sm">Recipes</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">5K+</div>
                <div className="text-white/80 text-sm">Community Chefs</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">100K+</div>
                <div className="text-white/80 text-sm">Ratings</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">1M+</div>
                <div className="text-white/80 text-sm">Cooked Meals</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Recipes */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                <span className="text-sm font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wider">
                  Trending Now
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                Featured Recipes
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Discover what&apos;s cooking in our community
              </p>
            </div>
            <Button variant="ghost" asChild>
              <Link href="/recipes" className="group">
                View All
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
          
          <Suspense fallback={
            <div className="flex justify-center py-20">
              <Spinner size="lg" />
            </div>
          }>
            <FeaturedRecipes recipes={featuredRecipes} />
          </Suspense>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 md:py-24 bg-gray-50 dark:bg-gray-900/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-2">
              <ChefHat className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              <span className="text-sm font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wider">
                Explore By Category
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Find Your Perfect Recipe
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Browse through thousands of recipes organized by cuisine, dietary preferences, and cooking style
            </p>
          </div>
          
          <CategoryGrid />
          
          <div className="text-center mt-12">
            <Button size="lg" variant="outline" asChild>
              <Link href="/recipes">
                <Filter className="w-5 h-5 mr-2" />
                Browse All Categories
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Trending Chefs */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                <span className="text-sm font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wider">
                  Community Stars
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                Trending Chefs
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Follow top contributors and get inspired
              </p>
            </div>
            <Button variant="ghost" asChild>
              <Link href="/recipes" className="group">
                View All
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
          
          <Suspense fallback={
            <div className="flex justify-center py-20">
              <Spinner size="lg" />
            </div>
          }>
            <TrendingChefs chefs={trendingChefs} />
          </Suspense>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-700 dark:to-primary-800">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Heart className="w-16 h-16 text-white/20 mx-auto mb-8" />
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Share Your Culinary Magic?
            </h2>
            <p className="text-xl text-white/90 mb-10">
              Join thousands of food enthusiasts sharing their favorite recipes, 
              tips, and culinary adventures. Your next great recipe could inspire someone&apos;s next meal!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!currentUser ? (
                <>
                  <Button
                    size="lg"
                    className="bg-white text-primary-700 hover:bg-gray-100 px-8 py-3 rounded-full font-semibold shadow-lg"
                    asChild
                  >
                    <Link href="/register">
                      Create Free Account
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-white text-white hover:bg-white/10 px-8 py-3 rounded-full font-semibold"
                    asChild
                  >
                    <Link href="/recipes">
                      Browse Recipes First
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="lg"
                    className="bg-white text-primary-700 hover:bg-gray-100 px-8 py-3 rounded-full font-semibold shadow-lg"
                    asChild
                  >
                    <Link href="/recipes/create">
                      <Sparkles className="w-5 h-5 mr-2" />
                      Share Your Recipe
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-white text-white hover:bg-white/10 px-8 py-3 rounded-full font-semibold"
                    asChild
                  >
                    <Link href="/feed">
                      <TrendingUp className="w-5 h-5 mr-2" />
                      View Your Feed
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}