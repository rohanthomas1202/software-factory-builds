import { NextRequest, NextResponse } from 'next/server';
import { RecipeStore } from '@/lib/store';
import { getCurrentUser } from '@/lib/auth';
import { User } from '@/types';

// GET: Fetch all users with optional filtering and pagination (admin only)
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
    const role = searchParams.get('role'); // 'admin', 'user', or null
    const sortBy = searchParams.get('sortBy') || 'joinDate';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    // Get all users
    const allUsers = Array.from(store.getAllUsers().values());
    
    // Apply filters
    let filteredUsers = allUsers;
    
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filteredUsers = filteredUsers.filter(user =>
        user.username.toLowerCase().includes(searchLower) ||
        user.displayName.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.bio.toLowerCase().includes(searchLower)
      );
    }
    
    // Role filter
    if (role === 'admin') {
      filteredUsers = filteredUsers.filter(user => user.isAdmin);
    } else if (role === 'user') {
      filteredUsers = filteredUsers.filter(user => !user.isAdmin);
    }
    
    // Apply sorting
    filteredUsers.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'username':
          aValue = a.username.toLowerCase();
          bValue = b.username.toLowerCase();
          break;
        case 'displayName':
          aValue = a.displayName.toLowerCase();
          bValue = b.displayName.toLowerCase();
          break;
        case 'recipeCount':
          aValue = a.recipeCount;
          bValue = b.recipeCount;
          break;
        case 'followers':
          aValue = a.followers.length;
          bValue = b.followers.length;
          break;
        case 'joinDate':
          aValue = new Date(a.joinDate).getTime();
          bValue = new Date(b.joinDate).getTime();
          break;
        default:
          aValue = a.joinDate;
          bValue = b.joinDate;
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
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
    
    // Calculate statistics
    const totalUsers = filteredUsers.length;
    const totalPages = Math.ceil(totalUsers / limit);
    const adminCount = allUsers.filter(user => user.isAdmin).length;
    const activeUsers = allUsers.filter(user => user.recipeCount > 0).length;
    
    // Remove sensitive data from response
    const safeUsers = paginatedUsers.map(user => ({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      coverImageUrl: user.coverImageUrl,
      joinDate: user.joinDate,
      followers: user.followers.length,
      following: user.following.length,
      recipeCount: user.recipeCount,
      savedRecipes: user.savedRecipes.length,
      isAdmin: user.isAdmin,
      isActive: user.recipeCount > 0,
      lastActivity: user.recipeCount > 0 ? 'Recently active' : 'No activity yet'
    }));
    
    return NextResponse.json({
      users: safeUsers,
      pagination: {
        page,
        limit,
        totalUsers,
        totalPages,
        hasNextPage: endIndex < totalUsers,
        hasPrevPage: page > 1
      },
      statistics: {
        total: allUsers.length,
        admins: adminCount,
        regularUsers: allUsers.length - adminCount,
        activeUsers,
        inactiveUsers: allUsers.length - activeUsers,
        avgRecipesPerUser: allUsers.length > 0 
          ? (allUsers.reduce((sum, user) => sum + user.recipeCount, 0) / allUsers.length).toFixed(1)
          : 0
      }
    });
    
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create a new user (admin only)
export async function POST(request: NextRequest) {
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
    const { username, email, displayName, bio, avatarUrl, isAdmin } = body;

    // Validate required fields
    if (!username || !email || !displayName) {
      return NextResponse.json(
        { error: 'Missing required fields: username, email, displayName' },
        { status: 400 }
      );
    }

    const store = RecipeStore.getInstance();
    
    // Check if username already exists
    if (store.getUserByUsername(username)) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 409 }
      );
    }

    // Check if email already exists
    if (store.getUserByEmail(email)) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      );
    }

    // Create new user (admin creates users without password - they'll need to reset)
    const newUser = store.createAdminUser({
      username,
      email,
      displayName,
      bio: bio || '',
      avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      isAdmin: isAdmin || false
    });

    // Remove sensitive data from response
    const safeUser = {
      id: newUser.id,
      username: newUser.username,
      displayName: newUser.displayName,
      email: newUser.email,
      bio: newUser.bio,
      avatarUrl: newUser.avatarUrl,
      coverImageUrl: newUser.coverImageUrl,
      joinDate: newUser.joinDate,
      followers: newUser.followers.length,
      following: newUser.following.length,
      recipeCount: newUser.recipeCount,
      savedRecipes: newUser.savedRecipes.length,
      isAdmin: newUser.isAdmin
    };

    return NextResponse.json(
      { 
        message: 'User created successfully',
        user: safeUser,
        note: 'User will need to reset password on first login'
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH: Bulk update users (admin only)
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
    const { userIds, updates } = body;

    // Validate required fields
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid userIds array' },
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
      failed: [] as Array<{ userId: string; error: string }>
    };

    // Process each user update
    for (const userId of userIds) {
      try {
        const user = store.getUserById(userId);
        if (!user) {
          results.failed.push({ userId, error: 'User not found' });
          continue;
        }

        // Apply updates
        if (updates.isAdmin !== undefined) {
          store.updateUserAdminStatus(userId, updates.isAdmin);
        }

        if (updates.displayName !== undefined) {
          store.updateUserProfile(userId, { displayName: updates.displayName });
        }

        if (updates.bio !== undefined) {
          store.updateUserProfile(userId, { bio: updates.bio });
        }

        if (updates.avatarUrl !== undefined) {
          store.updateUserProfile(userId, { avatarUrl: updates.avatarUrl });
        }

        results.successful.push(userId);
      } catch (error) {
        results.failed.push({ 
          userId, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    return NextResponse.json({
      message: 'Bulk update completed',
      results,
      summary: {
        total: userIds.length,
        successful: results.successful.length,
        failed: results.failed.length
      }
    });

  } catch (error) {
    console.error('Error in bulk user update:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}