import { NextRequest, NextResponse } from 'next/server';
import { RecipeStore } from '@/lib/store';
import { getCurrentUser } from '@/lib/auth';
import { Recipe, RecipeSortOption } from '@/types';

// GET: Fetch personalized feed for the current user
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const store = RecipeStore.getInstance();
    const url = new URL(request.url);
    
    // Get query parameters
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const sort = url.searchParams.get('sort') as RecipeSortOption || 'newest';
    
    // Get all recipes
    const allRecipes = Array.from(store.getAllRecipes().values());
    
    // Filter recipes for personalized feed
    let feedRecipes = allRecipes.filter(recipe => {
      // Exclude user's own recipes from feed (they can see them elsewhere)
      if (recipe.authorId === currentUser.id) {
        return false;
      }
      
      return true;
    });
    
    // Prioritize recipes from followed users
    feedRecipes.sort((a, b) => {
      const aIsFollowed = currentUser.following.includes(a.authorId);
      const bIsFollowed = currentUser.following.includes(b.authorId);
      
      if (aIsFollowed && !bIsFollowed) return -1;
      if (!aIsFollowed && bIsFollowed) return 1;
      
      // Apply additional sorting based on sort parameter
      switch (sort) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'rating':
          return (b.averageRating || 0) - (a.averageRating || 0);
        case 'popular':
          return (b.viewCount || 0) - (a.viewCount || 0);
        case 'trending':
          // Simple trending algorithm: recent recipes with high engagement
          const aScore = calculateTrendingScore(a);
          const bScore = calculateTrendingScore(b);
          return bScore - aScore;
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedRecipes = feedRecipes.slice(startIndex, endIndex);
    
    // Get full recipe data with author info
    const recipesWithDetails = paginatedRecipes.map(recipe => {
      const author = store.getUserById(recipe.authorId);
      return {
        ...recipe,
        author: author ? {
          id: author.id,
          username: author.username,
          displayName: author.displayName,
          avatarUrl: author.avatarUrl,
        } : null,
        isSaved: currentUser.savedRecipes.includes(recipe.id),
        isFollowed: currentUser.following.includes(recipe.authorId),
      };
    });
    
    return NextResponse.json({
      success: true,
      data: recipesWithDetails,
      pagination: {
        page,
        limit,
        total: feedRecipes.length,
        totalPages: Math.ceil(feedRecipes.length / limit),
        hasNextPage: endIndex < feedRecipes.length,
        hasPrevPage: page > 1,
      },
      metadata: {
        followingCount: currentUser.following.length,
        totalRecipes: feedRecipes.length,
      },
    });
    
  } catch (error) {
    console.error('Error fetching feed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feed' },
      { status: 500 }
    );
  }
}

// Helper function to calculate trending score
function calculateTrendingScore(recipe: Recipe): number {
  const now = new Date();
  const recipeDate = new Date(recipe.createdAt);
  const hoursSinceCreation = (now.getTime() - recipeDate.getTime()) / (1000 * 60 * 60);
  
  // Score based on recency and engagement
  const recencyWeight = Math.max(0, 1 - (hoursSinceCreation / 168)); // Decay over 7 days
  const ratingWeight = recipe.averageRating || 0;
  const viewWeight = Math.log10((recipe.viewCount || 0) + 1);
  const commentWeight = recipe.commentCount || 0;
  
  return (recencyWeight * 0.4) + (ratingWeight * 0.3) + (viewWeight * 0.2) + (commentWeight * 0.1);
}