import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { 
  getCategoryById, 
  updateCategory, 
  deleteCategory,
  getCategoriesByUserId,
  getTransactionsByCategoryId 
} from '@/lib/store';
import { UpdateCategoryRequest } from '@/lib/types';
import { 
  isValidCategoryName, 
  isValidColorHex, 
  validateMonthlyLimit 
} from '@/lib/validation';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * PATCH /api/categories/[id]
 * Update an existing category
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const category = getCategoryById(params.id);
    
    // Check if category exists
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Check if category belongs to the authenticated user
    if (category.userId !== session.userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body: UpdateCategoryRequest = await request.json();
    
    // Validate at least one field is provided
    if (!body.name && body.monthlyLimitCents === undefined && body.colorHex === undefined) {
      return NextResponse.json(
        { error: 'At least one field must be provided for update' },
        { status: 400 }
      );
    }

    // Validate name if provided
    if (body.name !== undefined) {
      if (!isValidCategoryName(body.name)) {
        return NextResponse.json(
          { error: 'Category name must be 1-50 characters' },
          { status: 400 }
        );
      }

      // Check for duplicate category name (case-insensitive) excluding current category
      const existingCategories = getCategoriesByUserId(session.userId);
      const duplicate = existingCategories.find(
        cat => 
          cat.id !== params.id && 
          cat.name.toLowerCase() === body.name.trim().toLowerCase()
      );
      
      if (duplicate) {
        return NextResponse.json(
          { error: 'A category with this name already exists' },
          { status: 409 }
        );
      }
    }

    // Validate monthly limit if provided
    let monthlyLimitCents: number | undefined;
    if (body.monthlyLimitCents !== undefined) {
      try {
        monthlyLimitCents = validateMonthlyLimit(body.monthlyLimitCents);
      } catch (error) {
        return NextResponse.json(
          { error: 'Monthly limit must be a non-negative integer' },
          { status: 400 }
        );
      }
    }

    // Validate color hex if provided
    if (body.colorHex !== undefined && !isValidColorHex(body.colorHex)) {
      return NextResponse.json(
        { error: 'Invalid color hex format' },
        { status: 400 }
      );
    }

    // Prepare update object
    const updates: Partial<{
      name: string;
      monthlyLimitCents: number;
      colorHex: string | null;
    }> = {};

    if (body.name !== undefined) {
      updates.name = body.name.trim();
    }
    if (monthlyLimitCents !== undefined) {
      updates.monthlyLimitCents = monthlyLimitCents;
    }
    if (body.colorHex !== undefined) {
      updates.colorHex = body.colorHex?.trim() || null;
    }

    // Update the category
    const updatedCategory = updateCategory(params.id, updates);
    
    if (!updatedCategory) {
      return NextResponse.json(
        { error: 'Failed to update category' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: updatedCategory
    });
  } catch (error) {
    console.error('Failed to update category:', error);
    
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/categories/[id]
 * Delete a category if it has no transactions
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const category = getCategoryById(params.id);
    
    // Check if category exists
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Check if category belongs to the authenticated user
    if (category.userId !== session.userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Check for associated transactions
    const associatedTransactions = getTransactionsByCategoryId(params.id);
    
    if (associatedTransactions.length > 0) {
      return NextResponse.json(
        { 
          error: 'Category has associated transactions',
          transactionCount: associatedTransactions.length
        },
        { status: 409 }
      );
    }

    // Delete the category
    const success = deleteCategory(params.id);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete category' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: { success: true }
    });
  } catch (error) {
    console.error('Failed to delete category:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}