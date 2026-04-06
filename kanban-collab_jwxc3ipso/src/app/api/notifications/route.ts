import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { store } from '@/lib/store';
import { CreateNotificationInput, Notification } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const notifications = store.notifications.findByUserId(user.id);
    
    return NextResponse.json({ data: notifications });
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const input: CreateNotificationInput = {
      userId: body.userId,
      commentId: body.commentId,
      cardId: body.cardId,
      read: false,
    };

    // Validate required fields
    if (!input.userId || !input.cardId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const notification: Notification = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };

    store.notifications.create(notification);

    return NextResponse.json(
      { data: notification },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to create notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}