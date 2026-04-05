'use client';

import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  htmlFor?: string;
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'subtle' | 'ghost';
}

const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ 
    className, 
    htmlFor, 
    required, 
    disabled, 
    error, 
    size = 'md', 
    variant = 'default',
    children, 
    ...props 
  }, ref) => {
    const sizeClasses = {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base',
    };

    const variantClasses = {
      default: 'text-gray-900 dark:text-gray-100',
      subtle: 'text-gray-600 dark:text-gray-400',
      ghost: 'text-gray-500 dark:text-gray-500',
    };

    const stateClasses = {
      disabled: 'opacity-50 cursor-not-allowed',
      error: 'text-red-600 dark:text-red-400',
    };

    return (
      <label
        ref={ref}
        htmlFor={htmlFor}
        className={cn(
          'font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
          sizeClasses[size],
          variantClasses[variant],
          disabled && stateClasses.disabled,
          error && stateClasses.error,
          className
        )}
        {...props}
      >
        {children}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
    );
  }
);

Label.displayName = 'Label';

export { Label };