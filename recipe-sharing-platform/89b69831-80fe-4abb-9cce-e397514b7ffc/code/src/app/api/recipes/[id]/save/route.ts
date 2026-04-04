import { NextRequest, NextResponse } from 'next/server';
import { RecipeStore } from '@/lib/store';
import { getCurrentUser } from '@/lib/auth';

// GET: Check if recipe is saved by user
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
    
    const isSaved = store.isRecipeSavedByUser(params.id, user.id);
    
    return NextResponse.json({
      success: true,
      data: {
        isSaved,
      },
    });
  } catch (error) {
    console.error('Error checking saved status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check saved status' },
      { status: 500 }
    );
  }
}

// POST: Save or unsave a recipe
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
    
    const body = await request.json();
    const action = body.action; // 'save' or 'unsave'
    
    if (!action || (action !== 'save' && action !== 'unsave')) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be "save" or "unsave"' },
        { status: 400 }
      );
    }
    
    let success: boolean;
    
    if (action === 'save') {
      success = store.saveRecipeForUser(params.id, user.id);
    } else {
      success = store.unsaveRecipeForUser(params.id, user.id);
    }
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: `Failed to ${action} recipe` },
        { status: 500 }
      );
    }
    
    // Get updated recipe
    const updatedRecipe = store.getRecipeById(params.id);
    
    return NextResponse.json({
      success: true,
      data: {
        isSaved: action === 'save',
        saves: updatedRecipe?.saves,
      },
      message: `Recipe ${action === 'save' ? 'saved' : 'unsaved'} successfully`,
    });
  } catch (error) {
    console.error('Error saving/unsaving recipe:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update saved status' },
      { status: 500 }
    );
  }
}