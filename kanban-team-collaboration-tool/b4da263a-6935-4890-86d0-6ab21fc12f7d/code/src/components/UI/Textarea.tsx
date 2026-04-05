'use client';

import { cn } from '@/lib/utils';
import { forwardRef, TextareaHTMLAttributes } from 'react';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: 'default' | 'filled' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  error?: boolean;
  success?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  label?: string;
  helperText?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      variant = 'default',
      size = 'md',
      error = false,
      success = false,
      disabled = false,
      fullWidth = false,
      label,
      helperText,
      startIcon,
      endIcon,
      id,
      ...props
    },
    ref
  ) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

    const variantClasses = {
      default: 'bg-white border border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200',
      filled: 'bg-gray-50 border border-gray-200 hover:bg-gray-100 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200',
      outline: 'bg-transparent border-2 border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200',
    };

    const sizeClasses = {
      sm: 'px-3 py-2 text-sm rounded-md',
      md: 'px-4 py-3 text-base rounded-lg',
      lg: 'px-5 py-4 text-lg rounded-lg',
    };

    const stateClasses = {
      error: 'border-red-500 focus:border-red-500 focus:ring-red-200',
      success: 'border-green-500 focus:border-green-500 focus:ring-green-200',
      disabled: 'opacity-50 cursor-not-allowed bg-gray-100',
    };

    return (
      <div className={cn('flex flex-col gap-2', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={textareaId}
            className={cn(
              'text-sm font-medium text-gray-700',
              error && 'text-red-600',
              success && 'text-green-600',
              disabled && 'text-gray-400'
            )}
          >
            {label}
          </label>
        )}

        <div className="relative">
          {startIcon && (
            <div className="absolute left-3 top-3.5 text-gray-400">
              {startIcon}
            </div>
          )}

          <textarea
            id={textareaId}
            ref={ref}
            disabled={disabled}
            className={cn(
              'block w-full resize-y min-h-[80px] transition-all duration-200',
              'placeholder:text-gray-400',
              'focus:outline-none',
              variantClasses[variant],
              sizeClasses[size],
              error && stateClasses.error,
              success && stateClasses.success,
              disabled && stateClasses.disabled,
              startIcon && 'pl-10',
              endIcon && 'pr-10',
              fullWidth && 'w-full',
              className
            )}
            {...props}
          />

          {endIcon && (
            <div className="absolute right-3 top-3.5 text-gray-400">
              {endIcon}
            </div>
          )}
        </div>

        {helperText && (
          <p
            className={cn(
              'text-xs',
              error && 'text-red-600',
              success && 'text-green-600',
              !error && !success && 'text-gray-500'
            )}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export { Textarea };