import { NextRequest, NextResponse } from 'next/server';
import { RecipeStore } from '@/lib/store';
import { getCurrentUser } from '@/lib/auth';
import { Recipe, RecipeFilters, RecipeSortOption, RecipeFormData } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// GET: Fetch recipes with optional filtering, sorting, and pagination
export async function GET(request: NextRequest) {
  try {
    const store = RecipeStore.getInstance();
    const searchParams = request.nextUrl.searchParams;
    
    // Parse query parameters
    const search = searchParams.get('search') || undefined;
    const category = searchParams.get('category') || undefined;
    const difficulty = searchParams.get('difficulty') || undefined;
    const prepTime = searchParams.get('prepTime') ? parseInt(searchParams.get('prepTime')!) : undefined;
    const authorId = searchParams.get('authorId') || undefined;
    const tags = searchParams.get('tags')?.split(',') || [];
    const sort = (searchParams.get('sort') as RecipeSortOption) || 'newest';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    
    const filters: RecipeFilters = {
      search,
      category,
      difficulty,
      prepTime,
      authorId,
      tags: tags.length > 0 ? tags : undefined,
    };
    
    // Get recipes with filters and pagination
    const { recipes, total } = store.getRecipes(filters, sort, page, limit);
    
    return NextResponse.json({
      success: true,
      data: recipes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching recipes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch recipes' },
      { status: 500 }
    );
  }
}

// POST: Create a new recipe
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const body: RecipeFormData = await request.json();
    
    // Validate required fields
    if (!body.title?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Recipe title is required' },
        { status: 400 }
      );
    }
    
    if (!body.description?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Recipe description is required' },
        { status: 400 }
      );
    }
    
    if (!body.ingredients || body.ingredients.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one ingredient is required' },
        { status: 400 }
      );
    }
    
    if (!body.instructions || body.instructions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one instruction step is required' },
        { status: 400 }
      );
    }
    
    const store = RecipeStore.getInstance();
    
    // Create recipe object
    const recipeId = uuidv4();
    const now = new Date().toISOString();
    
    const newRecipe: Recipe = {
      id: recipeId,
      title: body.title.trim(),
      description: body.description.trim(),
      authorId: user.id,
      authorUsername: user.username,
      authorDisplayName: user.displayName,
      authorAvatarUrl: user.avatarUrl,
      ingredients: body.ingredients.map((ing, index) => ({
        id: uuidv4(),
        name: ing.name.trim(),
        amount: ing.amount,
        unit: ing.unit,
        notes: ing.notes,
      })),
      instructions: body.instructions.map((inst, index) => ({
        id: uuidv4(),
        step: index + 1,
        description: inst.description.trim(),
        time: inst.time,
        tips: inst.tips,
      })),
      prepTime: body.prepTime,
      cookTime: body.cookTime,
      totalTime: (body.prepTime || 0) + (body.cookTime || 0),
      servings: body.servings,
      difficulty: body.difficulty || 'medium',
      category: body.category || 'other',
      tags: body.tags || [],
      imageUrl: body.imageUrl || `https://picsum.photos/seed/${recipeId}/800/600`,
      nutrition: body.nutrition,
      equipment: body.equipment,
      notes: body.notes,
      rating: 0,
      ratingCount: 0,
      saves: 0,
      views: 0,
      commentsCount: 0,
      isPublished: body.isPublished !== false,
      createdAt: now,
      updatedAt: now,
    };
    
    // Add recipe to store
    store.addRecipe(newRecipe);
    
    // Update user's recipe count
    store.incrementUserRecipeCount(user.id);
    
    return NextResponse.json({
      success: true,
      data: newRecipe,
      message: 'Recipe created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating recipe:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create recipe' },
      { status: 500 }
    );
  }
}