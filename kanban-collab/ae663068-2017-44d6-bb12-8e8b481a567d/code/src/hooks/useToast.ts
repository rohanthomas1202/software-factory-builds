'use client';

import { useCallback } from 'react';
import { toast as toastStore } from '@/lib/toast';
import type { ToastType } from '@/lib/toast';

interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
}

export function useToast() {
  const toast = useCallback(({ message, type = 'info', duration = 5000 }: ToastOptions) => {
    const id = Math.random().toString(36).substring(2, 9);
    toastStore.set({
      id,
      message,
      type,
      duration,
    });

    // Auto-dismiss
    setTimeout(() => {
      toastStore.dismiss(id);
    }, duration);
  }, []);

  const dismiss = useCallback((id: string) => {
    toastStore.dismiss(id);
  }, []);

  const dismissAll = useCallback(() => {
    toastStore.dismissAll();
  }, []);

  return {
    toast,
    dismiss,
    dismissAll,
  };
}