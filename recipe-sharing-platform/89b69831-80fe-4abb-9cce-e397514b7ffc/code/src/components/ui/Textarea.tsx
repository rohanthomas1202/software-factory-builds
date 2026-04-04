import React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  maxLength?: number;
  showCount?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    { className, label, error, helperText, maxLength, showCount, id, value, ...props },
    ref
  ) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
    const currentLength = typeof value === 'string' ? value.length : 0;

    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-1.5">
          {label && (
            <label
              htmlFor={textareaId}
              className="block text-sm font-medium text-secondary-700 dark:text-secondary-300"
            >
              {label}
            </label>
          )}
          {showCount && maxLength && (
            <span
              className={cn(
                'text-xs',
                currentLength > maxLength
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-secondary-500 dark:text-secondary-400'
              )}
            >
              {currentLength}/{maxLength}
            </span>
          )}
        </div>
        <textarea
          id={textareaId}
          className={cn(
            'w-full rounded-lg border bg-white dark:bg-secondary-900 text-secondary-900 dark:text-secondary-100',
            'px-3 py-2.5 text-base transition-all duration-200 min-h-[100px]',
            'placeholder:text-secondary-400 dark:placeholder:text-secondary-500',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'resize-y',
            error
              ? 'border-red-500 dark:border-red-500 focus:ring-red-500'
              : 'border-secondary-300 dark:border-secondary-700 hover:border-secondary-400 dark:hover:border-secondary-600',
            className
          )}
          ref={ref}
          maxLength={maxLength}
          value={value}
          {...props}
        />
        {(error || helperText) && (
          <p
            className={cn(
              'mt-1.5 text-sm',
              error
                ? 'text-red-600 dark:text-red-400'
                : 'text-secondary-500 dark:text-secondary-400'
            )}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export { Textarea };