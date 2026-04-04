import { NextRequest, NextResponse } from 'next/server';
import { RecipeStore } from '@/lib/store';
import { getCurrentUser } from '@/lib/auth';
import { Recipe, RecipeSortOption } from '@/types';

// GET: Fetch saved recipes for the current user
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
    const category = url.searchParams.get('category') || '';
    const difficulty = url.searchParams.get('difficulty') || '';
    
    // Get saved recipe IDs
    const savedRecipeIds = currentUser.savedRecipes;
    
    if (savedRecipeIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        pagination: {
          page: 1,
          limit,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
      });
    }
    
    // Get all saved recipes
    let savedRecipes = savedRecipeIds
      .map(id => store.getRecipe(id))
      .filter((recipe): recipe is Recipe => recipe !== undefined);
    
    // Apply filters
    if (category) {
      savedRecipes = savedRecipes.filter(recipe => 
        recipe.categories.includes(category)
      );
    }
    
    if (difficulty) {
      savedRecipes = savedRecipes.filter(recipe => 
        recipe.difficulty === difficulty
      );
    }
    
    // Apply sorting
    savedRecipes.sort((a, b) => {
      switch (sort) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'rating':
          return (b.averageRating || 0) - (a.averageRating || 0);
        case 'popular':
          return (b.viewCount || 0) - (a.viewCount || 0);
        case 'prepTime':
          return (a.prepTime || 0) - (b.prepTime || 0);
        case 'cookTime':
          return (a.cookTime || 0) - (b.cookTime || 0);
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedRecipes = savedRecipes.slice(startIndex, endIndex);
    
    // Get full recipe data with author info
    const recipesWithDetails = paginatedRecipes.map(recipe => {
      const author = store.getUserById(recipe.authorId);
      const savedAt = currentUser.savedRecipes.indexOf(recipe.id);
      
      return {
        ...recipe,
        author: author ? {
          id: author.id,
          username: author.username,
          displayName: author.displayName,
          avatarUrl: author.avatarUrl,
        } : null,
        isSaved: true,
        savedAt: savedAt, // Index can be used as proxy for save order
      };
    });
    
    return NextResponse.json({
      success: true,
      data: recipesWithDetails,
      pagination: {
        page,
        limit,
        total: savedRecipes.length,
        totalPages: Math.ceil(savedRecipes.length / limit),
        hasNextPage: endIndex < savedRecipes.length,
        hasPrevPage: page > 1,
      },
      metadata: {
        totalSaved: savedRecipeIds.length,
        categories: Array.from(new Set(savedRecipes.flatMap(r => r.categories))),
        difficulties: Array.from(new Set(savedRecipes.map(r => r.difficulty))),
      },
    });
    
  } catch (error) {
    console.error('Error fetching saved recipes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch saved recipes' },
      { status: 500 }
    );
  }
}

// POST: Save a recipe (alternative to the recipe-specific save endpoint)
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { recipeId } = body;

    if (!recipeId) {
      return NextResponse.json(
        { error: 'Recipe ID is required' },
        { status: 400 }
      );
    }

    const store = RecipeStore.getInstance();
    const recipe = store.getRecipe(recipeId);

    if (!recipe) {
      return NextResponse.json(
        { error: 'Recipe not found' },
        { status: 404 }
      );
    }

    // Check if already saved
    const isAlreadySaved = currentUser.savedRecipes.includes(recipeId);
    
    if (isAlreadySaved) {
      return NextResponse.json({
        success: true,
        action: 'already_saved',
        message: 'Recipe is already saved',
        saved: true,
      });
    }

    // Add to saved recipes
    store.saveRecipeForUser(currentUser.id, recipeId);
    
    return NextResponse.json({
      success: true,
      action: 'saved',
      message: 'Recipe saved successfully',
      saved: true,
      recipe: {
        id: recipe.id,
        title: recipe.title,
        imageUrl: recipe.imageUrl,
      },
    });
    
  } catch (error) {
    console.error('Error saving recipe:', error);
    return NextResponse.json(
      { error: 'Failed to save recipe' },
      { status: 500 }
    );
  }
}

// DELETE: Remove a saved recipe
export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const recipeId = url.searchParams.get('recipeId');

    if (!recipeId) {
      return NextResponse.json(
        { error: 'Recipe ID is required' },
        { status: 400 }
      );
    }

    const store = RecipeStore.getInstance();
    const recipe = store.getRecipe(recipeId);

    if (!recipe) {
      return NextResponse.json(
        { error: 'Recipe not found' },
        { status: 404 }
      );
    }

    // Check if actually saved
    const isSaved = currentUser.savedRecipes.includes(recipeId);
    
    if (!isSaved) {
      return NextResponse.json({
        success: true,
        action: 'not_saved',
        message: 'Recipe was not saved',
        saved: false,
      });
    }

    // Remove from saved recipes
    store.unsaveRecipeForUser(currentUser.id, recipeId);
    
    return NextResponse.json({
      success: true,
      action: 'unsaved',
      message: 'Recipe removed from saved',
      saved: false,
      recipe: {
        id: recipe.id,
        title: recipe.title,
      },
    });
    
  } catch (error) {
    console.error('Error removing saved recipe:', error);
    return NextResponse.json(
      { error: 'Failed to remove saved recipe' },
      { status: 500 }
    );
  }
}