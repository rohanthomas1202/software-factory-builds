'use client'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { TaskPriority } from '@/lib/types'
import { AlertCircle, ArrowUp, ArrowDown, Minus, Flag } from 'lucide-react'

interface PriorityBadgeProps {
  priority: TaskPriority
  size?: 'sm' | 'default' | 'lg'
  showIcon?: boolean
  showText?: boolean
  className?: string
}

export function PriorityBadge({ 
  priority, 
  size = 'default', 
  showIcon = true, 
  showText = true,
  className 
}: PriorityBadgeProps) {
  const config = {
    critical: {
      label: 'Critical',
      icon: AlertCircle,
      className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
      iconClassName: 'text-red-600 dark:text-red-400'
    },
    high: {
      label: 'High',
      icon: ArrowUp,
      className: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
      iconClassName: 'text-orange-600 dark:text-orange-400'
    },
    medium: {
      label: 'Medium',
      icon: Minus,
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800',
      iconClassName: 'text-yellow-600 dark:text-yellow-400'
    },
    low: {
      label: 'Low',
      icon: ArrowDown,
      className: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
      iconClassName: 'text-blue-600 dark:text-blue-400'
    },
    none: {
      label: 'None',
      icon: Flag,
      className: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
      iconClassName: 'text-gray-600 dark:text-gray-400'
    }
  }

  const { label, icon: Icon, className: badgeClassName, iconClassName } = config[priority]

  return (
    <Badge
      variant="outline"
      className={cn(
        'inline-flex items-center gap-1.5 font-medium',
        size === 'sm' && 'px-1.5 py-0.5 text-xs',
        size === 'default' && 'px-2 py-1 text-sm',
        size === 'lg' && 'px-3 py-1.5',
        badgeClassName,
        className
      )}
    >
      {showIcon && <Icon className={cn('h-3 w-3', iconClassName)} />}
      {showText && label}
    </Badge>
  )
}