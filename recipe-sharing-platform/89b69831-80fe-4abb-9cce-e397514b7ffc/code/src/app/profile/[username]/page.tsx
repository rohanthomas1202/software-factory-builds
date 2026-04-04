import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { Suspense } from 'react';
import { RecipeStore } from '@/lib/store';
import { getCurrentUser } from '@/lib/auth';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Tabs } from '@/components/ui/Tabs';
import { RecipeGrid } from '@/components/recipe/RecipeGrid';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileStats } from '@/components/profile/ProfileStats';
import { ChefHat, Calendar, MapPin, Globe, Mail, Edit, Settings, Users, Star, Bookmark, TrendingUp, Award, Clock, Heart, Flame, Trophy, Zap } from 'lucide-react';
import Link from 'next/link';

interface ProfilePageProps {
  params: {
    username: string;
  };
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const store = RecipeStore.getInstance();
  const user = store.getUserByUsername(params.username);

  if (!user) {
    return {
      title: 'User Not Found - RecipeShare',
    };
  }

  return {
    title: `${user.displayName} (@${user.username}) - RecipeShare`,
    description: user.bio || `Check out ${user.displayName}'s recipes on RecipeShare!`,
  };
}

async function ProfileContent({ username }: { username: string }) {
  const store = RecipeStore.getInstance();
  const currentUser = await getCurrentUser();
  const profileUser = store.getUserByUsername(username);

  if (!profileUser) {
    notFound();
  }

  const isOwnProfile = currentUser?.id === profileUser.id;
  const isFollowing = currentUser?.following.includes(profileUser.id) || false;

  // Get user's recipes
  const userRecipes = store.getRecipesByUserId(profileUser.id);
  const savedRecipes = profileUser.savedRecipes.map(id => store.getRecipe(id)).filter(Boolean);

  // Get followers and following users
  const followers = profileUser.followers.map(id => store.getUser(id)).filter(Boolean);
  const following = profileUser.following.map(id => store.getUser(id)).filter(Boolean);

  const tabs = [
    { id: 'recipes', label: 'Recipes', icon: <ChefHat className="w-4 h-4" />, count: userRecipes.length },
    { id: 'saved', label: 'Saved', icon: <Bookmark className="w-4 h-4" />, count: savedRecipes.length },
    { id: 'followers', label: 'Followers', icon: <Users className="w-4 h-4" />, count: followers.length },
    { id: 'following', label: 'Following', icon: <Users className="w-4 h-4" />, count: following.length },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
      {/* Profile Header */}
      <ProfileHeader
        user={profileUser}
        isOwnProfile={isOwnProfile}
        isFollowing={isFollowing}
        recipeCount={userRecipes.length}
        followerCount={followers.length}
        followingCount={following.length}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar - User Info & Stats */}
          <div className="lg:col-span-1 space-y-6">
            {/* User Info Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                About
              </h3>
              
              <div className="space-y-4">
                {profileUser.bio && (
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                    {profileUser.bio}
                  </p>
                )}

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-300">
                      Joined {formatDate(profileUser.joinDate)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <ChefHat className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-300">
                      {userRecipes.length} recipes shared
                    </span>
                  </div>

                  {profileUser.isAdmin && (
                    <Badge variant="primary" className="gap-1">
                      <Award className="w-3 h-3" />
                      Admin
                    </Badge>
                  )}
                </div>
              </div>

              {isOwnProfile && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <Link href="/profile/edit">
                    <Button variant="outline" fullWidth className="gap-2">
                      <Edit className="w-4 h-4" />
                      Edit Profile
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Stats Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <ProfileStats user={profileUser} recipes={userRecipes} />
            </div>

            {/* Followers Preview */}
            {followers.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Top Followers
                </h3>
                <div className="space-y-3">
                  {followers.slice(0, 5).map(follower => (
                    <Link
                      key={follower.id}
                      href={`/profile/${follower.username}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Avatar
                        src={follower.avatarUrl}
                        alt={follower.displayName}
                        size="sm"
                        border
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {follower.displayName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          @{follower.username}
                        </p>
                      </div>
                      <Badge variant="secondary" size="sm">
                        {follower.recipeCount} recipes
                      </Badge>
                    </Link>
                  ))}
                  {followers.length > 5 && (
                    <Link
                      href={`/profile/${username}?tab=followers`}
                      className="text-sm text-primary-600 dark:text-primary-400 hover:underline text-center block pt-2"
                    >
                      View all {followers.length} followers
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Main Content - Tabs & Recipes */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Tabs */}
              <div className="border-b border-gray-200 dark:border-gray-700">
                <Tabs
                  items={tabs}
                  activeTab="recipes"
                  onTabChange={() => {}}
                  variant="underline"
                  className="px-6"
                />
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {/* Recipes Tab */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {profileUser.displayName}&apos;s Recipes
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                        {userRecipes.length} recipes • {profileUser.followers.length} followers
                      </p>
                    </div>
                    {isOwnProfile && (
                      <Link href="/recipes/create">
                        <Button variant="primary" className="gap-2">
                          <ChefHat className="w-4 h-4" />
                          Create Recipe
                        </Button>
                      </Link>
                    )}
                  </div>

                  {userRecipes.length > 0 ? (
                    <RecipeGrid
                      recipes={userRecipes}
                      loading={false}
                      emptyMessage="No recipes yet"
                      className="grid-cols-1 md:grid-cols-2"
                    />
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <ChefHat className="w-8 h-8 text-gray-400" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        No recipes yet
                      </h4>
                      <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
                        {isOwnProfile
                          ? "You haven't shared any recipes yet. Create your first recipe to share with the community!"
                          : `${profileUser.displayName} hasn't shared any recipes yet.`}
                      </p>
                      {isOwnProfile && (
                        <Link href="/recipes/create">
                          <Button variant="primary" className="gap-2">
                            <ChefHat className="w-4 h-4" />
                            Create Your First Recipe
                          </Button>
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            {userRecipes.length > 0 && (
              <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Recent Activity
                </h3>
                <div className="space-y-4">
                  {userRecipes.slice(0, 3).map(recipe => {
                    const totalRatings = recipe.ratings.length;
                    const avgRating = totalRatings > 0
                      ? recipe.ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings
                      : 0;

                    return (
                      <Link
                        key={recipe.id}
                        href={`/recipes/${recipe.id}`}
                        className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
                      >
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                          <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-primary-600" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <ChefHat className="w-8 h-8 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 truncate">
                            {recipe.title}
                          </h4>
                          <div className="flex items-center gap-4 mt-1">
                            <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              <span>{avgRating.toFixed(1)}</span>
                              <span>({totalRatings})</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                              <Clock className="w-3 h-3" />
                              <span>{recipe.prepTime + recipe.cookTime} min</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                              <Flame className="w-3 h-3" />
                              <span>{recipe.difficulty}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(recipe.createdAt)}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage({ params }: ProfilePageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Spinner size="lg" label="Loading profile..." />
        </div>
      }
    >
      <ProfileContent username={params.username} />
    </Suspense>
  );
}