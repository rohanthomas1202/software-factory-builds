import { NextRequest, NextResponse } from 'next/server';
import { RecipeStore } from '@/lib/store';
import { getCurrentUser } from '@/lib/auth';
import { RecipeFilters, RecipeSortOption } from '@/types';

// GET: Fetch recipes by a specific user with optional filtering and pagination
export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const store = RecipeStore.getInstance();
    const user = store.getUserByUsername(params.username);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const difficulty = searchParams.get('difficulty') || '';
    const prepTime = searchParams.get('prepTime') || '';
    const sort = (searchParams.get('sort') as RecipeSortOption) || 'newest';
    const includeDrafts = searchParams.get('includeDrafts') === 'true';

    // Get current user to check permissions
    const currentUser = await getCurrentUser();
    const isOwner = currentUser?.id === user.id;

    // Get all recipes by this user
    let recipes = store.getRecipesByUserId(user.id);

    // Filter out drafts if not owner
    if (!isOwner) {
      recipes = recipes.filter(recipe => !recipe.isDraft);
    } else if (!includeDrafts) {
      // If owner but includeDrafts is false, still filter out drafts
      recipes = recipes.filter(recipe => !recipe.isDraft);
    }

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      recipes = recipes.filter(recipe =>
        recipe.title.toLowerCase().includes(searchLower) ||
        recipe.description.toLowerCase().includes(searchLower) ||
        recipe.ingredients.some(ing => ing.name.toLowerCase().includes(searchLower))
      );
    }

    // Apply category filter
    if (category) {
      recipes = recipes.filter(recipe => recipe.category === category);
    }

    // Apply difficulty filter
    if (difficulty) {
      recipes = recipes.filter(recipe => recipe.difficulty === difficulty);
    }

    // Apply prep time filter
    if (prepTime) {
      const [min, max] = prepTime.split('-').map(Number);
      if (!isNaN(min) && !isNaN(max)) {
        recipes = recipes.filter(recipe => 
          recipe.prepTime >= min && recipe.prepTime <= max
        );
      }
    }

    // Apply sorting
    switch (sort) {
      case 'newest':
        recipes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        recipes.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'rating':
        recipes.sort((a, b) => b.averageRating - a.averageRating);
        break;
      case 'popular':
        recipes.sort((a, b) => b.viewCount - a.viewCount);
        break;
      case 'prepTime':
        recipes.sort((a, b) => a.prepTime - b.prepTime);
        break;
    }

    // Calculate pagination
    const total = recipes.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedRecipes = recipes.slice(startIndex, endIndex);

    // Format response
    const formattedRecipes = paginatedRecipes.map(recipe => ({
      id: recipe.id,
      title: recipe.title,
      description: recipe.description,
      imageUrl: recipe.imageUrl,
      prepTime: recipe.prepTime,
      servings: recipe.servings,
      difficulty: recipe.difficulty,
      category: recipe.category,
      averageRating: recipe.averageRating,
      ratingCount: recipe.ratingCount,
      viewCount: recipe.viewCount,
      createdAt: recipe.createdAt,
      updatedAt: recipe.updatedAt,
      isDraft: recipe.isDraft,
      author: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl
      }
    }));

    return NextResponse.json({
      recipes: formattedRecipes,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      filters: {
        search,
        category,
        difficulty,
        prepTime,
        sort,
        includeDrafts
      },
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        recipeCount: user.recipeCount
      }
    });
  } catch (error) {
    console.error('Error fetching user recipes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}