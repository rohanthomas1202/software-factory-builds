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
  ChefHat, 
  Users, 
  Flame, 
  Clock, 
  RefreshCw, 
  TrendingUp, 
  Heart, 
  Bell, 
  UserPlus, 
  Search,
  Filter,
  Grid,
  List,
  Bookmark,
  Star
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'My Feed - RecipeShare',
  description: 'Personalized recipe feed from chefs you follow',
};

async function FeedContent() {
  const currentUser = await getCurrentUser();
  
  if (!currentUser) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-100 to-primary-300 dark:from-primary-900/30 dark:to-primary-700/30 flex items-center justify-center mb-6">
          <Users className="w-12 h-12 text-primary-600 dark:text-primary-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          Sign in to see your personalized feed
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mb-8">
          Follow your favorite chefs to see their latest recipes in your personalized feed.
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
  
  // Get feed recipes (recipes from followed users)
  const feedRecipes = store.getFeedRecipes(currentUser.id);
  
  // Get followed users
  const followedUsers = currentUser.following.map(userId => store.getUser(userId)).filter(Boolean);
  
  // Get trending recipes from followed users
  const trendingRecipes = store.getTrendingRecipesFromFollowing(currentUser.id);
  
  // Get new recipes from followed users (last 7 days)
  const newRecipes = store.getNewRecipesFromFollowing(currentUser.id, 7);

  const tabs = [
    { id: 'all', label: 'All Recipes', icon: <Grid className="w-4 h-4" />, count: feedRecipes.length },
    { id: 'trending', label: 'Trending', icon: <TrendingUp className="w-4 h-4" />, count: trendingRecipes.length },
    { id: 'new', label: 'New', icon: <Bell className="w-4 h-4" />, count: newRecipes.length },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              My Feed
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Latest recipes from chefs you follow
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link href="/recipes">
                <Search className="w-4 h-4 mr-2" />
                Discover More
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/profile/edit">
                <UserPlus className="w-4 h-4 mr-2" />
                Follow Chefs
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-xl p-6 border border-primary-100 dark:border-primary-800/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Following</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{followedUsers.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl p-6 border border-orange-100 dark:border-orange-800/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Recipes in Feed</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{feedRecipes.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <ChefHat className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-6 border border-purple-100 dark:border-purple-800/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">New This Week</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{newRecipes.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Bell className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Followed Users */}
        {followedUsers.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Chefs You Follow
              </h2>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/profile/edit">Manage</Link>
              </Button>
            </div>
            <div className="flex flex-wrap gap-3">
              {followedUsers.slice(0, 8).map(user => (
                <Link
                  key={user.id}
                  href={`/profile/${user.username}`}
                  className="group flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-500 transition-all hover:shadow-lg"
                >
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-primary-100 to-primary-300">
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={user.displayName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ChefHat className="w-5 h-5 text-primary-600" />
                        </div>
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400">
                      {user.displayName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {user.recipeCount} recipes
                    </p>
                  </div>
                </Link>
              ))}
              {followedUsers.length > 8 && (
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center">
                  <p className="text-gray-600 dark:text-gray-400">
                    +{followedUsers.length - 8} more
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty State for No Followed Users */}
        {followedUsers.length === 0 && (
          <div className="mb-8 p-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 rounded-2xl border border-gray-200 dark:border-gray-700 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-100 to-primary-300 dark:from-primary-900/30 dark:to-primary-700/30 flex items-center justify-center mx-auto mb-6">
              <UserPlus className="w-10 h-10 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Start following chefs to build your feed
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
              Follow your favorite chefs to see their latest recipes here. Discover new chefs from trending recipes and categories.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button variant="primary" asChild>
                <Link href="/recipes">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Discover Trending Chefs
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/profile/edit">
                  <Users className="w-4 h-4 mr-2" />
                  Find Chefs to Follow
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Feed Content */}
      {followedUsers.length > 0 && (
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
          {feedRecipes.length > 0 ? (
            <div className="mb-8">
              <RecipeGrid
                recipes={feedRecipes}
                showFilters={false}
                showSort={true}
                emptyState={
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center mx-auto mb-4">
                      <Clock className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      No new recipes from followed chefs
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      The chefs you follow haven&apos;t posted any recipes yet.
                    </p>
                    <Button variant="outline" asChild>
                      <Link href="/recipes/create">
                        <ChefHat className="w-4 h-4 mr-2" />
                        Be the first to post
                      </Link>
                    </Button>
                  </div>
                }
              />
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-100 to-primary-300 dark:from-primary-900/30 dark:to-primary-700/30 flex items-center justify-center mx-auto mb-6">
                <ChefHat className="w-12 h-12 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                Your feed is empty
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-8">
                Follow more chefs or encourage the chefs you follow to share their recipes.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button variant="primary" asChild>
                  <Link href="/recipes">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Discover Recipes
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/profile/edit">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Find More Chefs
                  </Link>
                </Button>
              </div>
            </div>
          )}

          {/* Trending from Following */}
          {trendingRecipes.length > 0 && (
            <div className="mt-12">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Trending from Following
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Most popular recipes from chefs you follow
                  </p>
                </div>
                <Badge variant="warning" size="lg">
                  <Flame className="w-3 h-3 mr-1" />
                  Hot Right Now
                </Badge>
              </div>
              <RecipeGrid
                recipes={trendingRecipes.slice(0, 6)}
                gridCols="lg:grid-cols-3"
                showFilters={false}
                showSort={false}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function FeedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <Spinner size="lg" className="mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading your personalized feed...</p>
          </div>
        </div>
      }
    >
      <FeedContent />
    </Suspense>
  );
}