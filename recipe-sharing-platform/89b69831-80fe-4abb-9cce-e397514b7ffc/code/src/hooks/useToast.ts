import { useCallback } from 'react';
import { useToastContext, ToastType } from '@/components/ui/Toast';

export interface ToastOptions {
  title: string;
  description?: string;
  type?: ToastType;
  duration?: number;
}

export const useToast = () => {
  const { addToast, removeToast, clearToasts } = useToastContext();

  const toast = useCallback((options: ToastOptions) => {
    return addToast({
      title: options.title,
      description: options.description,
      type: options.type || 'info',
      duration: options.duration,
    });
  }, [addToast]);

  const success = useCallback((title: string, description?: string) => {
    return toast({ title, description, type: 'success' });
  }, [toast]);

  const error = useCallback((title: string, description?: string) => {
    return toast({ title, description, type: 'error' });
  }, [toast]);

  const warning = useCallback((title: string, description?: string) => {
    return toast({ title, description, type: 'warning' });
  }, [toast]);

  const info = useCallback((title: string, description?: string) => {
    return toast({ title, description, type: 'info' });
  }, [toast]);

  return {
    toast,
    success,
    error,
    warning,
    info,
    removeToast,
    clearToasts,
  };
};