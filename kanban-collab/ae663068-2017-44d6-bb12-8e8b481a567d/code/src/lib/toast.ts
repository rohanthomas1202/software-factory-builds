/**
 * Toast notification store
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

class ToastStore {
  private toasts: Toast[] = [];
  private listeners: Set<(toasts: Toast[]) => void> = new Set();

  get(): Toast[] {
    return this.toasts;
  }

  set(toast: Toast): void {
    this.toasts = [...this.toasts, toast];
    this.notify();
  }

  dismiss(id: string): void {
    this.toasts = this.toasts.filter(toast => toast.id !== id);
    this.notify();
  }

  dismissAll(): void {
    this.toasts = [];
    this.notify();
  }

  subscribe(listener: (toasts: Toast[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach(listener => listener(this.toasts));
  }
}

export const toastStore = new ToastStore();

// Convenience function for creating toasts
export function toast(message: string, type: ToastType = 'info', duration: number = 5000): void {
  const id = Math.random().toString(36).substring(2, 9);
  toastStore.set({ id, message, type, duration });
}