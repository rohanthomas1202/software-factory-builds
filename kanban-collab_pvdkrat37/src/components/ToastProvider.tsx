'use client';

import { useEffect, useState } from 'react';
import Toast from './Toast';
import { toastStore } from '@/lib/toast';
import type { Toast as ToastType } from '@/lib/toast';

export default function ToastProvider() {
  const [toasts, setToasts] = useState<ToastType[]>([]);

  useEffect(() => {
    const unsubscribe = toastStore.subscribe((newToasts) => {
      setToasts(newToasts);
    });

    return unsubscribe;
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  );
}