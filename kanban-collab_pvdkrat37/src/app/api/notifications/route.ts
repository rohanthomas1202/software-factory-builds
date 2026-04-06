import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { findNotificationsByUserId } from '@/lib/store';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const notifications = findNotificationsByUserId(currentUser.id);
    
    // Sort by createdAt descending (newest first)
    const sortedNotifications = notifications.sort((a, b) => b.createdAt - a.createdAt);

    return NextResponse.json({ data: sortedNotifications });
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';