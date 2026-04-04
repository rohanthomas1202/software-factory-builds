import { NextRequest, NextResponse } from 'next/server';
import { RecipeStore } from '@/lib/store';
import { getCurrentUser } from '@/lib/auth';
import { User } from '@/types';

// GET: Fetch user profile by username
export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const store = RecipeStore.getInstance();
    const user = store.getUserByUsername(params.username);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get current user to check if they're following this user
    const currentUser = await getCurrentUser();
    
    // Return user data (excluding sensitive info like password hash)
    const userResponse = {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      coverImageUrl: user.coverImageUrl,
      joinDate: user.joinDate,
      followers: user.followers.length,
      following: user.following.length,
      recipeCount: user.recipeCount,
      isFollowing: currentUser ? user.followers.includes(currentUser.id) : false,
      isCurrentUser: currentUser?.id === user.id,
      isAdmin: user.isAdmin
    };

    return NextResponse.json(userResponse);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: Update user profile (only by the user themselves or admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const store = RecipeStore.getInstance();
    const user = store.getUserByUsername(params.username);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if current user can update this profile
    if (currentUser.id !== user.id && !currentUser.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { displayName, bio, avatarUrl, coverImageUrl } = body;

    // Validate required fields
    if (!displayName || displayName.trim().length === 0) {
      return NextResponse.json(
        { error: 'Display name is required' },
        { status: 400 }
      );
    }

    // Update user
    const updatedUser = store.updateUser(user.id, {
      displayName: displayName.trim(),
      bio: bio?.trim() || '',
      avatarUrl: avatarUrl?.trim() || user.avatarUrl,
      coverImageUrl: coverImageUrl?.trim() || user.coverImageUrl
    });

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      );
    }

    // Return updated user data (excluding sensitive info)
    const userResponse = {
      id: updatedUser.id,
      username: updatedUser.username,
      displayName: updatedUser.displayName,
      bio: updatedUser.bio,
      avatarUrl: updatedUser.avatarUrl,
      coverImageUrl: updatedUser.coverImageUrl,
      joinDate: updatedUser.joinDate,
      followers: updatedUser.followers.length,
      following: updatedUser.following.length,
      recipeCount: updatedUser.recipeCount,
      isAdmin: updatedUser.isAdmin
    };

    return NextResponse.json(userResponse);
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Delete user account (only by the user themselves or admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const store = RecipeStore.getInstance();
    const user = store.getUserByUsername(params.username);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if current user can delete this account
    if (currentUser.id !== user.id && !currentUser.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Prevent deleting the last admin account
    if (user.isAdmin) {
      const allUsers = store.getAllUsers();
      const adminUsers = allUsers.filter(u => u.isAdmin);
      if (adminUsers.length <= 1) {
        return NextResponse.json(
          { error: 'Cannot delete the last admin account' },
          { status: 400 }
        );
      }
    }

    // Delete user and all their recipes
    const success = store.deleteUser(user.id);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete user' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}