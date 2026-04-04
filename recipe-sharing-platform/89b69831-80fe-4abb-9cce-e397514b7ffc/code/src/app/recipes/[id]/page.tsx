import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Metadata } from 'next';
import { RecipeStore } from '@/lib/store';
import { getCurrentUser } from '@/lib/auth';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { StarRating } from '@/components/recipe/StarRating';
import { IngredientList } from '@/components/recipe/IngredientList';
import { InstructionList } from '@/components/recipe/InstructionList';
import { CommentSection } from '@/components/recipe/CommentSection';
import { 
  Clock, 
  Users, 
  Flame, 
  ChefHat, 
  Bookmark, 
  BookmarkCheck, 
  Share2, 
  Printer, 
  Edit, 
  Trash2, 
  MoreVertical,
  ArrowLeft,
  MessageCircle,
  Eye,
  Calendar,
  Globe,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface RecipePageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: RecipePageProps): Promise<Metadata> {
  const store = RecipeStore.getInstance();
  const recipe = store.getRecipe(params.id);

  if (!recipe) {
    return {
      title: 'Recipe Not Found - RecipeShare',
    };
  }

  return {
    title: `${recipe.title} - RecipeShare`,
    description: recipe.description,
    openGraph: {
      title: recipe.title,
      description: recipe.description,
      images: [recipe.imageUrl],
    },
  };
}

