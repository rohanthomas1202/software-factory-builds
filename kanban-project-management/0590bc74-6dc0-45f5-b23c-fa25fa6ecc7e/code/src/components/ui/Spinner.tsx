import * as React from 'react'
import { cn } from '@/lib/utils'

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'default' | 'lg' | 'xl'
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
}

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size = 'default', variant = 'primary', ...props }, ref) => {
    const sizeClasses = {
      sm: 'h-4 w-4 border-2',
      default: 'h-8 w-8 border-2',
      lg: 'h-12 w-12 border-3',
      xl: 'h-16 w-16 border-4',
    }

    const variantClasses = {
      default: 'border-gray-300 border-t-gray-600',
      primary: 'border-primary/20 border-t-primary',
      secondary: 'border-secondary/20 border-t-secondary',
      success: 'border-green-200 border-t-green-600',
      warning: 'border-yellow-200 border-t-yellow-600',
      danger: 'border-red-200 border-t-red-600',
    }

    return (
      <div
        ref={ref}
        className={cn(
          'inline-block animate-spin rounded-full',
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        {...props}
      >
        <span className="sr-only">Loading...</span>
      </div>
    )
  }
)

Spinner.displayName = 'Spinner'

export { Spinner }