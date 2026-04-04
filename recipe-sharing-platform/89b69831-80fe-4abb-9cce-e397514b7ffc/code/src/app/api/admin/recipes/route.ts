import { NextRequest, NextResponse } from 'next/server';
import { RecipeStore } from '@/lib/store';
import { getCurrentUser } from '@/lib/auth';
import { Recipe, RecipeFilters, RecipeSortOption } from '@/types';

// GET: Fetch all recipes with admin filters and statistics (admin only)
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    
    // Check if user is admin
    if (!currentUser || !currentUser.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    const store = RecipeStore.getInstance();
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const search = searchParams.get('search') || '';
    const author = searchParams.get('author');
    const status = searchParams.get('status'); // 'published', 'draft', 'flagged'
    const minRating = parseFloat(searchParams.get('minRating') || '0');
    const maxRating = parseFloat(searchParams.get('maxRating') || '5');
    const minReviews = parseInt(searchParams.get('minReviews') || '0');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    // Get all recipes
    const allRecipes = Array.from(store.getAllRecipes().values());
    
    // Apply filters
    let filteredRecipes = allRecipes;
    
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filteredRecipes = filteredRecipes.filter(recipe =>
        recipe.title.toLowerCase().includes(searchLower) ||
        recipe.description.toLowerCase().includes(searchLower) ||
        recipe.ingredients.some(ing => ing.name.toLowerCase().includes(searchLower)) ||
        recipe.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }
    
    // Author filter
    if (author) {
      const authorUser = store.getUserByUsername(author);
      if (authorUser) {
        filteredRecipes = filteredRecipes.filter(recipe => recipe.authorId === authorUser.id);
      } else {
        filteredRecipes = [];
      }
    }
    
    // Status filter
    if (status === 'published') {
      filteredRecipes = filteredRecipes.filter(recipe => recipe.isPublished);
    } else if (status === 'draft') {
      filteredRecipes = filteredRecipes.filter(recipe => !recipe.isPublished);
    } else if (status === 'flagged') {
      filteredRecipes = filteredRecipes.filter(recipe => recipe.isFlagged);
    }
    
    // Rating filters
    filteredRecipes = filteredRecipes.filter(recipe => {
      const avgRating = recipe.ratings.length > 0 
        ? recipe.ratings.reduce((sum, r) => sum + r.rating, 0) / recipe.ratings.length
        : 0;
      return avgRating >= minRating && avgRating <= maxRating;
    });
    
    // Reviews filter
    filteredRecipes = filteredRecipes.filter(recipe => 
      recipe.comments.length >= minReviews
    );
    
    // Apply sorting
    filteredRecipes.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'author':
          const authorA = store.getUserById(a.authorId);
          const authorB = store.getUserById(b.authorId);
          aValue = authorA?.username.toLowerCase() || '';
          bValue = authorB?.username.toLowerCase() || '';
          break;
        case 'rating':
          const ratingA = a.ratings.length > 0 
            ? a.ratings.reduce((sum, r) => sum + r.rating, 0) / a.ratings.length
            : 0;
          const ratingB = b.ratings.length > 0 
            ? b.ratings.reduce((sum, r) => sum + r.rating, 0) / b.ratings.length
            : 0;
          aValue = ratingA;
          bValue = ratingB;
          break;
        case 'views':
          aValue = a.views;
          bValue = b.views;
          break;
        case 'saves':
          aValue = a.saves;
          bValue = b.saves;
          break;
        case 'comments':
          aValue = a.comments.length;
          bValue = b.comments.length;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'updatedAt':
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
          break;
        default:
          aValue = a.createdAt;
          bValue = b.createdAt;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedRecipes = filteredRecipes.slice(startIndex, endIndex);
    
    // Calculate statistics
    const totalRecipes = filteredRecipes.length;
    const totalPages = Math.ceil(totalRecipes / limit);
    
    const stats = {
      total: allRecipes.length,
      published: allRecipes.filter(r => r.isPublished).length,
      drafts: allRecipes.filter(r => !r.isPublished).length,
      flagged: allRecipes.filter(r => r.isFlagged).length,
      avgRating: allRecipes.length > 0 
        ? (allRecipes.reduce((sum, r) => {
            const avg = r.ratings.length > 0 
              ? r.ratings.reduce((sum2, r2) => sum2 + r2.rating, 0) / r.ratings.length
              : 0;
            return sum + avg;
          }, 0) / allRecipes.length).toFixed(2)
        : 0,
      totalViews: allRecipes.reduce((sum, r) => sum + r.views, 0),
      totalSaves: allRecipes.reduce((sum, r) => sum + r.saves, 0),
      totalComments: allRecipes.reduce((sum, r) => sum + r.comments.length, 0),
      topCategories: Array.from(
        allRecipes.reduce((map, recipe) => {
          recipe.tags.forEach(tag => {
            map.set(tag, (map.get(tag) || 0) + 1);
          });
          return map;
        }, new Map<string, number>())
      )
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([tag, count]) => ({ tag, count }))
    };
    
    // Enrich recipes with author info
    const enrichedRecipes = paginatedRecipes.map(recipe => {
      const author = store.getUserById(recipe.authorId);
      const avgRating = recipe.ratings.length > 0 
        ? recipe.ratings.reduce((sum, r) => sum + r.rating, 0) / recipe.ratings.length
        : 0;
      
      return {
        ...recipe,
        authorName: author?.displayName || 'Unknown',
        authorUsername: author?.username || 'unknown',
        authorAvatar: author?.avatarUrl,
        avgRating: parseFloat(avgRating.toFixed(2)),
        totalRatings: recipe.ratings.length,
        totalComments: recipe.comments.length,
        engagementRate: recipe.views > 0 
          ? ((recipe.saves + recipe.comments.length) / recipe.views * 100).toFixed(2)
          : 0
      };
    });

    return NextResponse.json({
      recipes: enrichedRecipes,
      pagination: {
        page,
        limit,
        totalRecipes,
        totalPages,
        hasNextPage: endIndex < totalRecipes,
        hasPrevPage: page > 1
      },
      statistics: stats
    });
    
  } catch (error) {
    console.error('Error fetching admin recipes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH: Bulk update recipes (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    
    // Check if user is admin
    if (!currentUser || !currentUser.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { recipeIds, updates } = body;

    // Validate required fields
    if (!recipeIds || !Array.isArray(recipeIds) || recipeIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid recipeIds array' },
        { status: 400 }
      );
    }

    if (!updates || typeof updates !== 'object') {
      return NextResponse.json(
        { error: 'Missing or invalid updates object' },
        { status: 400 }
      );
    }

    const store = RecipeStore.getInstance();
    const results = {
      successful: [] as string[],
      failed: [] as Array<{ recipeId: string; error: string }>
    };

    // Process each recipe update
    for (const recipeId of recipeIds) {
      try {
        const recipe = store.getRecipe(recipeId);
        if (!recipe) {
          results.failed.push({ recipeId, error: 'Recipe not found' });
          continue;
        }

        // Apply updates
        if (updates.isPublished !== undefined) {
          store.updateRecipePublishStatus(recipeId, updates.isPublished);
        }

        if (updates.isFlagged !== undefined) {
          store.updateRecipeFlagStatus(recipeId, updates.isFlagged);
        }

        if (updates.title !== undefined) {
          store.updateRecipe(recipeId, { title: updates.title });
        }

        if (updates.description !== undefined) {
          store.updateRecipe(recipeId, { description: updates.description });
        }

        if (updates.tags !== undefined && Array.isArray(updates.tags)) {
          store.updateRecipe(recipeId, { tags: updates.tags });
        }

        results.successful.push(recipeId);
      } catch (error) {
        results.failed.push({ 
          recipeId, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    return NextResponse.json({
      message: 'Bulk update completed',
      results,
      summary: {
        total: recipeIds.length,
        successful: results.successful.length,
        failed: results.failed.length
      }
    });

  } catch (error) {
    console.error('Error in bulk recipe update:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Bulk delete recipes (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    
    // Check if user is admin
    if (!currentUser || !currentUser.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { recipeIds } = body;

    // Validate required fields
    if (!recipeIds || !Array.isArray(recipeIds) || recipeIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid recipeIds array' },
        { status: 400 }
      );
    }

    const store = RecipeStore.getInstance();
    const results = {
      successful: [] as string[],
      failed: [] as Array<{ recipeId: string; error: string }>
    };

    // Process each recipe deletion
    for (const recipeId of recipeIds) {
      try {
        const recipe = store.getRecipe(recipeId);
        if (!recipe) {
          results.failed.push({ recipeId, error: 'Recipe not found' });
          continue;
        }

        // Delete the recipe
        store.deleteRecipe(recipeId);
        results.successful.push(recipeId);
      } catch (error) {
        results.failed.push({ 
          recipeId, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    return NextResponse.json({
      message: 'Bulk deletion completed',
      results,
      summary: {
        total: recipeIds.length,
        successful: results.successful.length,
        failed: results.failed.length
      }
    });

  } catch (error) {
    console.error('Error in bulk recipe deletion:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}