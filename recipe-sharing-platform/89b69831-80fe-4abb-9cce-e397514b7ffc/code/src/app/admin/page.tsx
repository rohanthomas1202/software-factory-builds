import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { getCurrentUser } from '@/lib/auth';
import { RecipeStore } from '@/lib/store';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Shield, ChefHat, Users, FileText, BarChart, AlertTriangle, Settings, TrendingUp, Clock, Star } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Admin Dashboard - RecipeShare',
  description: 'Admin dashboard for content moderation and user management',
};

export default async function AdminPage() {
  const currentUser = await getCurrentUser();

  // Redirect if not admin
  if (!currentUser || !currentUser.isAdmin) {
    redirect('/');
  }

  const store = RecipeStore.getInstance();
  
  // Fetch admin statistics
  const allUsers = Array.from(store.getAllUsers().values());
  const allRecipes = Array.from(store.getAllRecipes().values());
  const allComments = Array.from(store.getAllComments().values());

  // Calculate statistics
  const totalUsers = allUsers.length;
  const totalRecipes = allRecipes.length;
  const totalComments = allComments.length;
  
  // New users in last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const newUsers = allUsers.filter(user => 
    new Date(user.joinDate) > sevenDaysAgo
  ).length;

  // New recipes in last 7 days
  const newRecipes = allRecipes.filter(recipe =>
    new Date(recipe.createdAt) > sevenDaysAgo
  ).length;

  // Recipes pending review (flagged or reported)
  const pendingReview = allRecipes.filter(recipe =>
    recipe.isFlagged || recipe.reports.length > 0
  ).length;

  // Top rated recipes
  const topRatedRecipes = [...allRecipes]
    .sort((a, b) => b.averageRating - a.averageRating)
    .slice(0, 5);

  // Most active users
  const mostActiveUsers = [...allUsers]
    .sort((a, b) => b.recipeCount - a.recipeCount)
    .slice(0, 5);

  // Recent activity
  const recentRecipes = [...allRecipes]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  const stats = {
    totalUsers,
    totalRecipes,
    totalComments,
    newUsers,
    newRecipes,
    pendingReview,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Shield className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                Admin Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Manage users, moderate content, and monitor platform activity
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Logged in as <span className="font-semibold text-primary-600 dark:text-primary-400">{currentUser.username}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
              >
                <Clock className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.totalUsers}</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600 dark:text-green-400 font-medium">+{stats.newUsers}</span>
              <span className="text-gray-500 dark:text-gray-400 ml-2">new this week</span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Recipes</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.totalRecipes}</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <ChefHat className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600 dark:text-green-400 font-medium">+{stats.newRecipes}</span>
              <span className="text-gray-500 dark:text-gray-400 ml-2">new this week</span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Comments</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.totalComments}</p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Review</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.pendingReview}</p>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => document.getElementById('pending-review-section')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Review Now
              </Button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg. Rating</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {allRecipes.length > 0 
                    ? (allRecipes.reduce((sum, recipe) => sum + recipe.averageRating, 0) / allRecipes.length).toFixed(1)
                    : '0.0'
                  }
                </p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Star className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              Platform average
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Today</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {allUsers.filter(user => 
                    user.lastActive && 
                    new Date(user.lastActive).toDateString() === new Date().toDateString()
                  ).length}
                </p>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <BarChart className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Suspense fallback={
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        }>
          <AdminDashboard
            stats={stats}
            topRatedRecipes={topRatedRecipes}
            mostActiveUsers={mostActiveUsers}
            recentRecipes={recentRecipes}
            allUsers={allUsers}
            allRecipes={allRecipes}
            currentUser={currentUser}
          />
        </Suspense>
      </div>
    </div>
  );
}