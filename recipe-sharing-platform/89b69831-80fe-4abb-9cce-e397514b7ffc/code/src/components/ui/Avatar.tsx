import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { User } from 'lucide-react';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fallback?: string;
  status?: 'online' | 'offline' | 'away' | 'busy';
  border?: boolean;
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      className,
      src,
      alt = 'Avatar',
      size = 'md',
      fallback,
      status,
      border = false,
      children,
      ...props
    },
    ref
  ) => {
    const sizes = {
      xs: 'h-6 w-6 text-xs',
      sm: 'h-8 w-8 text-sm',
      md: 'h-10 w-10 text-base',
      lg: 'h-12 w-12 text-lg',
      xl: 'h-16 w-16 text-xl',
    };

    const statusSizes = {
      xs: 'h-1.5 w-1.5',
      sm: 'h-2 w-2',
      md: 'h-2.5 w-2.5',
      lg: 'h-3 w-3',
      xl: 'h-4 w-4',
    };

    const statusColors = {
      online: 'bg-green-500',
      offline: 'bg-secondary-400',
      away: 'bg-yellow-500',
      busy: 'bg-red-500',
    };

    const getInitials = (name: string) => {
      return name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    };

    const renderContent = () => {
      if (src) {
        return (
          <Image
            src={src}
            alt={alt}
            fill
            className="object-cover rounded-full"
            sizes={`${sizes[size].split(' ')[0]} ${sizes[size].split(' ')[1]}`}
          />
        );
      }

      if (fallback) {
        return (
          <span className="font-semibold text-secondary-900 dark:text-secondary-100">
            {getInitials(fallback)}
          </span>
        );
      }

      return <User className="h-1/2 w-1/2 text-secondary-400 dark:text-secondary-500" />;
    };

    return (
      <div
        ref={ref}
        className={cn(
          'relative inline-flex items-center justify-center rounded-full bg-secondary-200 dark:bg-secondary-800',
          sizes[size],
          border && 'ring-2 ring-white dark:ring-secondary-900',
          className
        )}
        {...props}
      >
        <div className="relative h-full w-full rounded-full overflow-hidden flex items-center justify-center">
          {renderContent()}
        </div>
        {status && (
          <span
            className={cn(
              'absolute bottom-0 right-0 rounded-full ring-2 ring-white dark:ring-secondary-900',
              statusColors[status],
              statusSizes[size]
            )}
          />
        )}
        {children}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

export { Avatar };