export default async function RecipePage({ params }: RecipePageProps) {
  const store = RecipeStore.getInstance();
  const recipe = store.getRecipe(params.id);
  const currentUser = await getCurrentUser();

  if (!recipe) {
    notFound();
  }

  const author = store.getUser(recipe.authorId);
  const isAuthor = currentUser?.id === recipe.authorId;
  const isSaved = currentUser?.savedRecipes.includes(recipe.id) || false;

  // Get related recipes by same author
  const authorRecipes = store.getRecipesByAuthor(recipe.authorId).filter(r => r.id !== recipe.id).slice(0, 3);

  // Get similar recipes by category
  const similarRecipes = store.getRecipesByCategory(recipe.category).filter(r => r.id !== recipe.id).slice(0, 3);

  const handleSaveRecipe = async () => {
    'use server';
    
    if (!currentUser) {
      return { success: false, error: 'Not authenticated' };
    }

    const store = RecipeStore.getInstance();
    const user = store.getUser(currentUser.id);
    
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const isCurrentlySaved = user.savedRecipes.includes(recipe.id);
    
    if (isCurrentlySaved) {
      user.savedRecipes = user.savedRecipes.filter(id => id !== recipe.id);
    } else {
      user.savedRecipes.push(recipe.id);
    }

    store.updateUser(user.id, user);
    return { success: true, saved: !isCurrentlySaved };
  };

  const handleDeleteRecipe = async () => {
    'use server';
    
    if (!currentUser || (!isAuthor && !currentUser.isAdmin)) {
      return { success: false, error: 'Unauthorized' };
    }

    const store = RecipeStore.getInstance();
    store.deleteRecipe(recipe.id);
    return { success: true };
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
      {/* Back Navigation */}
      <div className="container mx-auto px-4 py-6">
        <Link
          href="/recipes"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Recipes
        </Link>
      </div>

      <div className="container mx-auto px-4 pb-16">
        {/* Recipe Header */}
        <div className="relative rounded-2xl overflow-hidden mb-8">
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10" />
          <Image
            src={recipe.imageUrl}
            alt={recipe.title}
            width={1200}
            height={600}
            className="w-full h-[400px] object-cover"
            priority
          />
          
          <div className="absolute bottom-0 left-0 right-0 z-20 p-8">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <Badge variant="primary" className="text-sm px-3 py-1">
                {recipe.category}
              </Badge>
              {recipe.dietaryTags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-sm px-3 py-1">
                  {tag}
                </Badge>
              ))}
              {recipe.difficulty && (
                <Badge 
                  variant={
                    recipe.difficulty === 'Easy' ? 'success' :
                    recipe.difficulty === 'Medium' ? 'warning' : 'danger'
                  }
                  className="text-sm px-3 py-1"
                >
                  {recipe.difficulty}
                </Badge>
              )}
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {recipe.title}
            </h1>
            
            <p className="text-gray-200 text-lg max-w-3xl mb-6">
              {recipe.description}
            </p>
            
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <Avatar
                  src={author?.avatarUrl}
                  alt={author?.displayName}
                  size="sm"
                  border
                />
                <div>
                  <Link
                    href={`/profile/${author?.username}`}
                    className="font-medium text-white hover:text-primary-300 transition-colors"
                  >
                    {author?.displayName}
                  </Link>
                  <p className="text-sm text-gray-300">
                    {formatDate(recipe.createdAt)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <StarRating 
                    rating={recipe.averageRating} 
                    size="md" 
                    showValue 
                    interactive={false}
                  />
                  <span className="text-gray-300">
                    ({recipe.ratingCount} ratings)
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-gray-300" />
                  <span className="text-gray-300">
                    {recipe.commentCount} comments
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-gray-300" />
                  <span className="text-gray-300">
                    {recipe.viewCount} views
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    <span className="text-lg font-semibold">
                      {recipe.prepTime + recipe.cookTime} min
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Time</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    <span className="text-lg font-semibold">
                      {recipe.servings}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Servings</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Flame className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    <span className="text-lg font-semibold">
                      {recipe.calories || 'N/A'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Calories</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <ChefHat className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    <span className="text-lg font-semibold">
                      {recipe.difficulty || 'Medium'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Difficulty</p>
                </div>
              </div>
            </div>

            {/* Ingredients */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Ingredients
                </h2>
                <Badge variant="secondary" className="px-3 py-1">
                  {recipe.ingredients.length} items
                </Badge>
              </div>
              <IngredientList ingredients={recipe.ingredients} />
            </div>

            {/* Instructions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Instructions
                </h2>
                <div className="flex items-center gap-4">
                  <Badge variant="secondary" className="px-3 py-1">
                    {recipe.instructions.length} steps
                  </Badge>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>Prep: {recipe.prepTime} min</span>
                    <span>•</span>
                    <span>Cook: {recipe.cookTime} min</span>
                  </div>
                </div>
              </div>
              <InstructionList instructions={recipe.instructions} />
            </div>

            {/* Notes & Tips */}
            {(recipe.notes || recipe.tips?.length) && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Notes & Tips
                </h2>
                {recipe.notes && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Recipe Notes
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                      {recipe.notes}
                    </p>
                  </div>
                )}
                {recipe.tips && recipe.tips.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                      Pro Tips
                    </h3>
                    <ul className="space-y-2">
                      {recipe.tips.map((tip, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700 dark:text-gray-300">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Comments Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <CommentSection recipeId={recipe.id} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Action Buttons */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="space-y-3">
                <form action={handleSaveRecipe}>
                  <Button
                    type="submit"
                    variant={isSaved ? "primary" : "outline"}
                    size="lg"
                    fullWidth
                    leftIcon={isSaved ? <BookmarkCheck /> : <Bookmark />}
                  >
                    {isSaved ? 'Saved to Collection' : 'Save Recipe'}
                  </Button>
                </form>
                
                <Button
                  variant="outline"
                  size="lg"
                  fullWidth
                  leftIcon={<Share2 />}
                >
                  Share Recipe
                </Button>
                
                <Button
                  variant="ghost"
                  size="lg"
                  fullWidth
                  leftIcon={<Printer />}
                >
                  Print Recipe
                </Button>
                
                {isAuthor && (
                  <div className="pt-3 border-t dark:border-gray-700 space-y-3">
                    <Link href={`/recipes/${recipe.id}/edit`}>
                      <Button
                        variant="outline"
                        size="lg"
                        fullWidth
                        leftIcon={<Edit />}
                      >
                        Edit Recipe
                      </Button>
                    </Link>
                    
                    <form action={handleDeleteRecipe}>
                      <Button
                        type="submit"
                        variant="danger"
                        size="lg"
                        fullWidth
                        leftIcon={<Trash2 />}
                        onClick={(e) => {
                          if (!confirm('Are you sure you want to delete this recipe?')) {
                            e.preventDefault();
                          }
                        }}
                      >
                        Delete Recipe
                      </Button>
                    </form>
                  </div>
                )}
              </div>
            </div>

            {/* Rate This Recipe */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">
                Rate This Recipe
              </h3>
              <div className="space-y-4">
                <StarRating 
                  recipeId={recipe.id}
                  initialRating={recipe.averageRating}
                  interactive={true}
                  size="lg"
                />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Share your experience with this recipe
                </p>
              </div>
            </div>

            {/* More from Author */}
            {authorRecipes.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 dark:text-white">
                    More from {author?.displayName}
                  </h3>
                  <Link
                    href={`/profile/${author?.username}`}
                    className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    View all
                  </Link>
                </div>
                <div className="space-y-4">
                  {authorRecipes.map((relatedRecipe) => (
                    <Link
                      key={relatedRecipe.id}
                      href={`/recipes/${relatedRecipe.id}`}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
                    >
                      <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden">
                        <Image
                          src={relatedRecipe.imageUrl}
                          alt={relatedRecipe.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 dark:text-white truncate">
                          {relatedRecipe.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <StarRating 
                            rating={relatedRecipe.averageRating} 
                            size="sm" 
                            interactive={false}
                          />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            ({relatedRecipe.ratingCount})
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Similar Recipes */}
            {similarRecipes.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">
                  Similar Recipes
                </h3>
                <div className="space-y-4">
                  {similarRecipes.map((similarRecipe) => (
                    <Link
                      key={similarRecipe.id}
                      href={`/recipes/${similarRecipe.id}`}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
                    >
                      <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden">
                        <Image
                          src={similarRecipe.imageUrl}
                          alt={similarRecipe.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 dark:text-white truncate">
                          {similarRecipe.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Avatar
                            src={store.getUser(similarRecipe.authorId)?.avatarUrl}
                            alt={store.getUser(similarRecipe.authorId)?.displayName}
                            size="xs"
                          />
                          <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {store.getUser(similarRecipe.authorId)?.displayName}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Recipe Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">
                Recipe Stats
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Views</span>
                  <span className="font-medium">{recipe.viewCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Saves</span>
                  <span className="font-medium">{recipe.saveCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Comments</span>
                  <span className="font-medium">{recipe.commentCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Created</span>
                  <span className="font-medium">{formatDate(recipe.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Last Updated</span>
                  <span className="font-medium">{formatDate(recipe.updatedAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}