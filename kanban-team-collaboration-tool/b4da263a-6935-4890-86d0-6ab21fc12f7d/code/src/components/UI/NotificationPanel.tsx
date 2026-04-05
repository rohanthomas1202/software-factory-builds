'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './Button';
import { Badge } from './Badge';
import { Avatar } from './Avatar';
import { Notification } from '@/lib/types';
import { Bell, Check, X, Clock, AlertCircle, CheckCircle, Info, UserPlus } from 'lucide-react';

export interface NotificationPanelProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: (notificationIds: string[]) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  className?: string;
  maxHeight?: string;
}

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'task_assigned':
      return <UserPlus className="h-4 w-4 text-blue-500" />;
    case 'task_completed':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'task_due_soon':
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case 'task_overdue':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    case 'comment_mention':
      return <Info className="h-4 w-4 text-purple-500" />;
    default:
      return <Bell className="h-4 w-4 text-gray-500" />;
  }
};

const getNotificationColor = (type: Notification['type']) => {
  switch (type) {
    case 'task_assigned':
      return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    case 'task_completed':
      return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
    case 'task_due_soon':
      return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
    case 'task_overdue':
      return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
    case 'comment_mention':
      return 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800';
    default:
      return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
  }
};

export const NotificationPanel = ({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  className,
  maxHeight = '400px',
}: NotificationPanelProps) => {
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(
    new Set()
  );

  const handleSelectNotification = (notificationId: string) => {
    const newSelected = new Set(selectedNotifications);
    if (newSelected.has(notificationId)) {
      newSelected.delete(notificationId);
    } else {
      newSelected.add(notificationId);
    }
    setSelectedNotifications(newSelected);
  };

  const handleMarkSelectedAsRead = () => {
    if (selectedNotifications.size > 0) {
      onMarkAsRead(Array.from(selectedNotifications));
      setSelectedNotifications(new Set());
    }
  };

  const formatTime = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const unreadNotifications = notifications.filter((n) => !n.read);
  const readNotifications = notifications.filter((n) => n.read);

  return (
    <div
      className={cn(
        'w-80 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <Badge variant="destructive" size="sm">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {selectedNotifications.size > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkSelectedAsRead}
                className="text-xs"
              >
                <Check className="h-3 w-3 mr-1" />
                Mark read
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onMarkAllAsRead}
              className="text-xs"
              disabled={unreadCount === 0}
            >
              Mark all read
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClearAll}
              className="text-xs"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div
        className="overflow-y-auto"
        style={{ maxHeight }}
      >
        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
              <Bell className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No notifications yet
            </p>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              You're all caught up!
            </p>
          </div>
        ) : (
          <>
            {unreadNotifications.length > 0 && (
              <div className="px-4 py-2">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  New
                </p>
              </div>
            )}
            {unreadNotifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  'border-b border-gray-100 dark:border-gray-800 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors',
                  getNotificationColor(notification.type),
                  selectedNotifications.has(notification.id) &&
                    'bg-blue-50 dark:bg-blue-900/30'
                )}
                onClick={() => handleSelectNotification(notification.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    {notification.sender ? (
                      <Avatar
                        user={notification.sender}
                        size="sm"
                        showStatus
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                        {getNotificationIcon(notification.type)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white">
                      {notification.message}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTime(notification.createdAt)}
                      </span>
                      {notification.metadata?.taskTitle && (
                        <span className="text-xs text-gray-400 dark:text-gray-500 truncate">
                          • {notification.metadata.taskTitle}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <div
                      className={cn(
                        'h-2 w-2 rounded-full',
                        notification.read
                          ? 'bg-transparent'
                          : 'bg-blue-500'
                      )}
                    />
                  </div>
                </div>
              </div>
            ))}

            {readNotifications.length > 0 && (
              <>
                <div className="px-4 py-2">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Earlier
                  </p>
                </div>
                {readNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      'border-b border-gray-100 dark:border-gray-800 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors opacity-75',
                      getNotificationColor(notification.type),
                      selectedNotifications.has(notification.id) &&
                        'bg-blue-50 dark:bg-blue-900/30'
                    )}
                    onClick={() => handleSelectNotification(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        {notification.sender ? (
                          <Avatar
                            user={notification.sender}
                            size="sm"
                            showStatus
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                            {getNotificationIcon(notification.type)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 dark:text-white">
                          {notification.message}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatTime(notification.createdAt)}
                          </span>
                          {notification.metadata?.taskTitle && (
                            <span className="text-xs text-gray-400 dark:text-gray-500 truncate">
                              • {notification.metadata.taskTitle}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {selectedNotifications.size > 0
                ? `${selectedNotifications.size} selected`
                : `${notifications.length} total`}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedNotifications(new Set())}
              disabled={selectedNotifications.size === 0}
              className="text-xs"
            >
              Clear selection
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};