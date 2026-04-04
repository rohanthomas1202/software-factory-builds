import { NextRequest, NextResponse } from 'next/server';
import { RecipeStore } from '@/lib/store';
import { getCurrentUser } from '@/lib/auth';

// GET: Get user's rating for this recipe
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const store = RecipeStore.getInstance();
    const recipe = store.getRecipeById(params.id);
    
    if (!recipe) {
      return NextResponse.json(
        { success: false, error: 'Recipe not found' },
        { status: 404 }
      );
    }
    
    const userRating = store.getUserRecipeRating(params.id, user.id);
    
    return NextResponse.json({
      success: true,
      data: {
        hasRated: userRating !== null,
        rating: userRating,
      },
    });
  } catch (error) {
    console.error('Error fetching user rating:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch rating' },
      { status: 500 }
    );
  }
}

// POST: Submit or update a rating
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const store = RecipeStore.getInstance();
    const recipe = store.getRecipeById(params.id);
    
    if (!recipe) {
      return NextResponse.json(
        { success: false, error: 'Recipe not found' },
        { status: 404 }
      );
    }
    
    // Prevent users from rating their own recipes
    if (recipe.authorId === user.id) {
      return NextResponse.json(
        { success: false, error: 'Cannot rate your own recipe' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const rating = parseFloat(body.rating);
    
    // Validate rating
    if (isNaN(rating) || rating < 0.5 || rating > 5) {
      return NextResponse.json(
        { success: false, error: 'Rating must be between 0.5 and 5' },
        { status: 400 }
      );
    }
    
    // Submit rating
    const success = store.submitRecipeRating(params.id, user.id, rating);
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to submit rating' },
        { status: 500 }
      );
    }
    
    // Get updated recipe
    const updatedRecipe = store.getRecipeById(params.id);
    
    return NextResponse.json({
      success: true,
      data: {
        rating: updatedRecipe?.rating,
        ratingCount: updatedRecipe?.ratingCount,
        userRating: rating,
      },
      message: 'Rating submitted successfully',
    });
  } catch (error) {
    console.error('Error submitting rating:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit rating' },
      { status: 500 }
    );
  }
}

// DELETE: Remove user's rating
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const store = RecipeStore.getInstance();
    const recipe = store.getRecipeById(params.id);
    
    if (!recipe) {
      return NextResponse.json(
        { success: false, error: 'Recipe not found' },
        { status: 404 }
      );
    }
    
    // Remove rating
    const success = store.removeRecipeRating(params.id, user.id);
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to remove rating' },
        { status: 500 }
      );
    }
    
    // Get updated recipe
    const updatedRecipe = store.getRecipeById(params.id);
    
    return NextResponse.json({
      success: true,
      data: {
        rating: updatedRecipe?.rating,
        ratingCount: updatedRecipe?.ratingCount,
      },
      message: 'Rating removed successfully',
    });
  } catch (error) {
    console.error('Error removing rating:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove rating' },
      { status: 500 }
    );
  }
}