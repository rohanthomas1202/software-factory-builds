import { NextRequest, NextResponse } from 'next/server';
import { RecipeStore } from '@/lib/store';
import { getCurrentUser } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

// GET: Get comments for a recipe
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
    
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sort = searchParams.get('sort') || 'newest'; // newest, oldest, popular
    
    const { comments, total } = store.getRecipeComments(params.id, page, limit, sort);
    
    return NextResponse.json({
      success: true,
      data: comments,
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
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

// POST: Add a comment to a recipe
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
    const content = body.content?.trim();
    
    if (!content) {
      return NextResponse.json(
        { success: false, error: 'Comment content is required' },
        { status: 400 }
      );
    }
    
    if (content.length > 1000) {
      return NextResponse.json(
        { success: false, error: 'Comment must be less than 1000 characters' },
        { status: 400 }
      );
    }
    
    // Create comment
    const commentId = uuidv4();
    const now = new Date().toISOString();
    
    const comment = {
      id: commentId,
      recipeId: params.id,
      userId: user.id,
      userUsername: user.username,
      userDisplayName: user.displayName,
      userAvatarUrl: user.avatarUrl,
      content,
      likes: 0,
      isEdited: false,
      createdAt: now,
      updatedAt: now,
    };
    
    const success = store.addComment(comment);
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to add comment' },
        { status: 500 }
      );
    }
    
    // Increment recipe comment count
    store.incrementRecipeComments(params.id);
    
    return NextResponse.json({
      success: true,
      data: comment,
      message: 'Comment added successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding comment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add comment' },
      { status: 500 }
    );
  }
}