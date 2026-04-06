"use client";

import { useState, useEffect, useCallback } from "react";
import type { Notification } from "@/lib/types";

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refetch: () => Promise<void>;
}

export function useNotifications(pollInterval = 30000): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications");
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to fetch notifications" }));
        throw new Error(errorData.error || "Failed to fetch notifications");
      }

      const data = await response.json();
      if (data.data) {
        setNotifications(data.data);
        setError(null);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch notifications");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: "PATCH",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to mark as read" }));
        throw new Error(errorData.error || "Failed to mark as read");
      }

      // Optimistic update
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (err) {
      // Revert optimistic update on error
      await fetchNotifications();
      throw err;
    }
  }, [fetchNotifications]);

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications/read-all", {
        method: "PATCH",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to mark all as read" }));
        throw new Error(errorData.error || "Failed to mark all as read");
      }

      // Optimistic update
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, read: true }))
      );
    } catch (err) {
      // Revert optimistic update on error
      await fetchNotifications();
      throw err;
    }
  }, [fetchNotifications]);

  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(fetchNotifications, pollInterval);
    return () => clearInterval(interval);
  }, [fetchNotifications, pollInterval]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
}