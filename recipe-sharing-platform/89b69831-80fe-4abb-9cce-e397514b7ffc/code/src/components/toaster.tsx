'use client';

import { ToastProvider } from './ui/Toast';

export function Toaster() {
  return (
    <ToastProvider>
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full" />
    </ToastProvider>
  );
}