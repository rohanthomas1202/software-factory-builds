import { NextRequest, NextResponse } from 'next/server';
import { validateUserSession } from '@/lib/auth';
import { getCategoryById, updateCategory, deleteCategory, getTransactionsByUser } from '@/lib/store';
import { Category, ApiError } from '@/lib/types';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<{ data: Category } | ApiError>> {
  try {
    const token = request.cookies.get('session_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = validateUserSession(token);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const category = getCategoryById(id);
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    if (category.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 404 });
    }

    const body = await request.json();
    const { name, color } = body;

    const updates: Partial<Omit<Category, 'id' | 'userId' | 'createdAt'>> = {};
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json({ error: 'Category name must be a non-empty string' }, { status: 400 });
      }
      updates.name = name.trim();
    }

    if (color !== undefined) {
      if (typeof color !== 'string' || !/^#[0-9A-Fa-f]{6}$/.test(color)) {
        return NextResponse.json({ error: 'Valid hex color is required (e.g., #3B82F6)' }, { status: 400 });
      }
      updates.color = color;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    if (updates.name) {
      const existingCategories = getCategoryById(id);
      const allUserCategories = getCategoryById(id); // This line seems wrong - we need all user categories
      // Actually we need to get all categories for the user except the current one
      // Let me fix this:
      const allUserCategories = getCategoriesByUser(userId);
      const nameExists = allUserCategories.some(
        cat => cat.id !== id && cat.name.toLowerCase() === updates.name!.toLowerCase()
      );
      if (nameExists) {
        return NextResponse.json({ error: 'Category name must be unique' }, { status: 409 });
      }
    }

    const updatedCategory = updateCategory(id, updates);
    if (!updatedCategory) {
      return NextResponse.json({ error: 'Category update failed' }, { status: 500 });
    }

    return NextResponse.json({ data: updatedCategory });
  } catch (error) {
    console.error('PATCH /api/categories/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<{ success: boolean } | ApiError>> {
  try {
    const token = request.cookies.get('session_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = validateUserSession(token);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const category = getCategoryById(id);
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    if (category.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 404 });
    }

    // Check for linked transactions
    const transactions = getTransactionsByUser(userId, { categoryId: id });
    if (transactions.length > 0) {
      return NextResponse.json(
        { 
          error: `Category has ${transactions.length} linked transaction(s)`,
          count: transactions.length 
        }, 
        { status: 409 }
      );
    }

    const success = deleteCategory(id);
    if (!success) {
      return NextResponse.json({ error: 'Category deletion failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/categories/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}