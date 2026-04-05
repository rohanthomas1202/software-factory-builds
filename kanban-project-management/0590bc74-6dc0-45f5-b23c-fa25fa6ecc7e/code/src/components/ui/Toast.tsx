'use client'

import { toast as sonnerToast } from 'sonner'
import { cn } from '@/lib/utils'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'
import { ReactNode } from 'react'

type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'info'

interface ToastOptions {
  title?: string
  description?: string
  variant?: ToastVariant
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
  icon?: ReactNode
  dismissible?: boolean
}

const toast = {
  show: (options: ToastOptions) => {
    const {
      title,
      description,
      variant = 'default',
      duration = 4000,
      action,
      icon,
      dismissible = true,
    } = options

    const variantIcons = {
      default: null,
      success: <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />,
      error: <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />,
      warning: <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />,
      info: <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />,
    }

    const variantClasses = {
      default: 'border bg-background text-foreground',
      success: 'border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-100',
      error: 'border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100',
      warning: 'border-yellow-200 bg-yellow-50 text-yellow-900 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-100',
      info: 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100',
    }

    return sonnerToast.custom((t) => (
      <div
        className={cn(
          'flex w-full max-w-md items-start gap-3 rounded-lg border p-4 shadow-lg',
          variantClasses[variant],
          'animate-in slide-in-from-bottom-4',
          t ? 'opacity-100' : 'opacity-0'
        )}
      >
        {icon || variantIcons[variant]}
        <div className="flex-1 space-y-1">
          {title && <p className="font-medium">{title}</p>}
          {description && <p className="text-sm opacity-90">{description}</p>}
          {action && (
            <button
              type="button"
              onClick={() => {
                action.onClick()
                sonnerToast.dismiss(t)
              }}
              className="mt-2 text-sm font-medium underline underline-offset-2"
            >
              {action.label}
            </button>
          )}
        </div>
        {dismissible && (
          <button
            type="button"
            onClick={() => sonnerToast.dismiss(t)}
            className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        )}
      </div>
    ), {
      duration,
    })
  },

  success: (title: string, description?: string, options?: Omit<ToastOptions, 'title' | 'description' | 'variant'>) => {
    return toast.show({ title, description, variant: 'success', ...options })
  },

  error: (title: string, description?: string, options?: Omit<ToastOptions, 'title' | 'description' | 'variant'>) => {
    return toast.show({ title, description, variant: 'error', ...options })
  },

  warning: (title: string, description?: string, options?: Omit<ToastOptions, 'title' | 'description' | 'variant'>) => {
    return toast.show({ title, description, variant: 'warning', ...options })
  },

  info: (title: string, description?: string, options?: Omit<ToastOptions, 'title' | 'description' | 'variant'>) => {
    return toast.show({ title, description, variant: 'info', ...options })
  },

  dismiss: (id?: string) => {
    sonnerToast.dismiss(id)
  },

  promise: <T,>(
    promise: Promise<T>,
    options: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: Error) => string)
    }
  ) => {
    return sonnerToast.promise(promise, {
      loading: options.loading,
      success: options.success,
      error: options.error,
    })
  },
}

export { toast }