import React from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  rounded?: 'full' | 'lg' | 'md';
  removable?: boolean;
  onRemove?: () => void;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className,
      variant = 'default',
      size = 'md',
      rounded = 'full',
      removable = false,
      onRemove,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'inline-flex items-center font-medium transition-colors';

    const variants = {
      default:
        'bg-secondary-100 dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100',
      primary: 'bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300',
      secondary:
        'bg-secondary-200 dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100',
      success: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
      warning: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
      danger: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
    };

    const sizes = {
      sm: 'text-xs px-2 py-0.5',
      md: 'text-sm px-2.5 py-1',
      lg: 'text-base px-3 py-1.5',
    };

    const roundedStyles = {
      full: 'rounded-full',
      lg: 'rounded-lg',
      md: 'rounded-md',
    };

    return (
      <span
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          roundedStyles[rounded],
          removable && 'pr-1',
          className
        )}
        {...props}
      >
        {children}
        {removable && (
          <button
            type="button"
            onClick={onRemove}
            className="ml-1 h-4 w-4 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors flex items-center justify-center focus:outline-none focus:ring-1 focus:ring-current"
            aria-label="Remove badge"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export { Badge };