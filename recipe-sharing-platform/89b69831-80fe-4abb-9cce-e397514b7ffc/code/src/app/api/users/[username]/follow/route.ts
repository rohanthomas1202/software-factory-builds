import { NextRequest, NextResponse } from 'next/server';
import { RecipeStore } from '@/lib/store';
import { getCurrentUser } from '@/lib/auth';

// POST: Follow or unfollow a user
export async function POST(
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
    const targetUser = store.getUserByUsername(params.username);

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent users from following themselves
    if (currentUser.id === targetUser.id) {
      return NextResponse.json(
        { error: 'Cannot follow yourself' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { action } = body; // 'follow' or 'unfollow'

    if (!action || (action !== 'follow' && action !== 'unfollow')) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "follow" or "unfollow"' },
        { status: 400 }
      );
    }

    let success = false;
    
    if (action === 'follow') {
      // Check if already following
      if (currentUser.following.includes(targetUser.id)) {
        return NextResponse.json(
          { error: 'Already following this user' },
          { status: 400 }
        );
      }
      
      success = store.followUser(currentUser.id, targetUser.id);
    } else {
      // action === 'unfollow'
      // Check if not following
      if (!currentUser.following.includes(targetUser.id)) {
        return NextResponse.json(
          { error: 'Not following this user' },
          { status: 400 }
        );
      }
      
      success = store.unfollowUser(currentUser.id, targetUser.id);
    }

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update follow status' },
        { status: 500 }
      );
    }

    // Get updated user data
    const updatedCurrentUser = store.getUser(currentUser.id);
    const updatedTargetUser = store.getUser(targetUser.id);

    if (!updatedCurrentUser || !updatedTargetUser) {
      return NextResponse.json(
        { error: 'Failed to retrieve updated user data' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      action,
      currentUser: {
        id: updatedCurrentUser.id,
        following: updatedCurrentUser.following.length
      },
      targetUser: {
        id: updatedTargetUser.id,
        username: updatedTargetUser.username,
        followers: updatedTargetUser.followers.length,
        isFollowing: updatedCurrentUser.following.includes(updatedTargetUser.id)
      }
    });
  } catch (error) {
    console.error('Error updating follow status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET: Check if current user is following this user
export async function GET(
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
    const targetUser = store.getUserByUsername(params.username);

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const isFollowing = currentUser.following.includes(targetUser.id);
    const isCurrentUser = currentUser.id === targetUser.id;

    return NextResponse.json({
      isFollowing,
      isCurrentUser,
      targetUser: {
        id: targetUser.id,
        username: targetUser.username,
        displayName: targetUser.displayName,
        followers: targetUser.followers.length,
        following: targetUser.following.length
      }
    });
  } catch (error) {
    console.error('Error checking follow status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}