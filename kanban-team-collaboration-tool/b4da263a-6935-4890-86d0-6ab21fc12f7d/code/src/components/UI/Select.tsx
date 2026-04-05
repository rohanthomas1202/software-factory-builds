import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const selectVariants = cva(
  'flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 hover:border-gray-400',
  {
    variants: {
      variant: {
        default: '',
        ghost: 'border-transparent bg-transparent hover:bg-gray-100',
        outline: 'border-gray-300 bg-transparent hover:border-gray-400',
      },
      size: {
        sm: 'h-8 px-2 py-1 text-xs',
        md: 'h-10 px-3 py-2 text-sm',
        lg: 'h-12 px-4 py-3 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement>,
    VariantProps<typeof selectVariants> {
  placeholder?: string;
  error?: boolean;
  success?: boolean;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, variant, size, placeholder, error, success, children, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <select
          className={cn(
            selectVariants({ variant, size }),
            error && 'border-red-500 focus:ring-red-500',
            success && 'border-green-500 focus:ring-green-500',
            className
          )}
          ref={ref}
          {...props}
        >
          {placeholder && (
            <option value="" disabled selected>
              {placeholder}
            </option>
          )}
          {children}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-500 pointer-events-none" />
      </div>
    );
  }
);
Select.displayName = 'Select';

const SelectTrigger = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'default' | 'ghost' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    error?: boolean;
    success?: boolean;
  }
>(({ className, variant = 'default', size = 'md', error, success, children, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        selectVariants({ variant, size }),
        error && 'border-red-500 focus:ring-red-500',
        success && 'border-green-500 focus:ring-green-500',
        'cursor-pointer text-left',
        className
      )}
      {...props}
    >
      <div className="flex w-full items-center justify-between">
        <span className="truncate">{children}</span>
        <ChevronDown className="h-4 w-4 flex-shrink-0 text-gray-500 transition-transform duration-200" />
      </div>
    </button>
  );
});
SelectTrigger.displayName = 'SelectTrigger';

const SelectValue = forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & {
    placeholder?: string;
  }
>(({ className, placeholder, children, ...props }, ref) => {
  return (
    <span
      ref={ref}
      className={cn('truncate', !children && 'text-gray-500', className)}
      {...props}
    >
      {children || placeholder}
    </span>
  );
});
SelectValue.displayName = 'SelectValue';

const SelectContent = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    align?: 'start' | 'center' | 'end';
    sideOffset?: number;
    position?: 'popper' | 'item-aligned';
  }
>(({ className, align = 'start', sideOffset = 4, position = 'popper', children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'absolute z-50 min-w-[8rem] overflow-hidden rounded-lg border border-gray-200 bg-white p-1 shadow-lg animate-in fade-in-80',
        position === 'popper' && 'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
        className
      )}
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        marginTop: sideOffset,
      }}
      {...props}
    >
      <div className="max-h-60 overflow-auto">{children}</div>
    </div>
  );
});
SelectContent.displayName = 'SelectContent';

const SelectItem = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value: string;
    selected?: boolean;
  }
>(({ className, value, selected, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'relative flex cursor-pointer select-none items-center rounded-md px-3 py-2 text-sm outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        selected && 'bg-blue-50 text-blue-600 hover:bg-blue-100',
        className
      )}
      data-value={value}
      {...props}
    >
      <span className="flex-1 truncate">{children}</span>
      {selected && <Check className="ml-2 h-4 w-4 flex-shrink-0" />}
    </div>
  );
});
SelectItem.displayName = 'SelectItem';

const SelectGroup = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('py-1', className)} {...props}>
        {children}
      </div>
    );
  }
);
SelectGroup.displayName = 'SelectGroup';

const SelectLabel = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('px-3 py-2 text-xs font-semibold text-gray-500', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
SelectLabel.displayName = 'SelectLabel';

const SelectSeparator = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('-mx-1 my-1 h-px bg-gray-200', className)} {...props} />
    );
  }
);
SelectSeparator.displayName = 'SelectSeparator';

export {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
};