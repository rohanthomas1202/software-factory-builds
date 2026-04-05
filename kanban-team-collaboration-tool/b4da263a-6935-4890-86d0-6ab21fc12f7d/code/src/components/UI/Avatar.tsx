import { cn } from '@/lib/utils';
import { User } from '@/lib/types';
import Image from 'next/image';
import { forwardRef } from 'react';

export interface AvatarProps {
  user?: Pick<User, 'name' | 'avatar'>;
  src?: string;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fallback?: string;
  showStatus?: boolean;
  status?: 'online' | 'offline' | 'away' | 'busy';
  onClick?: () => void;
}

const sizeClasses = {
  xs: 'h-6 w-6 text-xs',
  sm: 'h-8 w-8 text-sm',
  md: 'h-10 w-10 text-base',
  lg: 'h-12 w-12 text-lg',
  xl: 'h-16 w-16 text-xl',
};

const statusSizeClasses = {
  xs: 'h-1.5 w-1.5',
  sm: 'h-2 w-2',
  md: 'h-2.5 w-2.5',
  lg: 'h-3 w-3',
  xl: 'h-4 w-4',
};

const statusPositionClasses = {
  xs: 'bottom-0 right-0',
  sm: 'bottom-0 right-0',
  md: 'bottom-0 right-0',
  lg: 'bottom-1 right-1',
  xl: 'bottom-1 right-1',
};

const statusColorClasses = {
  online: 'bg-green-500 border-2 border-white dark:border-gray-900',
  offline: 'bg-gray-400 border-2 border-white dark:border-gray-900',
  away: 'bg-yellow-500 border-2 border-white dark:border-gray-900',
  busy: 'bg-red-500 border-2 border-white dark:border-gray-900',
};

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      user,
      src,
      alt,
      size = 'md',
      className,
      fallback,
      showStatus = false,
      status = 'online',
      onClick,
    },
    ref
  ) => {
    const imageSrc = src || user?.avatar;
    const imageAlt = alt || user?.name || 'Avatar';
    const initials = fallback || getInitials(user?.name || 'User');

    return (
      <div
        ref={ref}
        className={cn(
          'relative inline-flex items-center justify-center rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 text-gray-700 dark:text-gray-300 font-semibold overflow-hidden select-none',
          sizeClasses[size],
          onClick && 'cursor-pointer hover:opacity-90 transition-opacity',
          className
        )}
        onClick={onClick}
      >
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <span className="flex items-center justify-center w-full h-full">
            {initials}
          </span>
        )}
        {showStatus && (
          <span
            className={cn(
              'absolute rounded-full',
              statusSizeClasses[size],
              statusPositionClasses[size],
              statusColorClasses[status]
            )}
          />
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}