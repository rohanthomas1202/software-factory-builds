import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { InMemoryStore } from '@/lib/store';
import { Notification, UserRole } from '@/lib/types';

const store = InMemoryStore.getInstance();

// GET /api/notifications - Get notifications for current user
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const type = searchParams.get('type');

    let notifications = store.getUserNotifications(user.id);

    // Apply filters
    if (unreadOnly) {
      notifications = notifications.filter(n => !n.read);
    }

    if (type) {
      notifications = notifications.filter(n => n.type === type);
    }

    // Sort by createdAt descending (newest first)
    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Apply limit
    notifications = notifications.slice(0, limit);

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// POST /api/notifications - Mark notifications as read
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { notificationIds, markAllAsRead } = body;

    if (markAllAsRead) {
      // Mark all user notifications as read
      const notifications = store.getUserNotifications(user.id);
      const unreadNotifications = notifications.filter(n => !n.read);
      
      unreadNotifications.forEach(notification => {
        store.updateNotification(notification.id, { read: true, readAt: new Date() });
      });

      return NextResponse.json({ 
        message: 'All notifications marked as read',
        count: unreadNotifications.length 
      });
    }

    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json(
        { error: 'notificationIds array is required' },
        { status: 400 }
      );
    }

    // Validate that all notification IDs belong to the current user
    const userNotifications = store.getUserNotifications(user.id);
    const userNotificationIds = userNotifications.map(n => n.id);
    
    const invalidIds = notificationIds.filter(id => !userNotificationIds.includes(id));
    if (invalidIds.length > 0) {
      return NextResponse.json(
        { error: 'Some notification IDs are invalid or do not belong to the user', invalidIds },
        { status: 403 }
      );
    }

    // Mark specified notifications as read
    const updatedNotifications = notificationIds.map(id => 
      store.updateNotification(id, { read: true, readAt: new Date() })
    );

    return NextResponse.json({ 
      message: 'Notifications marked as read',
      count: updatedNotifications.length,
      notifications: updatedNotifications 
    });
  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}

// DELETE /api/notifications - Delete notifications
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const notificationId = searchParams.get('id');
    const deleteAll = searchParams.get('deleteAll') === 'true';

    if (deleteAll) {
      // Delete all user notifications
      const notifications = store.getUserNotifications(user.id);
      notifications.forEach(notification => {
        store.deleteNotification(notification.id);
      });

      return NextResponse.json({ 
        message: 'All notifications deleted',
        count: notifications.length 
      });
    }

    if (!notificationId) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      );
    }

    // Validate that the notification belongs to the current user
    const userNotifications = store.getUserNotifications(user.id);
    const notification = userNotifications.find(n => n.id === notificationId);
    
    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found or does not belong to the user' },
        { status: 404 }
      );
    }

    // Delete the notification
    store.deleteNotification(notificationId);

    return NextResponse.json({ 
      message: 'Notification deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting notifications:', error);
    return NextResponse.json(
      { error: 'Failed to delete notifications' },
      { status: 500 }
    );
  }
}