'use client';

import { useState, useEffect, useCallback } from 'react';
import { Notification } from '@/lib/types';
import { toast } from 'react-hot-toast';

interface FetchOptions {
  limit?: number;
  unreadOnly?: boolean;
  type?: string;
  refetch?: boolean;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  fetchNotifications: (options?: FetchOptions) => Promise<void>;
  markAsRead: (notificationIds: string[]) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async (options?: FetchOptions) => {
    try {
      setIsLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (options?.limit) queryParams.set('limit', options.limit.toString());
      if (options?.unreadOnly) queryParams.set('unreadOnly', 'true');
      if (options?.type) queryParams.set('type', options.type);

      const response = await fetch(`/api/notifications?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.statusText}`);
      }

      const data = await response.json();
      setNotifications(data.notifications || []);
      
      // Calculate unread count
      const unread = (data.notifications || []).filter((n: Notification) => !n.read).length;
      setUnreadCount(unread);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch notifications';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (notificationIds: string[]) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationIds }),
      });

      if (!response.ok) {
        throw new Error(`Failed to mark notifications as read: ${response.statusText}`);
      }

      // Update local state
      setNotifications(prev =>
        prev.map(notification =>
          notificationIds.includes(notification.id)
            ? { ...notification, read: true, readAt: new Date() }
            : notification
        )
      );

      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - notificationIds.length));

      toast.success('Notifications marked as read');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark notifications as read';
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ markAllAsRead: true }),
      });

      if (!response.ok) {
        throw new Error(`Failed to mark all notifications as read: ${response.statusText}`);
      }

      // Update local state
      setNotifications(prev =>
        prev.map(notification => ({
          ...notification,
          read: true,
          readAt: new Date(),
        }))
      );

      // Reset unread count
      setUnreadCount(0);

      toast.success('All notifications marked as read');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark all notifications as read';
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications?id=${notificationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete notification: ${response.statusText}`);
      }

      // Update local state
      const notificationToDelete = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));

      // Update unread count if the deleted notification was unread
      if (notificationToDelete && !notificationToDelete.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      toast.success('Notification deleted');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete notification';
      toast.error(errorMessage);
      throw err;
    }
  }, [notifications]);

  const deleteAllNotifications = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications?deleteAll=true', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete all notifications: ${response.statusText}`);
      }

      // Clear local state
      setNotifications([]);
      setUnreadCount(0);

      toast.success('All notifications deleted');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete all notifications';
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Set up polling for new notifications (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications({ refetch: true });
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
  };
}