import * as React from 'react'
import { cn } from '@/lib/utils'

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string
  alt?: string
  fallback?: string
  size?: 'sm' | 'default' | 'lg' | 'xl'
  status?: 'online' | 'offline' | 'away' | 'busy'
  shape?: 'circle' | 'rounded'
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  default: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
}

const statusColors = {
  online: 'bg-green-500',
  offline: 'bg-gray-400',
  away: 'bg-yellow-500',
  busy: 'bg-red-500',
}

const shapeClasses = {
  circle: 'rounded-full',
  rounded: 'rounded-lg',
}

export function Avatar({
  src,
  alt,
  fallback,
  size = 'default',
  status,
  shape = 'circle',
  className,
  ...props
}: AvatarProps) {
  const [imgError, setImgError] = React.useState(false)

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const renderFallback = () => {
    if (fallback) {
      return getInitials(fallback)
    }
    return '?'
  }

  const gradientColors = [
    'from-primary to-purple-600',
    'from-blue-500 to-cyan-500',
    'from-green-500 to-emerald-600',
    'from-yellow-500 to-orange-500',
    'from-pink-500 to-rose-600',
    'from-indigo-500 to-purple-500',
  ]

  const getGradient = (str: string) => {
    const hash = str.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc)
    }, 0)
    return gradientColors[Math.abs(hash) % gradientColors.length]
  }

  return (
    <div className={cn('relative inline-block', className)} {...props}>
      <div
        className={cn(
          'overflow-hidden bg-gradient-to-br',
          !src || imgError ? getGradient(fallback || 'default') : '',
          sizeClasses[size],
          shapeClasses[shape],
          'flex items-center justify-center font-semibold text-white shadow-sm'
        )}
      >
        {src && !imgError ? (
          <img
            src={src}
            alt={alt}
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <span>{renderFallback()}</span>
        )}
      </div>
      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full border-2 border-background',
            statusColors[status]
          )}
        />
      )}
    </div>
  )
}