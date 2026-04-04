import { NextRequest, NextResponse } from 'next/server';
import { RecipeStore } from '@/lib/store';
import { getCurrentUser } from '@/lib/auth';
import { RecipeFormData } from '@/types';

// GET: Fetch a single recipe by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const store = RecipeStore.getInstance();
    const recipe = store.getRecipeById(params.id);
    
    if (!recipe) {
      return NextResponse.json(
        { success: false, error: 'Recipe not found' },
        { status: 404 }
      );
    }
    
    // Increment view count
    store.incrementRecipeViews(params.id);
    
    return NextResponse.json({
      success: true,
      data: recipe,
    });
  } catch (error) {
    console.error('Error fetching recipe:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch recipe' },
      { status: 500 }
    );
  }
}

// PUT: Update a recipe
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    const store = RecipeStore.getInstance();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const recipe = store.getRecipeById(params.id);
    if (!recipe) {
      return NextResponse.json(
        { success: false, error: 'Recipe not found' },
        { status: 404 }
      );
    }
    
    // Check if user is the author or admin
    if (recipe.authorId !== user.id && !user.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Not authorized to update this recipe' },
        { status: 403 }
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
    
    // Update recipe
    const updatedRecipe = store.updateRecipe(params.id, {
      title: body.title.trim(),
      description: body.description.trim(),
      ingredients: body.ingredients,
      instructions: body.instructions,
      prepTime: body.prepTime,
      cookTime: body.cookTime,
      totalTime: (body.prepTime || 0) + (body.cookTime || 0),
      servings: body.servings,
      difficulty: body.difficulty || 'medium',
      category: body.category || 'other',
      tags: body.tags || [],
      imageUrl: body.imageUrl || recipe.imageUrl,
      nutrition: body.nutrition,
      equipment: body.equipment,
      notes: body.notes,
      isPublished: body.isPublished !== false,
      updatedAt: new Date().toISOString(),
    });
    
    if (!updatedRecipe) {
      return NextResponse.json(
        { success: false, error: 'Failed to update recipe' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: updatedRecipe,
      message: 'Recipe updated successfully',
    });
  } catch (error) {
    console.error('Error updating recipe:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update recipe' },
      { status: 500 }
    );
  }
}

// DELETE: Delete a recipe
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    const store = RecipeStore.getInstance();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const recipe = store.getRecipeById(params.id);
    if (!recipe) {
      return NextResponse.json(
        { success: false, error: 'Recipe not found' },
        { status: 404 }
      );
    }
    
    // Check if user is the author or admin
    if (recipe.authorId !== user.id && !user.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Not authorized to delete this recipe' },
        { status: 403 }
      );
    }
    
    // Delete recipe
    const success = store.deleteRecipe(params.id);
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete recipe' },
        { status: 500 }
      );
    }
    
    // Decrement user's recipe count
    store.decrementUserRecipeCount(recipe.authorId);
    
    return NextResponse.json({
      success: true,
      message: 'Recipe deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting recipe:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete recipe' },
      { status: 500 }
    );
  }
}