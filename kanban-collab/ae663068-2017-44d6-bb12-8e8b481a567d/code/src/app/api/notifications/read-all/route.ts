import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { findNotificationsByUserId, updateNotification } from '@/lib/store';

export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const notifications = findNotificationsByUserId(currentUser.id);
    const unreadNotifications = notifications.filter(n => !n.read);
    
    // Mark all unread notifications as read
    unreadNotifications.forEach(notification => {
      updateNotification(notification.id, { read: true });
    });

    return NextResponse.json({ 
      data: { 
        markedCount: unreadNotifications.length,
        message: `Marked ${unreadNotifications.length} notification(s) as read` 
      } 
    });
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark all notifications as read' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';