'use client';

import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef } from 'react';

const switchVariants = cva(
  'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-200',
        destructive: 'data-[state=checked]:bg-red-600 data-[state=unchecked]:bg-gray-200',
        success: 'data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-200',
        warning: 'data-[state=checked]:bg-amber-500 data-[state=unchecked]:bg-gray-200',
      },
      size: {
        default: 'h-6 w-11',
        sm: 'h-5 w-9',
        lg: 'h-7 w-14',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const thumbVariants = cva(
  'pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ease-in-out',
  {
    variants: {
      size: {
        default: 'h-5 w-5 data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0',
        sm: 'h-4 w-4 data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0',
        lg: 'h-6 w-6 data-[state=checked]:translate-x-7 data-[state=unchecked]:translate-x-0',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

export interface SwitchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof switchVariants> {
  label?: string;
  description?: string;
  labelPosition?: 'left' | 'right';
  loading?: boolean;
}

const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  (
    {
      className,
      variant,
      size,
      label,
      description,
      labelPosition = 'right',
      checked,
      disabled,
      loading,
      onChange,
      ...props
    },
    ref
  ) => {
    const isChecked = checked || props.defaultChecked || false;

    return (
      <div className={cn('flex items-start gap-3', className)}>
        {label && labelPosition === 'left' && (
          <div className="flex flex-col">
            <label
              className={cn(
                'text-sm font-medium leading-none cursor-pointer select-none',
                disabled && 'cursor-not-allowed opacity-50'
              )}
              htmlFor={props.id}
            >
              {label}
            </label>
            {description && (
              <p className="text-sm text-gray-500 mt-1">{description}</p>
            )}
          </div>
        )}
        
        <div className="flex items-center">
          <input
            ref={ref}
            type="checkbox"
            className="sr-only"
            checked={checked}
            disabled={disabled || loading}
            onChange={onChange}
            {...props}
          />
          <label
            htmlFor={props.id}
            className={cn(
              switchVariants({ variant, size }),
              disabled && 'cursor-not-allowed',
              loading && 'relative overflow-hidden'
            )}
            data-state={isChecked ? 'checked' : 'unchecked'}
            aria-disabled={disabled || loading}
          >
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              </div>
            )}
            <span
              className={cn(
                thumbVariants({ size }),
                loading && 'opacity-0'
              )}
              data-state={isChecked ? 'checked' : 'unchecked'}
            />
          </label>
        </div>

        {label && labelPosition === 'right' && (
          <div className="flex flex-col">
            <label
              className={cn(
                'text-sm font-medium leading-none cursor-pointer select-none',
                disabled && 'cursor-not-allowed opacity-50'
              )}
              htmlFor={props.id}
            >
              {label}
            </label>
            {description && (
              <p className="text-sm text-gray-500 mt-1">{description}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Switch.displayName = 'Switch';

export { Switch, switchVariants };