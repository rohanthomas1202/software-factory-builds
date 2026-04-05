import { NextRequest, NextResponse } from 'next/server';
import { validateUserSession } from '@/lib/auth';
import { getCategoriesByUser, createCategory } from '@/lib/store';
import { Category, ApiError } from '@/lib/types';

export async function GET(request: NextRequest): Promise<NextResponse<{ data: Category[] } | ApiError>> {
  try {
    const token = request.cookies.get('session_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = validateUserSession(token);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const categories = getCategoriesByUser(userId);
    return NextResponse.json({ data: categories });
  } catch (error) {
    console.error('GET /api/categories error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<{ data: Category } | ApiError>> {
  try {
    const token = request.cookies.get('session_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = validateUserSession(token);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, color } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    if (!color || typeof color !== 'string' || !/^#[0-9A-Fa-f]{6}$/.test(color)) {
      return NextResponse.json({ error: 'Valid hex color is required (e.g., #3B82F6)' }, { status: 400 });
    }

    const trimmedName = name.trim();
    const existingCategories = getCategoriesByUser(userId);
    const nameExists = existingCategories.some(
      category => category.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (nameExists) {
      return NextResponse.json({ error: 'Category name must be unique' }, { status: 409 });
    }

    const newCategory = createCategory({
      userId,
      name: trimmedName,
      color,
    });

    return NextResponse.json({ data: newCategory }, { status: 201 });
  } catch (error) {
    console.error('POST /api/categories error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}