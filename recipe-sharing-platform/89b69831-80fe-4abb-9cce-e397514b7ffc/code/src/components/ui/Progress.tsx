import React from 'react';
import { cn } from '@/lib/utils';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'danger';
  showValue?: boolean;
  valuePosition?: 'inside' | 'outside';
  label?: string;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      className,
      value,
      max = 100,
      size = 'md',
      variant = 'default',
      showValue = false,
      valuePosition = 'outside',
      label,
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    
    const sizeClasses = {
      sm: 'h-1.5',
      md: 'h-2.5',
      lg: 'h-4'
    };

    const variantClasses = {
      default: 'bg-blue-600',
      success: 'bg-green-600',
      warning: 'bg-yellow-500',
      danger: 'bg-red-600'
    };

    const variantBgClasses = {
      default: 'bg-blue-100',
      success: 'bg-green-100',
      warning: 'bg-yellow-100',
      danger: 'bg-red-100'
    };

    const valueText = `${Math.round(percentage)}%`;

    return (
      <div className={cn('w-full', className)} ref={ref} {...props}>
        {(label || (showValue && valuePosition === 'outside')) && (
          <div className="flex justify-between items-center mb-1">
            {label && (
              <span className="text-sm font-medium text-gray-700">{label}</span>
            )}
            {showValue && valuePosition === 'outside' && (
              <span className="text-sm font-medium text-gray-700">{valueText}</span>
            )}
          </div>
        )}
        
        <div 
          className={cn(
            'w-full overflow-hidden rounded-full',
            variantBgClasses[variant],
            sizeClasses[size]
          )}
        >
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300 ease-in-out',
              variantClasses[variant]
            )}
            style={{ width: `${percentage}%` }}
          >
            {showValue && valuePosition === 'inside' && (
              <div className="flex items-center justify-center h-full">
                <span className={cn(
                  'text-xs font-semibold px-1',
                  percentage > 50 ? 'text-white' : 'text-gray-700'
                )}>
                  {valueText}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

Progress.displayName = 'Progress';

export { Progress };