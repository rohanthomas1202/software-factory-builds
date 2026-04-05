import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { 
  getCategoriesByUserId, 
  createCategory,
  getCategoriesByUserId as getUserCategories 
} from '@/lib/store';
import { CreateCategoryRequest } from '@/lib/types';
import { 
  isValidCategoryName, 
  isValidColorHex, 
  validateMonthlyLimit 
} from '@/lib/validation';

/**
 * GET /api/categories
 * Get all categories for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const categories = getCategoriesByUserId(session.userId);
    
    return NextResponse.json({
      data: categories
    });
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/categories
 * Create a new category for the authenticated user
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: CreateCategoryRequest = await request.json();
    
    // Validate required fields
    if (!body.name || body.monthlyLimitCents === undefined) {
      return NextResponse.json(
        { error: 'Name and monthly limit are required' },
        { status: 400 }
      );
    }

    // Validate name
    if (!isValidCategoryName(body.name)) {
      return NextResponse.json(
        { error: 'Category name must be 1-50 characters' },
        { status: 400 }
      );
    }

    // Validate monthly limit
    let monthlyLimitCents: number;
    try {
      monthlyLimitCents = validateMonthlyLimit(body.monthlyLimitCents);
    } catch (error) {
      return NextResponse.json(
        { error: 'Monthly limit must be a non-negative integer' },
        { status: 400 }
      );
    }

    // Validate color hex
    if (!isValidColorHex(body.colorHex)) {
      return NextResponse.json(
        { error: 'Invalid color hex format' },
        { status: 400 }
      );
    }

    // Check for duplicate category name (case-insensitive) for this user
    const existingCategories = getUserCategories(session.userId);
    const duplicate = existingCategories.find(
      cat => cat.name.toLowerCase() === body.name.trim().toLowerCase()
    );
    
    if (duplicate) {
      return NextResponse.json(
        { error: 'A category with this name already exists' },
        { status: 409 }
      );
    }

    // Create the category
    const category = createCategory({
      userId: session.userId,
      name: body.name.trim(),
      monthlyLimitCents,
      colorHex: body.colorHex?.trim() || null,
      createdAt: new Date()
    });

    return NextResponse.json(
      { data: category },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to create category:', error);
    
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