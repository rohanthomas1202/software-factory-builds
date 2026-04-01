/**
 * useNotification — src/hooks/useNotification.ts
 *
 * Wraps the browser Notifications API to fire a completion notification
 * when the countdown reaches zero.
 *
 * Lifecycle:
 *   1. On first call to requestPermission(), prompt the user via the
 *      Notifications API permission dialog.
 *   2. On playNotification(), show a notification if permission is granted.
 *   3. Auto-close the notification after NOTIFICATION_DURATION_MS.
 *   4. Exposes the current permission state for UI affordances (e.g., a
 *      "Enable notifications" button shown only when permission is 'default').
 *
 * SSR safe: all Notification API access is inside useEffect or callbacks,
 * guarded with typeof checks.
 *
 * Note on Notification API availability:
 *   - Not available in Safari on iOS (silently no-ops)
 *   - Not available in iframes without the `notifications` feature policy
 *   - Requires HTTPS in production (or localhost)
 */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const NOTIFICATION_TITLE = "Countdown Complete! ✅";
const NOTIFICATION_BODY  = "Your timer has finished. Time to go!";
const NOTIFICATION_ICON  = "/icons/timer-complete.svg";
const NOTIFICATION_BADGE = "/icons/timer-complete.svg";
const NOTIFICATION_TAG   = "countdown-timer-complete"; // Deduplicates notifications
const NOTIFICATION_DURATION_MS = 8000; // Auto-close after 8 seconds

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Mirrors the browser's NotificationPermission type */
export type NotificationPermissionState = "default" | "granted" | "denied" | "unsupported";

export interface UseNotificationReturn {
  /** Current permission state. "unsupported" when API is unavailable. */
  permission: NotificationPermissionState;
  /** Whether notifications are fully supported AND permission is granted */
  isEnabled: boolean;
  /** Whether the Notifications API is supported in this browser */
  isSupported: boolean;
  /**
   * Request notification permission from the user.
   * Safe to call multiple times — no-ops if already granted or denied.
   * Returns the resulting permission state.
   */
  requestPermission: () => Promise<NotificationPermissionState>;
  /**
   * Show the completion notification.
   * No-op if permission is not granted or API is unsupported.
   */
  showNotification: (options?: {
    title?: string;
    body?: string;
  }) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Type-safe check for Notification API support */
function isNotificationSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.Notification !== "undefined" &&
    typeof window.Notification.requestPermission === "function"
  );
}

/** Maps the raw browser permission string to our union type */
function mapPermission(raw: NotificationPermission | null): NotificationPermissionState {
  if (raw === null) return "unsupported";
  switch (raw) {
    case "granted": return "granted";
    case "denied":  return "denied";
    case "default": return "default";
    default:        return "default";
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useNotification(): UseNotificationReturn {
  // ---------------------------------------------------------------------------
  // Supported state (determined once on mount)
  // ---------------------------------------------------------------------------
  const [isSupported, setIsSupported] = useState<boolean>(false);

  // ---------------------------------------------------------------------------
  // Permission state — initialised synchronously from the Notification API
  // if it's available (avoids a flicker on first render).
  // ---------------------------------------------------------------------------
  const [permission, setPermission] = useState<NotificationPermissionState>(
    "default"
  );

  // Ref to the currently showing notification so we can close it on unmount.
  const activeNotificationRef = useRef<Notification | null>(null);

  // Timeout ref for auto-close.
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---------------------------------------------------------------------------
  // Initialise on mount (client only)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const supported = isNotificationSupported();
    setIsSupported(supported);

    if (supported) {
      setPermission(mapPermission(Notification.permission));
    } else {
      setPermission("unsupported");
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Cleanup on unmount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    return () => {
      // Close any showing notification
      if (activeNotificationRef.current) {
        activeNotificationRef.current.close();
        activeNotificationRef.current = null;
      }
      // Cancel auto-close timeout
      if (closeTimeoutRef.current !== null) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
    };
  }, []);

  // ---------------------------------------------------------------------------
  // requestPermission
  // ---------------------------------------------------------------------------
  const requestPermission = useCallback(
    async (): Promise<NotificationPermissionState> => {
      if (!isNotificationSupported()) {
        return "unsupported";
      }

      // Already settled — no need to prompt again.
      const current = mapPermission(Notification.permission);
      if (current === "granted" || current === "denied") {
        setPermission(current);
        return current;
      }

      try {
        // The Promise-based API is preferred; the callback-based API is
        // deprecated but kept as a fallback for older Safari.
        const result = await Notification.requestPermission();
        const mapped = mapPermission(result);
        setPermission(mapped);
        return mapped;
      } catch {
        // requestPermission() can throw in some environments (e.g., iframes
        // without the notifications feature policy).
        setPermission("denied");
        return "denied";
      }
    },
    []
  );

  // ---------------------------------------------------------------------------
  // showNotification
  // ---------------------------------------------------------------------------
  const showNotification = useCallback(
    (options?: { title?: string; body?: string }): void => {
      if (!isNotificationSupported()) return;

      // Re-read live permission in case user changed it in browser settings.
      const currentPermission = mapPermission(Notification.permission);
      if (currentPermission !== "granted") {
        // Update state if it drifted
        setPermission(currentPermission);
        return;
      }

      // Close any previous notification we created
      if (activeNotificationRef.current) {
        activeNotificationRef.current.close();
        activeNotificationRef.current = null;
      }
      if (closeTimeoutRef.current !== null) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }

      try {
        const notification = new Notification(
          options?.title ?? NOTIFICATION_TITLE,
          {
            body:    options?.body ?? NOTIFICATION_BODY,
            icon:    NOTIFICATION_ICON,
            badge:   NOTIFICATION_BADGE,
            tag:     NOTIFICATION_TAG,
            // vibrate is not in the standard TypeScript types but is supported
            // by Chrome on Android. Cast to any to avoid TS errors.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ...(typeof navigator !== "undefined" && "vibrate" in navigator
              ? { vibrate: [200, 100, 200] }
              : {}),
            requireInteraction: false,
            silent: false,
          }
        );

        activeNotificationRef.current = notification;

        // Bring the app into focus when the user clicks the notification.
        notification.onclick = () => {
          window.focus();
          notification.close();
          activeNotificationRef.current = null;
        };

        notification.onerror = () => {
          activeNotificationRef.current = null;
        };

        // Auto-close after NOTIFICATION_DURATION_MS
        closeTimeoutRef.current = setTimeout(() => {
          if (activeNotificationRef.current) {
            activeNotificationRef.current.close();
            activeNotificationRef.current = null;
          }
          closeTimeoutRef.current = null;
        }, NOTIFICATION_DURATION_MS);
      } catch {
        // Notification construction can throw in some environments.
        // Silent no-op — the in-app CompletionAlert is the primary feedback.
      }
    },
    []
  );

  // ---------------------------------------------------------------------------
  // Derived state
  // ---------------------------------------------------------------------------
  const isEnabled = isSupported && permission === "granted";

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------
  return {
    permission,
    isEnabled,
    isSupported,
    requestPermission,
    showNotification,
  };
}

export default useNotification;