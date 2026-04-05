'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { TrendingUp, TrendingDown, Minus, AlertCircle, CheckCircle, Clock, Folder, Users } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon?: ReactNode
  trend?: {
    value: number
    direction: 'up' | 'down' | 'neutral'
  }
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
  className?: string
}

const variantClasses = {
  default: 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
  primary: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
  secondary: 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700',
  success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
  warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
  danger: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
}

const iconVariants = {
  default: 'text-gray-600 dark:text-gray-400',
  primary: 'text-blue-600 dark:text-blue-400',
  secondary: 'text-gray-600 dark:text-gray-400',
  success: 'text-green-600 dark:text-green-400',
  warning: 'text-yellow-600 dark:text-yellow-400',
  danger: 'text-red-600 dark:text-red-400',
}

export function StatCard({
  title,
  value,
  description,
  icon,
  trend,
  variant = 'default',
  className,
}: StatCardProps) {
  const TrendIcon = trend?.direction === 'up' ? TrendingUp : 
                    trend?.direction === 'down' ? TrendingDown : Minus;
  
  const trendColor = trend?.direction === 'up' ? 'text-green-600 dark:text-green-400' :
                     trend?.direction === 'down' ? 'text-red-600 dark:text-red-400' :
                     'text-gray-600 dark:text-gray-400';

  return (
    <div className={cn(
      'rounded-xl border p-6 transition-all hover:shadow-lg',
      variantClasses[variant],
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
              {value}
            </h3>
            {trend && (
              <Badge
                variant={trend.direction === 'up' ? 'success' : 
                        trend.direction === 'down' ? 'danger' : 'secondary'}
                className="flex items-center gap-1"
              >
                <TrendIcon className="h-3 w-3" />
                <span>{trend.value}%</span>
              </Badge>
            )}
          </div>
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
        {icon && (
          <div className={cn(
            'rounded-lg p-2',
            iconVariants[variant]
          )}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}